import { io } from 'socket.io-client';

const base = 'http://localhost:4000';

async function getToken(uid) {
  const res = await fetch(`${base}/api/dev/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid }),
  });
  return (await res.json()).token;
}

const wardenToken = await getToken('seed-warden');
const studentToken = await getToken('seed-student-1');

const wardenSocket = io(base, { auth: { token: wardenToken }, transports: ['websocket'] });
const studentSocket = io(base, { auth: { token: studentToken }, transports: ['websocket'] });

let wardenGotEvent = false;
let studentGotEvent = false;
let wardenGotNotification = false;

wardenSocket.on('connected', (d) => console.log('warden connected:', d.role));
wardenSocket.on('complaint:new', (c) => {
  wardenGotEvent = true;
  console.log('warden got complaint:new ->', c.title);
});
wardenSocket.on('notification', (n) => {
  wardenGotNotification = true;
  console.log('warden got notification ->', n.title);
});

studentSocket.on('connected', (d) => console.log('student connected:', d.role));

await new Promise((r) => setTimeout(r, 1000));

const res = await fetch(`${base}/api/complaints`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${studentToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ title: 'Socket test complaint', description: 'Testing realtime' }),
});
console.log('complaint created:', res.status);

await new Promise((r) => setTimeout(r, 2000));

console.log('warden complaint:new received:', wardenGotEvent);
console.log('warden notification received:', wardenGotNotification);

wardenSocket.close();
studentSocket.close();
process.exit(wardenGotEvent ? 0 : 1);