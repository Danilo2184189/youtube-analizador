require('dotenv').config();
const express = require('express');
const { ApifyClient } = require('apify-client');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

app.post('/start-analysis', async (req, res) => {
  try {
    const { videoUrl, productInfo } = req.body;
    const input = {
      video_url_1: videoUrl,
      video_url_2: '',
      video_url_3: '',
      video_url_4: '',
      video_url_5: '',
      product_info: productInfo,
    };

    const run = await client.actor("WRio7FBA1jDNkkN1d").call(input);
    res.json({ runId: run.id });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
  }
});

app.get('/check-analysis/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await client.run(runId).get();
    
    if (run.status === 'RUNNING') {
      res.status(202).json({ status: 'RUNNING' });
    } else if (run.status === 'SUCCEEDED') {
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      res.json({ status: 'SUCCEEDED', data: items[0] });  
    } else {
      res.status(500).json({ status: 'FAILED', error: 'Analysis failed.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while checking the analysis status.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
