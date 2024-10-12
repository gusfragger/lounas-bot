const { App, ExpressReceiver } = require('@slack/bolt');
const express = require('express');
require('dotenv').config();

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true, 


receiver.router.use(express.json());

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: receiver,
});

receiver.router.post('/slack/events', async (req, res) => {
  console.log('Event received:', req.body);
  res.sendStatus(200);
});

receiver.router.post('/slack/interactive', async (req, res) => {
  console.log('Received POST request at /slack/interactive');
  console.log('Raw request body:', req.body);

  if (!req.body) {
    console.error('Request body is undefined');
    res.sendStatus(400);
    return;
  }

  if (req.body.type === 'url_verification') {
    console.log('Responding to Slack URL verification challenge');
    res.send(req.body.challenge);
    return;
  }

  const { payload } = req.body;
  console.log('Parsed payload:', payload);
  await handleInteractiveMessage(payload);

  res.sendStatus(200); 

async function handleInteractiveMessage(payload) {
  console.log('handleInteractiveMessage called with payload:', payload);
  if (payload.actions && payload.actions[0].value.startsWith('vote_')) {
    await handleVote(payload);
  } else {
    console.error('Unexpected action value:', payload.actions[0].value);
  }
}

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running on port', process.env.PORT || 3000);
})();