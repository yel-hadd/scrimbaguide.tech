import fs from 'fs';
import path from 'path';
import https from 'https';

const HOST = 'scrimbaguide.tech';
const KEY = '432904832'; // Example key, user needs to replace
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// Read all MDX files to generate URL list
// For simplicity, we'll just read from the build/sitemap.xml if it exists, or manually list key pages
// In this basic version, we will just submit the key pages we know exist.

const urlsToSubmit = [
  `https://${HOST}/`,
  `https://${HOST}/docs/paths/frontend-developer-path`,
  `https://${HOST}/docs/paths/fullstack-developer-path`,
  `https://${HOST}/docs/paths/backend-developer-path`,
  `https://${HOST}/docs/paths/ai-engineer-path`,
  `https://${HOST}/docs/courses/react`,
  `https://${HOST}/docs/courses/javascript`,
  `https://${HOST}/docs/courses/ai`,
  `https://${HOST}/blog/complete-guide-scrimba-certificates`,
  `https://${HOST}/blog/scrimba-review`,
];

const data = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urlsToSubmit,
});

const options = {
  hostname: 'api.indexnow.org',
  port: 443,
  path: '/indexnow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
console.log(`Submitting ${urlsToSubmit.length} URLs to IndexNow...`);
