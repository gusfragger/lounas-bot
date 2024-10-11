async function handleVote(payload) {
  const userId = payload.user.id;
  const restaurantName = payload.actions[0].value.replace("vote_", "");

  console.log(`Processing vote: User ${userId} voted for ${restaurantName}`);

  try {
    const messagePayload = {
      channel: payload.channel.id,
      text: `<@${userId}> voted for ${restaurantName}!`,
    };

    if (payload.message && payload.message.ts) {
      messagePayload.thread_ts = payload.message.ts;
    }

    await app.client.chat.postMessage(messagePayload);
    console.log("Vote message posted successfully");
  } catch (error) {
    console.error("Error posting vote message:", error);
    throw error; // Rethrow the error to be caught in the main handler
  }
}

module.exports = { handleVote };
