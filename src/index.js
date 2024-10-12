const { App, ExpressReceiver } = require("@slack/bolt");
const express = require("express");
require("dotenv").config();

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true,
});

receiver.router.use(express.json());

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: receiver,
});

receiver.router.use((req, res, next) => {
  console.log(`Request received at: ${Date.now()}`);
  next();
});

receiver.router.post("/slack/events", async (req, res) => {
  console.log("Event received:", req.body);
  res.sendStatus(200);
});

receiver.router.post("/slack/interactive", async (req, res) => {
  try {
    console.log("Received POST request at /slack/interactive");
    console.log("Raw request body:", req.body);

    if (!req.body) {
      console.error("Request body is undefined");
      res.sendStatus(400);
      return;
    }

    if (req.body.type === "url_verification") {
      console.log("Responding to Slack URL verification challenge");
      res.send(req.body.challenge);
      return;
    }

    const { payload } = req.body;
    console.log("Parsed payload:", payload);
    await handleVote(payload);

    res.sendStatus(200);
  } catch (error) {
    console.error("Error handling /slack/interactive request:", error);
    res.sendStatus(500);
  }
});

async function handleVote(payload) {
  try {
    console.log("handleVote called with payload:", payload);
    const userId = payload.user.id;
    const restaurantName = payload.actions[0].value.replace("vote_", "");
    console.log(`Processing vote: User ${userId} voted for ${restaurantName}`);

    const messagePayload = {
      channel: payload.channel.id,
      text: `<@${userId}> voted for ${restaurantName}!`,
    };

    if (payload.message && payload.message.ts) {
      messagePayload.thread_ts = payload.message.ts;
    }

    console.log("Posting vote message:", messagePayload);
    await app.client.chat.postMessage(messagePayload);
    console.log("Vote message posted successfully");
  } catch (error) {
    console.error("Error posting vote message:", error);
    throw error;
  }
}

(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    console.log("⚡️ Bolt app is running on port", process.env.PORT || 3000);
  } catch (error) {
    console.error("Failed to start the app:", error);
  }
})();
