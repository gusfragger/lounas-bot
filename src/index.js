const { App, ExpressReceiver } = require("@slack/bolt");
const express = require("express");
require("dotenv").config();
const { scrapeMenu } = require("./scraper");
const { buildLunchMessage } = require("./messageBuilder");
const { scheduleDaily } = require("./scheduler");
const restaurants = require("../config/restaurants");

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true,
});

const expressApp = receiver.app;

const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: receiver,
});

receiver.router.use(express.json());

receiver.router.use((req, res, next) => {
  console.log(`Request received at: ${Date.now()}`);
  console.log(`Request headers: ${JSON.stringify(req.headers)}`);
  next();
});

receiver.router.use((req, res) => {
  console.log(`No route found for ${req.method} ${req.url}`);
  res.status(404).send("Not Found");
});

expressApp.get("/ping", (req, res) => {
  console.log("Ping request received");
  res.send("pong");
});

async function postLunchMessage() {
  const menus = await Promise.all(
    Object.entries(restaurants).map(async ([name, url]) => {
      const encodedUrl = encodeURI(url);
      const menu = await scrapeMenu(name, encodedUrl);
      console.log(`Menu for ${name}:`, menu);
      return { name, menu };
    })
  );

  const message = buildLunchMessage(menus);
  console.log("Message to be posted:", message);

  await slackApp.client.chat.postMessage({
    channel: process.env.LUNCH_CHANNEL_ID,
    text: "Here are today's lunch menus",
    blocks: message.blocks,
  });
}

scheduleDaily(postLunchMessage);

slackApp.command("/post-lunch", async ({ ack, respond, command }) => {
  try {
    console.log("Received /post-lunch command from:", command.user_name);
    await ack();
    await postLunchMessage();
    await respond("Lunch message posted manually.");
  } catch (error) {
    console.error("Error in /post-lunch command:", error);
    await respond("There was an error processing the lunch message.");
  }
});

slackApp.action("vote", async ({ action, ack, say, body }) => {
  await ack();
  const processVote = async () => {
    const startTime = process.hrtime();
    try {
      console.log(`Action received at: ${Date.now()}`);
      console.log("Action received:", action);
      const userId = body.user.id;
      const restaurantName = action.restaurant;
      console.log(
        `Processing vote: User ${userId} voted for ${restaurantName}`
      );

      await say({
        text: `<@${userId}> voted for ${restaurantName}!`,
        thread_ts: body.message.ts,
      });

      const end = process.hrtime(startTime);
      console.log(
        `Vote message posted successfully in ${end[0]}s ${end[1] / 1000000}ms`
      );
    } catch (error) {
      console.error("Error handling action:", error);
    }
  };
  processVote();
});

slackApp.error(async (error) => {
  console.error("An error occurred:", error);
});

const port = process.env.PORT || 3000;
(async () => {
  try {
    await slackApp.start(port);
    console.log(`⚡️ Bolt app is running on port ${port}`);
  } catch (error) {
    console.error("Failed to start the app:", error);
  }
})();
