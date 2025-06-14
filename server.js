const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Define PHP server location - adjust for your production setup
const phpServerUrl = process.env.PHP_SERVER_URL || 'http://localhost:8000';

// Redirect root to index.php
app.get('/', (req, res) => {
  res.redirect('/index.php');
});

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Set up PHP proxy for all PHP requests
const phpProxy = createProxyMiddleware('**/*.php', {
  target: phpServerUrl,
  changeOrigin: true,
  selfHandleResponse: false,
  proxyTimeout: 60000, // Increased timeout
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Proxy Error: Could not connect to PHP server. Please check if PHP server is running.');
  }
});

// Apply the PHP proxy middleware
app.use(phpProxy);

// Serve static files after PHP proxy
app.use(express.static('.'));

// Add error handler for debugging
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Server Error: ' + err.message);
});

// Start the server
app.listen(port, () => {
  console.log(`Habitus server running at http://localhost:${port}`);
  console.log(`Connecting to PHP server at: ${phpServerUrl}`);
});