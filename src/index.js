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

receiver.router.use(express.json());

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: receiver,
});

receiver.router.use((req, res, next) => {
  console.log(`Request received at: ${Date.now()}`);
  console.log(`Request headers: ${JSON.stringify(req.headers)}`);
  next();
});

receiver.router.use((req, res) => {
  console.log(`No route found for ${req.method} ${req.url}`);
  res.status(404).send("Not Found");
});

receiver.router.get("/ping", (req, res) => {
  console.log("Ping request received");
  const start = process.hrtime();
  res.send("pong");
  const end = process.hrtime(start);
  console.log(`Ping processed in ${end[0]}s ${end[1] / 1000000}ms`);
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

  await app.client.chat.postMessage({
    channel: process.env.LUNCH_CHANNEL_ID,
    text: "Here are today's lunch menus",
    blocks: message.blocks,
  });
}

scheduleDaily(postLunchMessage);

app.command("/post-lunch", async ({ ack, respond, command }) => {
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

app.action(/vote_.*/, async ({ action, ack, say, body }) => {
  const startTime = process.hrtime();
  try {
    console.log(`Action received at: ${Date.now()}`);
    await ack();
    console.log(`Action acknowledged at: ${Date.now() - startTime}ms`);
    console.log("Action received:", action);
    const userId = body.user.id;
    const restaurantName = action.value.replace("vote_", "");
    console.log(
      `Processing vote: User ${userId} voted for ${restaurantName} at: ${
        Date.now() - startTime
      }ms`
    );

    await say({
      text: `<@${userId}> voted for ${restaurantName}!`,
      thread_ts: body.message.ts,
    });

    console.log(
      "Vote message posted successfully at:",
      `${Date.now() - startTime}ms`
    );
  } catch (error) {
    console.error("Error handling action:", error);
  }
});

(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    console.log("⚡️ Bolt app is running on port", process.env.PORT || 3000);
  } catch (error) {
    console.error("Failed to start the app:", error);
  }
})();
