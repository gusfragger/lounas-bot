const { App, ExpressReceiver } = require("@slack/bolt");
require("dotenv").config();
const express = require("express");

const { scrapeMenu } = require("./scraper");
const { buildLunchMessage } = require("./messageBuilder");
const { scheduleDaily } = require("./scheduler");
const { handleVote } = require("./slackActions");
const restaurants = require("../config/restaurants");

console.log("Modules imported successfully");

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: false,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: receiver,
});

receiver.router.post("/slack/events", async (req, res) => {
  const { type, payload } = req.body;
  if (type === "command") {
    await handleCommand(payload);
  }
  res.ack();
});

receiver.router.post("/slack/interactive-endpoint", async (req, res) => {
  console.log(req.body);
  const { type, payload } = req.body;
  if (type === "interactive_message") {
    await handleInteractiveMessage(payload);
  }
  res.ack();
});

receiver.router.get("/health", (_, res) => {
  res.status(200).send("OK");
});

console.log("Slack app initialized");

async function handleCommand(payload) {
  if (payload.command === "/post-lunch") {
    await postLunchMessage();
  }
}

async function handleInteractiveMessage(payload) {
  console.log("handleInteractiveMessage called");
  await handleVote(payload);
}

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
    ...message,
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

(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    console.log("Lunch bot is running on port", process.env.PORT || 3000);
  } catch (error) {
    console.error("Failed to start the app:", error);
  }
})();
