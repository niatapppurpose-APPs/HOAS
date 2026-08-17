#!/bin/bash
set -e
cd /mnt/c/Projects/HOAS-main/hoas-backend
pkill -f "dev-mongo" 2>/dev/null || true
pkill -f "node src/server" 2>/dev/null || true
sleep 1

node scripts/dev-mongo.js > /tmp/opencode/dev-mongo.log 2>&1 &
MONGO_PID=$!
node scripts/wait-for-mongo.js
node seed.js | tail -2

node src/server.js > /tmp/opencode/hoas-server.log 2>&1 &
SERVER_PID=$!
node scripts/wait-for-health.js

BASE=http://localhost:4000
TOKEN() { curl -s -X POST $BASE/api/dev/token -H "Content-Type: application/json" -d "{\"uid\":\"$1\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])"; }
STU=$(TOKEN seed-student-1)
WAR=$(TOKEN seed-warden)
MNG=$(TOKEN seed-management)
OWN=$(TOKEN seed-owner)

echo "=== LEAVE: student requests ==="
curl -s -X POST $BASE/api/leaves -H "Authorization: Bearer $STU" -H "Content-Type: application/json" -d '{"leaveType":"medical","reason":"Fever","fromDate":"2026-08-20","toDate":"2026-08-22"}' | python3 -c "import sys,json;l=json.load(sys.stdin)['leave'];print('leave:',l['leaveType'],l['status'])"
echo "=== LEAVE: warden approves ==="
LID=$(curl -s "$BASE/api/leaves/warden" -H "Authorization: Bearer $WAR" | python3 -c "import sys,json;print(json.load(sys.stdin)['leaves'][0]['_id'])")
curl -s -X POST $BASE/api/leaves/$LID/decide -H "Authorization: Bearer $WAR" -H "Content-Type: application/json" -d '{"decision":"approve"}' | python3 -c "import sys,json;print('status:',json.load(sys.stdin)['leave']['status'])"

echo "=== OUTING: student requests ==="
OUT_ISO=$(node -e "console.log(new Date(Date.now()+30000).toISOString())")
RET_ISO=$(node -e "console.log(new Date(Date.now()+120000).toISOString())")
curl -s -X POST $BASE/api/outings -H "Authorization: Bearer $STU" -H "Content-Type: application/json" -d "{\"destination\":\"City Mall\",\"reason\":\"Shopping\",\"outTime\":\"$OUT_ISO\"}" | python3 -c "import sys,json;o=json.load(sys.stdin)['outing'];print('outing:',o['destination'],o['status'])"
OID=$(curl -s "$BASE/api/outings/warden" -H "Authorization: Bearer $WAR" | python3 -c "import sys,json;print(json.load(sys.stdin)['outings'][0]['_id'])")
echo "=== OUTING: warden approves with return time ==="
curl -s -X POST $BASE/api/outings/$OID/decide -H "Authorization: Bearer $WAR" -H "Content-Type: application/json" -d "{\"decision\":\"approve\",\"expectedReturnTime\":\"$RET_ISO\"}" | python3 -c "import sys,json;print('status:',json.load(sys.stdin)['outing']['status'])"
echo "=== OUTING: student marks return (after out time) ==="
sleep 35
curl -s -X POST $BASE/api/outings/$OID/return -H "Authorization: Bearer $STU" | python3 -c "import sys,json;o=json.load(sys.stdin)['outing'];print('status:',o['status'],'| timing:',o['timingStatus'])"
echo "=== OUTING: history analytics ==="
curl -s "$BASE/api/outings/history" -H "Authorization: Bearer $WAR" | python3 -c "import sys,json;a=json.load(sys.stdin)['analytics'];print('analytics:',a['total'],'total,',a['onTime'],'on-time')"

