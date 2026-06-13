const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Store communications in memory for demo
const communications = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Receive communications from CRM
app.post('/api/send', async (req, res) => {
  try {
    const { campaign_id, communications: comms, callback_url } = req.body;

    if (!campaign_id || !Array.isArray(comms)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    console.log(`Received ${comms.length} communications for campaign ${campaign_id}`);

    // Process each communication asynchronously
    comms.forEach(comm => {
      communications.set(comm.id, {
        ...comm,
        status: 'processing',
        callback_url,
        campaign_id,
      });

      // Simulate delivery with random delays
      scheduleDelivery(comm, callback_url);
    });

    res.json({
      success: true,
      message: `Processing ${comms.length} communications`,
      campaign_id,
    });
  } catch (error) {
    console.error('Error processing send request:', error);
    res.status(500).json({ error: 'Failed to process send request' });
  }
});

// Schedule delivery events for a communication
function scheduleDelivery(comm, callback_url) {
  // Simulate delivery outcomes
  const outcomes = [];

  // 20% chance of failure
  if (Math.random() < 0.2) {
    outcomes.push({
      status: 'failed',
      delay: 2000 + Math.random() * 3000,
    });
  } else {
    // Delivered
    outcomes.push({
      status: 'delivered',
      delay: 1000 + Math.random() * 2000,
    });

    // 40% chance of open
    if (Math.random() < 0.4) {
      outcomes.push({
        status: 'opened',
        delay: 5000 + Math.random() * 15000,
      });

      // 25% chance of read after open
      if (Math.random() < 0.25) {
        outcomes.push({
          status: 'read',
          delay: 8000 + Math.random() * 20000,
        });

        // 10% chance of click after read
        if (Math.random() < 0.1) {
          outcomes.push({
            status: 'clicked',
            delay: 10000 + Math.random() * 30000,
          });
        }
      }
    }
  }

  // Schedule each outcome
  let cumulativeDelay = 0;
  outcomes.forEach(outcome => {
    cumulativeDelay += outcome.delay;

    setTimeout(async () => {
      try {
        const callback_data = {
          communication_id: comm.id,
          status: outcome.status,
        };

        // Add timestamp fields based on status
        if (outcome.status === 'delivered') {
          callback_data.delivered_at = new Date().toISOString();
        } else if (outcome.status === 'opened') {
          callback_data.opened_at = new Date().toISOString();
        } else if (outcome.status === 'read') {
          callback_data.read_at = new Date().toISOString();
        } else if (outcome.status === 'clicked') {
          callback_data.clicked_at = new Date().toISOString();
        }

        console.log(`Calling back ${outcome.status} for ${comm.id}`);

        // Send callback to CRM
        await axios.post(`${callback_url}`, callback_data, {
          timeout: 10000,
        });

        console.log(`Callback sent for ${comm.id}: ${outcome.status}`);
      } catch (error) {
        console.error(`Error sending callback for ${comm.id}:`, error.message);
        // Retry logic could be added here
      }
    }, cumulativeDelay);
  });
}

// Endpoint to check communication status (optional)
app.get('/api/communications/:id', (req, res) => {
  const comm = communications.get(req.params.id);
  if (!comm) {
    return res.status(404).json({ error: 'Communication not found' });
  }
  res.json(comm);
});

app.listen(PORT, () => {
  console.log(`Channel service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
