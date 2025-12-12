const fs = require("fs-extra");
const axios = require("axios");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "hack",
    version: "1.0.0",
    author: "siyuuu",
    countDown: 0,
    role: 0,
    shortDescription: "Fake FB hack generator 😅",
    longDescription: "Creates a fake hacking style image using target profile photo and name.",
    category: "fun",
    guide: {
      en: "{pn} @mention বা reply দিয়ে ব্যবহার করো"
    }
  },

  // Text wrap helper
  wrapText(ctx, text, maxWidth) {
    return new Promise(resolve => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      if (ctx.measureText("W").width > maxWidth) return resolve(null);

      const words = text.split(" ");
      const lines = [];
      let line = "";

      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) {
            words[1] = temp.slice(-1) + words[1];
          } else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }

        if (ctx.measureText(line + words[0]).width < maxWidth) {
          line += words.shift() + " ";
        } else {
          lines.push(line.trim());
          line = "";
        }

        if (words.length === 0) lines.push(line.trim());
      }

      resolve(lines);
    });
  },

  // Main command
  onStart: async function ({ event, message, usersData }) {
    try {

      // ---------------------------------------------------
      // 🔥 SINGLE MESSAGE LOADING ANIMATION (EDIT EFFECT)
      // ---------------------------------------------------
      const frames = [
        "Hacking progress: 10% ▓░░░░░░",
        "Hacking progress: 39% ▓▓▓░░░░",
        "Hacking progress: 77% ▓▓▓▓▓░░",
        "Hacking progress: 100% ▓▓▓▓▓▓▓",
        "✔️ Hack Complete!"
      ];

      let loading = true;
      let index = 0;

      // First message
      let editMsg = await message.reply(frames[0]);

      // Animation loop
      const animate = async () => {
        while (loading) {
          await new Promise(res => setTimeout(res, 900));

          await message.unsend(editMsg.messageID);
          index = (index + 1) % frames.length;

          editMsg = await message.reply(frames[index]);

          if (index === frames.length - 1) break;
        }
      };

      animate(); // start animation

      // ---------------------------------------------------
      // 🔥 GENERATE HACK IMAGE IN BACKGROUND
      // ---------------------------------------------------

      const mentionID = Object.keys(event.mentions)[0] || event.senderID;
      const userName = await usersData.getName(mentionID);

      const backgrounds = [
        "https://drive.google.com/uc?id=1_S9eqbx8CxMMxUdOfATIDXwaKWMC-8ox&export=download"
      ];
      const bgLink = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      const bgPath = __dirname + "/cache/hack_bg.png";
      const avatarPath = __dirname + "/cache/hack_avatar.png";

      // Avatar download
      const avatarData = (
        await axios.get(
          `https://graph.facebook.com/${mentionID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;
      fs.writeFileSync(avatarPath, Buffer.from(avatarData, "utf-8"));

      // Background download
      const bgData = (await axios.get(bgLink, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(bgPath, Buffer.from(bgData, "utf-8"));

      // Canvas
      const background = await loadImage(bgPath);
      const avatar = await loadImage(avatarPath);
      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      ctx.font = "400 23px Arial";
      ctx.fillStyle = "#1878F3";

      const wrappedText = await this.wrapText(ctx, userName, 1160);
      ctx.fillText(wrappedText.join("\n"), 136, 335);

      ctx.drawImage(avatar, 57, 290, 66, 68);

      const finalBuffer = canvas.toBuffer();
      fs.writeFileSync(bgPath, finalBuffer);

      // ---------------------------------------------------
      // 🔥 STOP ANIMATION & SHOW FINAL TEXT
      // ---------------------------------------------------
      loading = false;

      await message.unsend(editMsg.messageID);
      await message.reply("✔️ Hack Complete!");

      // ---------------------------------------------------
      // 🔥 SEND FINAL IMAGE AS SECOND MESSAGE
      // ---------------------------------------------------
      await message.reply({
        body: "",
        attachment: fs.createReadStream(bgPath)
      });

      fs.unlinkSync(bgPath);
      fs.unlinkSync(avatarPath);

    } catch (err) {
      console.error(err);
      message.reply("❌ কিছু ভুল হয়েছে!");
    }
  }
};