echo "=== FEES: student uploads proof ==="
curl -s -X POST $BASE/api/fees/proof -H "Authorization: Bearer $STU" -H "Content-Type: application/json" -d '{"proofImageUrl":"https://storage.googleapis.com/hoas/proof1.jpg"}' | python3 -c "import sys,json;f=json.load(sys.stdin)['fee'];print('proof set:',bool(f['proofImageUrl']))"
FID=$(curl -s "$BASE/api/fees/me" -H "Authorization: Bearer $STU" | python3 -c "import sys,json;print(json.load(sys.stdin)['fee']['_id'])")
echo "=== FEES: management verifies ==="
curl -s -X POST $BASE/api/fees/$FID/verify-management -H "Authorization: Bearer $MNG" | python3 -c "import sys,json;print('mng verified:',json.load(sys.stdin)['fee']['isVerifiedByManagement'])"
echo "=== FEES: warden verifies ==="
curl -s -X POST $BASE/api/fees/$FID/verify-warden -H "Authorization: Bearer $WAR" -H "Content-Type: application/json" -d '{"approved":true,"note":"Receipt matches"}' | python3 -c "import sys,json;print('warden verified:',json.load(sys.stdin)['fee']['isVerifiedByWarden'])"
echo "=== FEES: upload records ==="
curl -s -X POST $BASE/api/fees/upload -H "Authorization: Bearer $MNG" -H "Content-Type: application/json" -d '{"collegeId":"'$(curl -s $BASE/api/colleges -H "Authorization: Bearer $MNG" | python3 -c "import sys,json;print(json.load(sys.stdin)['colleges'][0]['_id'])")'","records":[{"email":"student1@demo.test","totalAmount":60000,"paidAmount":60000}]}' | python3 -c "import sys,json;print('upload:',json.load(sys.stdin))"

echo "=== EMERGENCY: student shares location ==="
curl -s -X POST $BASE/api/emergency/share -H "Authorization: Bearer $STU" -H "Content-Type: application/json" -d '{"lat":17.3850,"lng":78.4867,"durationMinutes":30}' | python3 -c "import sys,json;s=json.load(sys.stdin)['session'];print('session active:',s['isActive'],'| expires in mins:',s['durationMinutes'] if 'durationMinutes' in s else 'n/a')"
echo "=== EMERGENCY: warden sees active ==="
curl -s "$BASE/api/emergency/active" -H "Authorization: Bearer $WAR" | python3 -c "import sys,json;print('warden sees:',len(json.load(sys.stdin)['sessions']),'active session(s)')"
echo "=== EMERGENCY: student stops ==="
curl -s -X POST $BASE/api/emergency/stop -H "Authorization: Bearer $STU" | python3 -c "import sys,json;print('stopped:',json.load(sys.stdin)['ok'])"

echo "=== CHAT: student sends message on complaint context ==="
curl -s -X POST $BASE/api/complaints -H "Authorization: Bearer $STU" -H "Content-Type: application/json" -d '{"title":"Fan not working","description":"Room 4 fan is broken","category":"electrical"}' > /dev/null
COMP=$(curl -s "$BASE/api/complaints/my" -H "Authorization: Bearer $STU" | python3 -c "import sys,json;print(json.load(sys.stdin)['complaints'][0]['_id'])")
curl -s -X POST $BASE/api/chat/send -H "Authorization: Bearer $STU" -H "Content-Type: application/json" -d "{\"contextType\":\"complaint\",\"contextId\":\"$COMP\",\"text\":\"Hello warden, any update?\"}" | python3 -c "import sys,json;m=json.load(sys.stdin)['message'];print('message:',m['text'])"
echo "=== CHAT: warden replies ==="
curl -s -X POST $BASE/api/chat/send -H "Authorization: Bearer $WAR" -H "Content-Type: application/json" -d "{\"contextType\":\"complaint\",\"contextId\":\"$COMP\",\"text\":\"Plumber will come today\"}" | python3 -c "import sys,json;m=json.load(sys.stdin)['message'];print('message:',m['text'])"
echo "=== CHAT: fetch conversation ==="
curl -s "$BASE/api/chat/complaint/$COMP" -H "Authorization: Bearer $STU" | python3 -c "import sys,json;d=json.load(sys.stdin);print('messages:',len(d['messages']),'| closed:',d['conversation']['isClosed'])"

