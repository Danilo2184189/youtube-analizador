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
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/analyze', async (req, res) => {
    try {
        console.log('Received request:', req.body);
        const { videoUrls, productInfo } = req.body;
        const input = {
            video_url_1: videoUrls[0] || '',
            video_url_2: videoUrls[1] || '',
            video_url_3: videoUrls[2] || '',
            video_url_4: videoUrls[3] || '',
            video_url_5: videoUrls[4] || '',
            product_info: productInfo,
        };

        console.log('Calling Apify actor with input:', input);
        const run = await client.actor("WRio7FBA1jDNkkN1d").call(input);
        console.log('Apify actor run finished:', run);

        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log('Retrieved items from dataset:', items);
        
        res.json(items[0]);
    } catch (error) {
        console.error('Error in /analyze:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});