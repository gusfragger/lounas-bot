function buildLunchMessage(menus) {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Hello! Check out today's lunch menus and vote!\n\n *Available restaurants:*",
      },
    },
    { type: "divider" },
  ];

  menus.forEach(({ name, menu }) => {
    const imageUrls = {
      Hertta:
        "https://linkosuo.fi/wp-content/uploads/LINKOSUO_HERTTA_ELOKUU2022-24_websize-1002x1500.jpg",
      Orvokki: "https://linkosuo.fi/wp-content/uploads/Orvokki1-1500x567.jpg",
      Speakeasy:
        "https://lh3.googleusercontent.com/p/AF1QipOD0Sf7Wu2dEkOtY9imuwE6L15_esJ5vzd2Phyy=s680-w680-h510",
      "Gate of India":
        "https://lh3.googleusercontent.com/p/AF1QipPX7abcxn_hMytiQ22SBS2RU1xCpLP2QKOj83uG=s680-w680-h510",
      "Il Posto":
        "https://lh3.googleusercontent.com/p/AF1QipPYuwEaf_OOO6KyQM0fnDlrYrawzqWqvURJ4mQB=s680-w680-h510",
    };

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${name}*\n${menu}`,
      },
      accessory: {
        type: "image",
        image_url: imageUrls[name],
        alt_text: `Image of ${name}`,
      },
    });
    blocks.push({ type: "divider" });
  });

  blocks.push({
    type: "actions",
    elements: menus.map(({ name }) => ({
      type: "button",
      text: {
        type: "plain_text",
        text: name,
        emoji: true,
      },
      value: name,
      action_id: "vote",
    })),
  });

  return { blocks };
}

module.exports = { buildLunchMessage };
