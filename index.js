const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('node:crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

app.use((req, res, next) => {
  let rawData = '';
  req.setEncoding('utf-8');
  req.on('data', chunk => {
    rawData += chunk;
  });
  req.on('end', () => {
    req.rawBody = rawData;
    next();
  });
});

app.get('/', (req, res) => {
  console.log('index handler!');
  res.send("It's alive!");
});

// Route to handle incoming webhook calls from Dropbox
app.post('/dropbox/webhook', (req, res) => {
  console.log(req.body);
  console.log('req:', req);
  // Make sure this is a valid request from Dropbox
  const signature = req.headers['x-dropbox-signature'];
  const hmacSignature = crypto.createHmac('sha256', process.env.APP_SECRET).update(JSON.stringify(req.body)).digest('hex');
  console.log('signature:', signature);
  console.log('hmacSignature:', hmacSignature);
  if (signature !== hmacSignature) {
    console.log("invalid signature!");
    res.status(403).send('Invalid signature');
    return;
  }

  // Process each changed user ID in a separate thread (in Node.js, we use asynchronous processing)
  const accounts = req.body.list_folder.accounts;
  accounts.forEach(account => {
    processUser(account);
  });

  console.log("success!");
  // Respond with an empty body
  res.status(200).send('');
});

app.get('/dropbox/webhook', (req, res) => {
  console.log('challenge received!');
  // Get the challenge parameter from the query string
  const challenge = req.query.challenge;

  // Set up the response with the challenge parameter
  res.set('Content-Type', 'text/plain');
  res.set('X-Content-Type-Options', 'nosniff');
  res.send(challenge);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
