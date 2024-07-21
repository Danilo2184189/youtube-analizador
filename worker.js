require('dotenv').config();
const { ApifyClient } = require('apify-client');
const Queue = require('bee-queue');

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

const analysisQueue = new Queue('analysis', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
});

analysisQueue.process(async (job, done) => {
  const { videoUrl, productInfo } = job.data;
  
  try {
    const input = {
      video_url_1: videoUrl,
      video_url_2: '',
      video_url_3: '',
      video_url_4: '',
      video_url_5: '',
      product_info: productInfo
    };

    const run = await client.actor("WRio7FBA1jDNkkN1d").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    job.data.result = items[0];
    await job.save();

    done();
  } catch (error) {
    console.error('Error processing analysis:', error);
    done(error);
  }
});
