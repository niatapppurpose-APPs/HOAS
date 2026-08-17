#!/bin/bash
set -e
cd /mnt/c/Projects/HOAS-main/hoas-backend
pkill -f "dev-mongo" 2>/dev/null || true
pkill -f "node src/server" 2>/dev/null || true
sleep 1

node scripts/dev-mongo.js > /tmp/opencode/dev-mongo.log 2>&1 &
MONGO_PID=$!
node scripts/wait-for-mongo.js
node seed.js | tail -3

node src/server.js > /tmp/opencode/hoas-server.log 2>&1 &
SERVER_PID=$!
node scripts/wait-for-health.js
echo "=== health ==="
curl -s localhost:4000/api/health
echo

BASE=http://localhost:4000
TOKEN() { curl -s -X POST $BASE/api/dev/token -H "Content-Type: application/json" -d "{\"uid\":\"$1\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])"; }
STU=$(TOKEN seed-student-1)
WAR=$(TOKEN seed-warden)
MNG=$(TOKEN seed-management)
OWN=$(TOKEN seed-owner)
STU2=$(TOKEN seed-student-2)

echo "=== 1. student creates complaint ==="
COMP=$(curl -s -X POST $BASE/api/complaints -H "Authorization: Bearer $STU" -H "Content-Type: application/json" -d '{"title":"No water in bathroom","description":"Bathroom 2 has no water since morning","category":"plumbing","priority":"high"}')
echo "$COMP" | head -c 200; echo
CID=$(echo "$COMP" | python3 -c "import sys,json;print(json.load(sys.stdin)['complaint']['_id'])")

echo "=== 2. warden lists complaints ==="
curl -s "$BASE/api/complaints/warden" -H "Authorization: Bearer $WAR" | python3 -c "import sys,json;print('warden sees:',len(json.load(sys.stdin)['complaints']),'complaint(s)')"

echo "=== 3. warden -> in-progress -> warden-resolved ==="
curl -s -X PATCH $BASE/api/complaints/$CID/status -H "Authorization: Bearer $WAR" -H "Content-Type: application/json" -d '{"status":"in-progress"}' > /dev/null
curl -s -X PATCH $BASE/api/complaints/$CID/status -H "Authorization: Bearer $WAR" -H "Content-Type: application/json" -d '{"status":"warden-resolved"}' | python3 -c "import sys,json;print('status:',json.load(sys.stdin)['complaint']['status'])"

echo "=== 4. student disputes ==="
curl -s -X POST $BASE/api/complaints/$CID/review -H "Authorization: Bearer $STU" -H "Content-Type: application/json" -d '{"decision":"dispute","reason":"Water still not fixed"}' | python3 -c "import sys,json;c=json.load(sys.stdin)['complaint'];print('status:',c['status'],'| disputes:',c['disputeCount'])"

echo "=== 5. management sees complaint ==="
curl -s "$BASE/api/complaints/management" -H "Authorization: Bearer $MNG" | python3 -c "import sys,json;print('management sees:',len(json.load(sys.stdin)['complaints']),'complaint(s)')"

echo "=== 6. owner sees all ==="
curl -s "$BASE/api/complaints/all" -H "Authorization: Bearer $OWN" | python3 -c "import sys,json;print('owner sees:',len(json.load(sys.stdin)['complaints']),'complaint(s)')"

echo "=== 7. RBAC student->warden endpoint (expect 403) ==="
curl -s "$BASE/api/complaints/warden" -H "Authorization: Bearer $STU"; echo

echo "=== 8. RBAC warden->create complaint (expect 403) ==="
curl -s -X POST $BASE/api/complaints -H "Authorization: Bearer $WAR" -H "Content-Type: application/json" -d '{"title":"x","description":"y"}'; echo

echo "=== 9. unauthenticated (expect 401) ==="
curl -s "$BASE/api/complaints"; echo

echo "=== 10. student-2 views own complaints (expect empty, not student-1's) ==="
curl -s "$BASE/api/complaints/my" -H "Authorization: Bearer $STU2" | python3 -c "import sys,json;print('student-2 sees:',len(json.load(sys.stdin)['complaints']),'complaint(s)')"

echo "=== 11. students list scoped by role ==="
curl -s "$BASE/api/students" -H "Authorization: Bearer $WAR" | python3 -c "import sys,json;print('warden sees students:',len(json.load(sys.stdin)['students']))"
curl -s "$BASE/api/students" -H "Authorization: Bearer $STU" | python3 -c "import sys,json;print('student list access ->', json.load(sys.stdin).get('error','allowed'))"

echo "=== 12. audit log written ==="
node -e "import('./src/config/database.js').then(async({connectDatabase})=>{await connectDatabase(); const {default:AuditLog}=await import('./src/models/AuditLog.js'); const logs=await AuditLog.find().sort({timestamp:-1}).limit(5); console.log('audit entries:', logs.length); logs.forEach(l=>console.log(' -', l.action, l.actorRole)); await disconnectDatabase(); process.exit(0);})" 2>&1

kill $SERVER_PID $MONGO_PID 2>/dev/null || true
echo "=== done ==="