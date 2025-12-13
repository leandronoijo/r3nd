import express from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 4173;

// Read the built index.html
const indexPath = join(__dirname, 'browser', 'index.html');
let indexHtml = readFileSync(indexPath, 'utf-8');

// Inject runtime environment variables
const apiBaseUrl = process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

// Inject script tag with runtime config before </head>
indexHtml = indexHtml.replace(
  '</head>',
  `<script>window.__API_BASE_URL__="${apiBaseUrl}";</script></head>`
);

// Serve static files
app.use(express.static(join(__dirname, 'browser')));

// Handle SPA routing - serve injected HTML for all routes
app.get('*', (req, res) => {
  res.send(indexHtml);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server running at http://0.0.0.0:${port}`);
  console.log(`API Base URL: ${apiBaseUrl}`);
});