echo "=== ANNOUNCEMENT: warden creates ==="
COLID=$(curl -s $BASE/api/colleges -H "Authorization: Bearer $MNG" | python3 -c "import sys,json;print(json.load(sys.stdin)['colleges'][0]['_id'])")
curl -s -X POST $BASE/api/announcements -H "Authorization: Bearer $WAR" -H "Content-Type: application/json" -d "{\"title\":\"Hostel cleaning tomorrow\",\"body\":\"All rooms must be cleaned by 10am\",\"priority\":\"important\",\"collegeId\":\"$COLID\"}" | python3 -c "import sys,json;a=json.load(sys.stdin)['announcement'];print('announcement:',a['title'],'| status:',a['status'])"
echo "=== ANNOUNCEMENT: student lists ==="
curl -s "$BASE/api/announcements" -H "Authorization: Bearer $STU" | python3 -c "import sys,json;print('student sees:',len(json.load(sys.stdin)['announcements']),'announcement(s)')"

echo "=== NOTIFICATION: custom send (owner) ==="
curl -s -X POST $BASE/api/notifications/send -H "Authorization: Bearer $OWN" -H "Content-Type: application/json" -d '{"targetRole":"student","title":"Fee deadline","body":"Pay fees by Friday"}' | python3 -c "import sys,json;print('sent to:',json.load(sys.stdin)['sent'],'students')"
echo "=== NOTIFICATION: student inbox ==="
curl -s "$BASE/api/notifications/me" -H "Authorization: Bearer $STU" | python3 -c "import sys,json;d=json.load(sys.stdin);print('notifications:',len(d['notifications']),'| unread:',d['unread'])"

echo "=== SUPPORT: student opens ticket ==="
curl -s -X POST $BASE/api/support -H "Authorization: Bearer $STU" -H "Content-Type: application/json" -d '{"subject":"App not opening","description":"Login page is blank","category":"technical"}' | python3 -c "import sys,json;t=json.load(sys.stdin)['ticket'];print('ticket:',t['subject'],t['status'])"
echo "=== SUPPORT: owner resolves ==="
TID=$(curl -s "$BASE/api/support" -H "Authorization: Bearer $OWN" | python3 -c "import sys,json;print(json.load(sys.stdin)['tickets'][0]['_id'])")
curl -s -X PATCH $BASE/api/support/$TID -H "Authorization: Bearer $OWN" -H "Content-Type: application/json" -d '{"status":"resolved","resolution":"Cleared cache"}' | python3 -c "import sys,json;print('status:',json.load(sys.stdin)['ticket']['status'])"

echo "=== SETTINGS: get + update + capacity ==="
curl -s "$BASE/api/settings" -H "Authorization: Bearer $OWN" | python3 -c "import sys,json;s=json.load(sys.stdin)['settings'];print('sla hours:',s['complaintSlaHours'],'| version:',s['version'])"
curl -s -X PATCH $BASE/api/settings -H "Authorization: Bearer $OWN" -H "Content-Type: application/json" -d '{"complaintSlaHours":24}' | python3 -c "import sys,json;print('updated sla:',json.load(sys.stdin)['settings']['complaintSlaHours'],'| version:',json.load(sys.stdin)['settings']['version'])"
curl -s "$BASE/api/settings/capacity/$COLID" -H "Authorization: Bearer $MNG" | python3 -c "import sys,json;c=json.load(sys.stdin);print('capacity allowed:',c['allowed'],'| count:',c['count'],'| max:',c['max'])"
echo "=== SETTINGS: audit log ==="
curl -s "$BASE/api/settings/audit" -H "Authorization: Bearer $OWN" | python3 -c "import sys,json;logs=json.load(sys.stdin)['logs'];print('audit entries:',len(logs));print(' last:',logs[0]['action'],logs[0]['actorRole'])"

echo "=== REPORTS: json + pdf ==="
curl -s "$BASE/api/reports" -H "Authorization: Bearer $OWN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('report scope:',d['scope'],'| stats:',d['statistics'])"
curl -s -o /tmp/opencode/report.pdf -w "%{http_code} %{content_type}" "$BASE/api/reports/pdf" -H "Authorization: Bearer $OWN"; echo " (pdf)"
curl -s -o /tmp/opencode/report.json -w "%{http_code} %{content_type}" "$BASE/api/reports/json" -H "Authorization: Bearer $MNG"; echo " (json)"
ls -la /tmp/opencode/report.pdf /tmp/opencode/report.json 2>/dev/null | awk '{print $5, $9}'

kill $SERVER_PID $MONGO_PID 2>/dev/null || true
echo "=== ALL PHASE 3-4 TESTS COMPLETE ==="