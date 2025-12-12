const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "gay",
    aliases: ["g"],
    version: "1.6",
    author: "siyuu",
    countDown: 2,
    role: 0,
    description: "Generate a gay image with two user IDs.",
    category: "fun",
    guide: {
      en: "{pn} @mention @mention\nOr {pn} @mention\nOr reply to a message."
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const mentions = Object.keys(event.mentions || {});
      let uid1, uid2;
      let uid1Name, uid2Name;

      // Case 1: Two or more mentions
      if (mentions.length >= 2) {
        uid1 = mentions[0];
        uid2 = mentions[1];
        uid1Name = event.mentions[uid1];
        uid2Name = event.mentions[uid2];
      }
      // Case 2: One mention
      else if (mentions.length === 1) {
        uid1 = event.senderID;
        uid2 = mentions[0];
        const userInfo = await api.getUserInfo(uid1);
        uid1Name = userInfo[uid1]?.name || "User";
        uid2Name = event.mentions[uid2];
      }
      // Case 3: Reply to a message
      else if (event.messageReply) {
        uid1 = event.senderID;
        uid2 = event.messageReply.senderID;
        const userInfo = await api.getUserInfo([uid1, uid2]);
        uid1Name = userInfo[uid1]?.name || "User";
        uid2Name = userInfo[uid2]?.name || "User";
      }
      // Case 4: No mention or reply
      else {
        return api.sendMessage("Please reply to a message or mention one or two users.", event.threadID, event.messageID);
      }
      
      const url = `https://neokex-apis.onrender.com/gay?uid1=${uid1}&uid2=${uid2}`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const filePath = path.join(__dirname, "cache", `gay_${uid1}_${uid2}.jpg`);
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      const messageBody = `Oh yeah ${uid1Name} 💋 ${uid2Name}`;
      const messageMentions = [
        { tag: uid1Name, id: uid1 },
        { tag: uid2Name, id: uid2 }
      ];

      api.sendMessage({
        body: messageBody,
        attachment: fs.createReadStream(filePath),
        mentions: messageMentions
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);

    } catch (e) {
      console.error("Error:", e.message);
      api.sendMessage("❌ Couldn't generate image. Try again later.", event.threadID, event.messageID);
    }
  }
};
