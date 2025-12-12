module.exports = {
  config: {
    name: "spy",
    version: "3.1",
    author: "siyuu",
    countDown: 5,
    role: 0,
    shortDescription: "See detailed user info",
    longDescription: "Fetch full profile info including name, UID, gender, balance, and more.",
    category: "image",
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    const uid1 = event.senderID;
    const uid2 = Object.keys(event.mentions || {})[0];
    let uid;

    if (args[0]) {
      if (/^\d+$/.test(args[0])) {
        uid = args[0];
      } else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) uid = match[1];
      }
    }

    if (!uid) {
      uid = event.type === "message_reply"
        ? event.messageReply.senderID
        : uid2 || uid1;
    }

    try {
      // Step 1: Send initial loading message
      const loadingMsg = await message.reply("⏳ Please wait… loading and checking account information.");

      // Small delay to simulate checking/loading
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Fetch user info
      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo(uid, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      const avatarUrl = await usersData.getAvatarUrl(uid);
      const data = await usersData.get(uid);
      const senderInfo = await usersData.get(event.senderID);
      const senderName = senderInfo.name || "User";

      const name = userInfo[uid].name || "Unknown";
      const gender = userInfo[uid].gender === 1 ? "Female" : userInfo[uid].gender === 2 ? "Male" : "Unknown";
      const isFriend = userInfo[uid].isFriend ? "Yes" : "No";
      const isBirthday = userInfo[uid].isBirthday ? "Yes" : "Private";
      const profileUrl = `https://www.facebook.com/${uid}`;
      const balance = data.money || 0;
      const exp = data.exp || 0;
      const level = Math.floor(0.1 * Math.sqrt(exp));

      const threadNickname = event.threadID && uid ? (await api.getThreadInfo(event.threadID)).nicknames?.[uid] : null;
      const nickname = threadNickname || "Not set in group";

      const allUsers = await usersData.getAll();
      const sortedUsers = allUsers
        .filter(user => typeof user.money === 'number')
        .sort((a, b) => b.money - a.money);
      const userRankIndex = sortedUsers.findIndex(user => user.userID === uid);
      const rankPosition = userRankIndex !== -1 ? `Rank ${userRankIndex + 1}` : "Unranked";

      const fancyInfo = 
`╭Hello ${senderName}
│  
│✨𝐍𝐚𝐦𝐞: ${name}
│✨𝐧𝐢𝐜𝐤: ${nickname}
│✨𝐔𝐢𝐝: ${uid}
│
│💵𝐁𝐚𝐥𝐚𝐧𝐜𝐞 : $${balance}
│✨ 𝐄𝐱𝐩 : ${exp}
│✨ 𝐋𝐞𝐯𝐞𝐥 : ${level}
│✨ 𝐑𝐚𝐧𝐤 : ${rankPosition}
│
│✨ 𝐆𝐞𝐧𝐝𝐞𝐫 : ${gender}
│🎂 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲 : ${isBirthday}
│💑 𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧𝐬𝐡𝐢𝐩 : Single 
│
│🤝 𝐅𝐫𝐢𝐞𝐧𝐝 : ${isFriend}
│🌐 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 𝐋𝐢𝐧𝐤: 
│${profileUrl}
│
╰───────────────֍`;

      // Step 3: Unsend the loading message
      await api.unsendMessage(loadingMsg.messageID);

      // Step 4: Send the final spy info
      return message.reply({
        body: fancyInfo,
        attachment: await global.utils.getStreamFromURL(avatarUrl)
      });

    } catch (e) {
      console.error(e);
      return message.reply("⚠️ Could not fetch user data.");
    }
  }
};
