import http from 'http';

function check() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:4000/api/health', (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve(body.includes('"ok"') && body.includes('connected')));
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

let ok = false;
for (let i = 0; i < 40 && !ok; i++) {
  ok = await check();
  if (!ok) await new Promise((r) => setTimeout(r, 1000));
}
console.log(ok ? 'server ready' : 'server NOT ready');
process.exit(ok ? 0 : 1);