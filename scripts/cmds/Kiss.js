const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const bgURL = "https://files.catbox.moe/20pg09.jpg";
const localBgPath = path.join(__dirname, "cache", "kiss_bg.jpg");

const avatarConfig = {
  boy: { x: 255, y: 50, size: 107 },
  girl: { x: 367, y: 160, size: 97 }
};

module.exports = {
  config: {
    name: "kiss",
    version: "2.0",
    author: "Saimx69x",
    countDown: 5,
    role: 0,
    description:
      "💋 Create a romantic kiss image between you and your tagged partner! This command beautifully merges both avatars on a stylish background to capture the perfect kiss moment. Just tag someone or reply to their message to share a lovely virtual kiss! 💞",
    category: "love",
    guide: {
      en: "{pn} @tag or reply to someone's message — Create a romantic kiss image 💋"
    }
  },

  langs: {
    en: {
      noTag: "Please tag a someone to kiss."
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    const uid1 = event.senderID;
    let uid2 = Object.keys(event.mentions)[0];

    if (!uid2 && event.messageReply?.senderID)
      uid2 = event.messageReply.senderID;

    if (!uid2)
      return message.reply(getLang("noTag"));

    try {
      const name1 = (await usersData.getName(uid1)) || "Unknown";
      const name2 =
        (await usersData.getName(uid2)) ||
        (event.mentions[uid2]
          ? event.mentions[uid2].replace("@", "")
          : "Unknown");

      await fs.ensureDir(path.dirname(localBgPath));
      if (!fs.existsSync(localBgPath)) {
        const bgRes = await axios.get(bgURL, { responseType: "arraybuffer" });
        await fs.writeFile(localBgPath, bgRes.data);
      }

      const [avatarURL1, avatarURL2] = await Promise.all([
        usersData.getAvatarUrl(uid1),
        usersData.getAvatarUrl(uid2)
      ]);

      const [boy, girl, bgImg] = await Promise.all([
        loadImage(avatarURL1).catch(() => null),
        loadImage(avatarURL2).catch(() => null),
        loadImage(localBgPath)
      ]);

      if (!boy || !girl)
        throw new Error("Avatar load failed.");

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bgImg, 0, 0);

      function drawCircle(img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawCircle(boy, avatarConfig.boy.x, avatarConfig.boy.y, avatarConfig.boy.size);
      drawCircle(girl, avatarConfig.girl.x, avatarConfig.girl.y, avatarConfig.girl.size);

      const savePath = path.join(__dirname, "tmp");
      await fs.ensureDir(savePath);
      const imgPath = path.join(savePath, `${uid1}_${uid2}_kiss.jpg`);
      await fs.writeFile(imgPath, canvas.toBuffer("image/jpeg"));

      const text = `💋 ${name1} just kissed ${name2}! ❤️`;

      await message.reply({
        body: text,
        attachment: fs.createReadStream(imgPath)
      });

      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 5000);

    } catch (err) {
      console.error("❌ Error in kiss.js:", err);
      return message.reply("❌ | Couldn't create the kiss image, please try again later.");
    }
  }
};￼Enter
