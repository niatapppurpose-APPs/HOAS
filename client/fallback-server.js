// simple fallback/proxy server that serves the Yeti 404 page whenever the
// React front-end or the API backend are unavailable.  This runs independently
// of `npm run dev` and can be started on its own port.

const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

// adjust these to match your environment; for local development you can
// point at localhost ports, but when you want to test against the deployed
// app keep the production URLs here (example values below).
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://hoas-client-4n13.vercel.app';
const BACKEND_URL = process.env.BACKEND_URL ||
  'https://us-central1-hoas-65dee.cloudfunctions.net';
const LISTEN_PORT = process.env.PORT || 8080;

const app = express();

// serve static assets from the public folder (including the yeti page)
app.use(express.static(path.join(__dirname, 'public')));

// proxy logic: try frontend first, then backend, otherwise send yeti page
app.use(async (req, res, next) => {
  try {
    const resp = await fetch(FRONTEND_URL + req.originalUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method === 'POST' || req.method === 'PUT' ? req : null,
    });
    if (resp.ok || resp.status === 304) {
      resp.body.pipe(res);
      return;
    }
    throw new Error('frontend returned ' + resp.status);
  } catch (err) {
    try {
      const resp = await fetch(BACKEND_URL + req.originalUrl, {
        method: req.method,
        headers: req.headers,
        body: req.method === 'POST' || req.method === 'PUT' ? req : null,
      });
      if (resp.ok || resp.status === 304) {
        resp.body.pipe(res);
        return;
      }
      throw new Error('backend returned ' + resp.status);
    } catch (err2) {
      // both targets failed; show Yeti page
      res.sendFile(path.join(__dirname, 'public', 'yeti-404', 'index.html'));
    }
  }
});

app.listen(LISTEN_PORT, () => {
  console.log(`fallback proxy listening on http://localhost:${LISTEN_PORT}`);
  console.log('it will return the Yeti 404 whenever frontend/backend are unreachable');
});
