require('dotenv').config();
const express = require('express');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/start-analysis', (req, res) => {
    const { videoUrl, productInfo } = req.body;
    const input = JSON.stringify({
        video_url_1: videoUrl,
        video_url_2: '',
        video_url_3: '',
        video_url_4: '',
        video_url_5: '',
        product_info: productInfo,
    });

    const curlCommand = `curl -X POST "https://api.apify.com/v2/acts/operational_crabapple~analisis-youtube/runs?token=${process.env.APIFY_API_TOKEN}" -H "Content-Type: application/json" -d '${input}'`;

    exec(curlCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
            return;
        }
        const response = JSON.parse(stdout);
        res.json({ runId: response.data.id });
    });
});

app.get('/check-analysis/:runId', (req, res) => {
    const { runId } = req.params;

    const curlCommand = `curl -X GET "https://api.apify.com/v2/acts/operational_crabapple~analisis-youtube/runs/${runId}?token=${process.env.APIFY_API_TOKEN}"`;

    exec(curlCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.status(500).json({ error: 'An error occurred while checking the analysis status.', details: error.message });
            return;
        }
        const response = JSON.parse(stdout);
        if (response.data.status === 'SUCCEEDED') {
            const datasetId = response.data.defaultDatasetId;
            const datasetCurlCommand = `curl -X GET "https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_API_TOKEN}"`;

            exec(datasetCurlCommand, (datasetError, datasetStdout, datasetStderr) => {
                if (datasetError) {
                    console.error(`exec error: ${datasetError}`);
                    res.status(500).json({ error: 'An error occurred while retrieving dataset items.', details: datasetError.message });
                    return;
                }
                const datasetResponse = JSON.parse(datasetStdout);
                res.json({ status: 'SUCCEEDED', data: datasetResponse[0] });
            });
        } else {
            res.json({ status: response.data.status });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
