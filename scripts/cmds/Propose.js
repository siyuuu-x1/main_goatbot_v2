const fs = require("fs-extra");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "propose",
    aliases: ["prps"],
    version: "3.5",
    author: "siyuuu",
    countDown: 5,
    role: 0,
    shortDescription: "Propose with custom image",
    longDescription: "Generate a propose image with avatars perfectly placed over characters’ heads (swapped).",
    category: "fun",
    guide: "{pn} @mention"
  },

  onStart: async function ({ message, event, usersData }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0)
      return message.reply("If you are going to propose, please mention them🤷🏻");

    const senderID = event.senderID;
    const mentionedID = mention[0];

    try {
      // 🟢 Get avatar URLs
      const avatarSender =
        (await usersData.getAvatarUrl(senderID)) ||
        `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
      const avatarMentioned =
        (await usersData.getAvatarUrl(mentionedID)) ||
        `https://graph.facebook.com/${mentionedID}/picture?width=512&height=512`;

      // 🖼️ Load all images
      const [avatarImgSender, avatarImgMentioned, bg] = await Promise.all([
        Canvas.loadImage(avatarSender),
        Canvas.loadImage(avatarMentioned),
        Canvas.loadImage("https://i.postimg.cc/vmZqx4rH/20251103-115147.png")
      ]);

      // 🎨 Canvas setup
      const canvasWidth = 1280;
      const canvasHeight = 1280;
      const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);

      // 👥 Avatar settings
      const avatarSize = Math.floor(canvasWidth * 0.11); // ছোট আকার
      const girlHead = { x: 330, y: 130 }; // left character
      const boyHead = { x: 760, y: 300 };  // right character

      // 💙 Mentioned user avatar on girl's head (left side)
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        girlHead.x + avatarSize / 2,
        girlHead.y + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();
      ctx.drawImage(avatarImgMentioned, girlHead.x, girlHead.y, avatarSize, avatarSize);
      ctx.restore();

      // ❤️ Sender avatar on boy's head (right side)
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        boyHead.x + avatarSize / 2,
        boyHead.y + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();
      ctx.drawImage(avatarImgSender, boyHead.x, boyHead.y, avatarSize, avatarSize);
      ctx.restore();

      // 💾 Save image
      const imgPath = path.join(
        __dirname,
        "tmp",
        `${senderID}_${mentionedID}_propose.png`
      );
      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

      // 💬 Send result
      const text =
        senderID === mentionedID
          ? "নিজেকেই প্রপোজ করলে? 😂❤️"
          : "💍 I law view bpy 🥺❤️";

      await message.reply(
        {
          body: text,
          attachment: fs.createReadStream(imgPath)
        },
        () => fs.unlink(imgPath)
      );
    } catch (err) {
      console.error("❌ Error in propose command:", err);
      message.reply(`❌ Error creating image:\n${err.message}`);
    }
  }
};
