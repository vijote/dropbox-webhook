const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Route to handle incoming webhook calls from Dropbox
app.post('/dropbox/webhook', (req, res) => {
  // Handle the incoming webhook payload here
  console.log('Received webhook call from Dropbox:', req.body);

  // Respond to Dropbox to confirm receipt
  res.status(200).send('Webhook received successfully');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
