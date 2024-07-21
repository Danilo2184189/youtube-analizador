require('dotenv').config();
const express = require('express');
const Queue = require('bee-queue');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const analysisQueue = new Queue('analysis', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
});

app.post('/start-analysis', async (req, res) => {
  try {
    const { videoUrl, productInfo } = req.body;
    
    const job = await analysisQueue.createJob({ 
      videoUrl,
      productInfo
    }).save();

    res.status(202).json({ status: 'QUEUED', jobId: job.id });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
  }
});

app.get('/job-status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await analysisQueue.getJob(jobId);

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
    } else {
      res.json({ status: job.status, result: job.data.result });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while checking the job status.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
