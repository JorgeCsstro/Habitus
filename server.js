const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();
const port = 3000;

// Redirect root to index.php
app.get('/', (req, res) => {
  res.redirect('/index.php');
});

// Important: PHP requests must be handled BEFORE static files
// Set up PHP proxy for all PHP requests
const phpProxy = createProxyMiddleware('**/*.php', {
  target: 'http://localhost:8000',
  changeOrigin: true,
  // Add these options to ensure proper handling
  selfHandleResponse: false,
  proxyTimeout: 30000
});

// Apply the PHP proxy middleware
app.use(phpProxy);

// AFTER the PHP proxy, serve static files
app.use(express.static('.'));

// Start the server
app.listen(port, () => {
  console.log(`Habitus Zone development server running at http://localhost:${port}`);
  console.log(`Make sure PHP server is running with: php -S localhost:8000`);
});