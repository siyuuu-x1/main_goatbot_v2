const fs = require("fs-extra");
const axios = require("axios");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "kiss2",
    aliases: ["ummmah"],
    version: "2.1",
    author: "siyuu",
    countDown: 5,
    role: 0,
    shortDescription: "Kiss with custom image",
    longDescription: "Generate a kiss image with the mentioned user using a custom background.",
    category: "funny",
    guide: "{pn} @mention"
  },

  onStart: async function ({ api, message, event, usersData }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) return message.reply("Please mention someone to kiss.");

    let senderID = event.senderID;
    let mentionedID = mention[0];

    try {
      // Get avatar URLs
      const avatar1 = await usersData.getAvatarUrl(mentionedID); // left
      const avatar2 = await usersData.getAvatarUrl(senderID);    // right

      // Load avatars
      const [avatarImg1, avatarImg2] = await Promise.all([
        Canvas.loadImage(avatar1),
        Canvas.loadImage(avatar2)
      ]);

      // Load and scale background
      const bgUrl = "https://bit.ly/44bRRQG";
      const bgRes = await axios.get(bgUrl, { responseType: "arraybuffer" });
      const bg = await Canvas.loadImage(bgRes.data);

      // Set new canvas size
      const canvasWidth = 900;
      const canvasHeight = 600;

      const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Draw scaled background
      ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);

      // Avatar settings
      const avatarSize = 230;
      const y = canvasHeight / 2 - avatarSize - 90; // adjusted to stay upward // shifted upward

      // Left (mentioned user)
      ctx.save();
      ctx.beginPath();
      ctx.arc(150 + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg1, 150, y, avatarSize, avatarSize);
      ctx.restore();

      // Right (sender)
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvasWidth - 150 - avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg2, canvasWidth - 150 - avatarSize, y, avatarSize, avatarSize);
      ctx.restore();

      // Save and send image
      const imgPath = path.join(__dirname, "tmp", `${senderID}_${mentionedID}_kiss.png`);
      await fs.ensureDir(path.dirname(imgPath));
      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      message.reply({
        body: "Kisssssss!",
        attachment: fs.createReadStream(imgPath)
      }, () => fs.unlinkSync(imgPath));

    } catch (err) {
      console.error("Error in kiss command:", err);
      message.reply("There was an error creating the kiss image.");
    }
  }
};
