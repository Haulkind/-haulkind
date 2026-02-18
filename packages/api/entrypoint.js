const express = require('express');
const app = express();

// Boot log
console.log('BOOT: DIST/INDEX.JS ENTRYPOINT ✅', new Date().toISOString());

// Middleware para adicionar header X-ENTRYPOINT
app.use((req, res, next) => {
  res.setHeader('X-ENTRYPOINT', 'dist-index-js');
  next();
});

// Rotas de diagnóstico
app.get('/', (req, res) => {
  res.status(200).send('API OK');
});

app.get('/__diag', (req, res) => {
  res.status(200).json({
    ok: true,
    entry: 'dist/index.js',
    ts: Date.now()
  });
});

app.get('/updates', (req, res) => {
  res.status(200).json({
    ok: true,
    updates: []
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
