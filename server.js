const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// rota para servir o schema.yaml
app.get('/schema.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, 'schema.yaml'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
