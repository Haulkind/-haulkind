const express = require('express');
const app = express();

console.log("BOOT: DIST/INDEX.JS ENTRYPOINT ✅", new Date().toISOString());

// Middleware para adicionar header X-ENTRYPOINT
app.use((req, res, next) => {
  res.setHeader('X-ENTRYPOINT', 'dist-index-js');
  next();
});

app.get('/__diag', (req, res) => {
  res.json({ ok: true, entry: 'dist/index.js', ts: Date.now() });
});

app.get('/updates', (req, res) => {
  res.json({ ok: true, updates: [] });
});

app.get('/', (req, res) => {
  res.send('API OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
