require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

        const response = await axios.post(`https://api.apify.com/v2/acts/operational_crabapple~analisis-youtube/runs?token=${process.env.APIFY_API_TOKEN}`, input, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        res.json({ runId: response.data.data.id });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
    }
});

app.get('/check-analysis/:runId', async (req, res) => {
    try {
        const { runId } = req.params;
        const response = await axios.get(`https://api.apify.com/v2/acts/operational_crabapple~analisis-youtube/runs/${runId}?token=${process.env.APIFY_API_TOKEN}`);

        if (response.data.data.status === 'SUCCEEDED') {
            const datasetId = response.data.data.defaultDatasetId;
            const datasetResponse = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_API_TOKEN}`);
            res.json({ status: 'SUCCEEDED', data: datasetResponse.data[0] });
        } else {
            res.json({ status: response.data.data.status });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while checking the analysis status.', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
