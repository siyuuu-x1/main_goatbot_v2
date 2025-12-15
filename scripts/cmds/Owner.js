const { getStreamFromURL } = global.utils;

// Auto owner contact ID (safe fallback)
const ownerContactId =
  global.GoatBot?.config?.ownerID ||
  global.config?.BOTOWNERID ||
  global.config?.BOTOWNER ||
  "61584749395355";

module.exports = {
  config: {
    name: "owner",
    aliases: ["info", "admininfo", "ownerinfo"],
    version: "2.5",
    author: "Shahariya Ahmed Siyam (Siyuu) 🌟",
    longDescription: {
      en: "Info about bot and its owner"
    },
    category: "Special",
    guide: {
      en: "{p}owner or just type owner"
    },
    usePrefix: false
  },

  onStart: async function (context) {
    await module.exports.sendOwnerInfo(context);
  },

  onChat: async function ({ event, message, usersData }) {
    const prefix = global.GoatBot.config.prefix;
    const body = (event.body || "").toLowerCase().trim();

    const triggers = [
      "owner",
      "admin",
      "admininfo",
      `${prefix}owner`
    ];

    if (!triggers.includes(body)) return;
    await module.exports.sendOwnerInfo({ event, message, usersData });
  },

  sendOwnerInfo: async function ({ event, message, usersData }) {
    const videoURL = "https://files.catbox.moe/beh7nq.mp4";

    let attachment;
    try {
      attachment = await getStreamFromURL(videoURL);
    } catch (e) {
      console.warn("⚠️ Video load failed:", e.message);
    }

    const userData = await usersData.get(event.senderID);
    const name = userData?.name || "User";

    const info = `
🌟✨ 𝗢𝘄𝗻𝗲𝗿 𝗜𝗻𝗳𝗼 ✨🌟

👤 𝗡𝗮𝗺𝗲: Shahariya Ahmed Siyam (Siyuu)
🤖 𝗕𝗼𝘁: ♡Maiko♡
🎂 𝗔𝗴𝗲: -+
📚 𝗖𝗹𝗮𝘀𝘀: -+
💖 𝗥𝗲𝗹𝗮𝘁𝗶𝗼𝗻: Single
♂️ 𝗚𝗲𝗻𝗱𝗲𝗿: Male
🏡 𝗙𝗿𝗼𝗺: Mymensingh

📩 𝗖𝗼𝗻𝘁𝗮𝗰𝘁:
👉 https://m.me/${ownerContactId}

🎈 Thanks for using my bot, ${name}! Enjoy 💫
    `.trim();

    const msgData = {
      body: info,
      mentions: [{ id: event.senderID, tag: name }],
      contactID: ownerContactId
    };

    if (attachment) msgData.attachment = attachment;

    message.reply(msgData);
  }
};
