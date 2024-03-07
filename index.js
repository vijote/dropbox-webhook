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
  try {
    const { accounts } = req.body.list_folder;
    accounts.forEach(() => {
      console.log('TODO: Handle account changes');
    });

    console.log('success!');

    // Respond with an empty body
    res.status(200).send('');
  } catch (error) {
    console.log('error', error);
  }
});

app.get('/dropbox/webhook', (req, res) => {
  try {
    console.log('query:', req.query);

    // Get the challenge parameter from the query string
    const { challenge } = req.query;

    // Set up the response with the challenge parameter
    res.set('Content-Type', 'text/plain');
    res.set('X-Content-Type-Options', 'nosniff');
    res.send(challenge);
  } catch (error) {
    console.log('error:', error);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
