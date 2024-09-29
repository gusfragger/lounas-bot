async function handleVote({ body, client }) {
  const userId = body.user.id;
  const restaurantName = body.actions[0].value.replace("vote_", "");

  console.log(`Processing vote: User ${userId} voted for ${restaurantName}`);

  try {
    const messagePayload = {
      channel: body.channel.id,
      text: `<@${userId}> voted for ${restaurantName}!`,
    };

    if (body.message && body.message.ts) {
      messagePayload.thread_ts = body.message.ts;
    }

    await client.chat.postMessage(messagePayload);
    console.log("Vote message posted successfully");
  } catch (error) {
    console.error("Error posting vote message:", error);
    throw error; // Rethrow the error to be caught in the main handler
  }
}

module.exports = { handleVote };

async function processVote(body, client) {
  const userId = body.user.id;
  const restaurantName = body.actions[0].value.replace("vote_", "");

  console.log(`Processing vote: User ${userId} voted for ${restaurantName}`);

  const messagePayload = {
    channel: body.channel.id,
    text: `<@${userId}> voted for ${restaurantName}!`,
  };

  if (body.message && body.message.ts) {
    messagePayload.thread_ts = body.message.ts;
  }

  await client.chat.postMessage(messagePayload);
  console.log("Vote message posted successfully");
}
