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

    const run = await client.actor("WRio7FBA1jDNkkN1d").call(input, {
      webhooks: [
        `https://${req.headers.host}/analysis-result`
      ]
    });

    res.status(202).json({ status: 'RUNNING', runId: run.id });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
  }
});

app.post('/analysis-result', async (req, res) => {
  try {
    const { resource } = req.body;

    if (resource.actorRunStatus === 'SUCCEEDED') {
      const { defaultDatasetId } = resource;
      const { items } = await client.dataset(defaultDatasetId).listItems();

      // Aquí puedes almacenar los resultados en una base de datos
      // o notificar al cliente a través de otro mecanismo (por ejemplo, WebSocket o Server-Sent Events)
      console.log('Analysis completed:', items[0]);
    } else if (resource.actorRunStatus === 'ABORTED' || resource.actorRunStatus === 'TIMEOUT') {
      console.error('Analysis failed:', resource);
    }

    res.status(200).send();
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send();
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
