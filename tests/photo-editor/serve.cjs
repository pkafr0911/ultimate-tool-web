// Serve a production build at both development and GitHub Pages base paths.
const express = require('express');
const path = require('node:path');
const app = express();
const root = path.resolve('dist');
app.use('/ultimate-tool-web', express.static(root));
app.use(express.static(root));
app.get('*', (_req, res) => res.sendFile(path.join(root, 'index.html')));
app.listen(Number(process.env.PORT || 8123), '127.0.0.1', () =>
  console.log('Editor test server ready'),
);
