const express = require('express');
const app = express();

app.get('/__diag', (req, res) => {
  res.json({ ok: true, service: 'api', ts: Date.now() });
});

app.get('/updates', (req, res) => {
  res.json({ ok: true, updates: [] });
});

app.get('/', (req, res) => {
  res.send('API OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
