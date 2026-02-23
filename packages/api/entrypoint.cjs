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

// NÃO iniciar o servidor aqui - o backend real vai fazer isso
// Carregar o backend real compilado usando dynamic import() para ESM
console.log('Loading real backend from dist/index.js...');
import('./dist/index.js')
  .then(() => {
    console.log('Backend real loaded successfully');
  })
  .catch((error) => {
    console.error('Failed to load backend:', error);
    // Fallback: rodar apenas o servidor de diagnóstico
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Diagnostic server listening on port ${PORT} (backend failed to load)`);
    });
  });
