require('dotenv').config();
const express = require('express');
const { ApifyClient } = require('apify-client');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
    maxRetries: 5,
    minDelayBetweenRetriesMillis: 1000,
    requestTimeoutMillis: 60000, // 60 segundos
});

// Middleware para manejar tiempos de espera
app.use((req, res, next) => {
    req.setTimeout(60000); // 60 segundos
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
        if (run.status === 'SUCCEEDED') {
            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            res.json(items[0]);
        } else {
            res.json({ status: run.status });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while checking the analysis status.', details: error.message });
    }
});

app.use((err, req, res, next) => {
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
