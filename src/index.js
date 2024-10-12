const { App, ExpressReceiver } = require("@slack/bolt");
require("dotenv").config();

const { scrapeMenu } = require("./scraper");
const { buildLunchMessage } = require("./messageBuilder");
const { scheduleDaily } = require("./scheduler");
const { handleVote } = require("./slackActions");
const { handleCommand } = require("./slackActions");
const restaurants = require("../config/restaurants");

console.log("Modules imported successfully");

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: false,
});

receiver.router.use(express.json());

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: receiver,
});

receiver.router.post("/slack/events", async (req, res) => {
  console.log("Received POST request at /slack/events");
  console.log("Request body:", req.body);

  const { type, payload } = req.body;

  if (type === "url_verification") {
    console.log("Responding to Slack URL verification challenge");
    res.send(req.body.challenge);
    return;
  }

  res.sendStatus(200);
  if (type === "command") {
    await handleCommand(payload);
  }
});

receiver.router.post("/slack/interactive", async (req, res) => {
  console.log("Received POST request at /slack/interactive");
  console.log("Request body:", req.body);

  if (req.body.type === "url_verification") {
    console.log("Responding to Slack URL verification challenge");
    res.send(req.body.challenge);
    return;
  }

  const { payload } = req.body;
  await handleInteractiveMessage(payload);

  res.sendStatus(200);
});

async function handleInteractiveMessage(payload) {
  console.log("handleInteractiveMessage called");
  if (payload.actions && payload.actions[0].value.startsWith("vote_")) {
    await handleVote(payload);
  } else {
    console.error("Unexpected action value:", payload.actions[0].value);
  }
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
