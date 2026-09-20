const cron = require('node-cron');
const { syncAllKnowledge } = require('../scripts/sync_all_knowledge');

// Schedule tasks to be run on the server.
// Runs every night at midnight: '0 0 * * *'
// For testing/quicker updates, we can set it to run every hour: '0 * * * *'
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled task: Syncing CareSync Knowledge Base...');
  try {
    await syncAllKnowledge();
    console.log('Scheduled knowledge sync completed successfully.');
  } catch (error) {
    console.error('Scheduled knowledge sync failed:', error);
  }
});

console.log('Knowledge Sync Cron Job Initialized (runs every hour).');
