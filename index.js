require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const validUrl = require('valid-url');
const shortid = require('shortid');
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema and Model
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true },
});

const Url = mongoose.model('Url', urlSchema);

// POST - Create short URL
app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;

  // Validate URL
  if (!validUrl.isWebUri(url)) {
    return res.json({ error: 'invalid url' });
  }

  try {
    // Check if URL already exists in DB
    let existingUrl = await Url.findOne({ originalUrl: url });
    if (existingUrl) {
      return res.json({
        original_url: existingUrl.originalUrl,
        short_url: existingUrl.shortUrl,
      });
    }

    // Create a new short URL
    const shortUrl = shortid.generate();
    const newUrl = new Url({ originalUrl: url, shortUrl });

    await newUrl.save();

    res.json({
      original_url: newUrl.originalUrl,
      short_url: newUrl.shortUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json('Server Error');
  }
});

// GET - Redirect to original URL
app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const url = await Url.findOne({ shortUrl });

    if (url) {
      return res.redirect(url.originalUrl);
    }

    res.status(404).json({ error: 'No short URL found' });
  } catch (err) {
    console.error(err);
    res.status(500).json('Server Error');
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
