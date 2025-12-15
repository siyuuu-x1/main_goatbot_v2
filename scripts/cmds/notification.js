const { getStreamsFromAttachment } = global.utils;
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "notification",
    aliases: ["notify", "noti"],
    version: "2.1",
    author: "siyuuu",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Send stylish notification with media to all groups"
    },
    longDescription: {
      en: "Send notification (text, photo, video, audio, etc.) from admin to all groups with aesthetic style"
    },
    category: "owner",
    guide: { en: "{pn} <message or reply to media>" },
    envConfig: { delayPerGroup: 300 }
  },

  langs: {
    en: {
      missingMessage: "Please enter a message or reply to a media file to send.",
      sendingNotification: "📢 Sending notification to %1 groups...",
      sentNotification: "✅ Successfully sent notification to %1 groups.",
      errorSendingNotification: " Error while sending to %1 groups:\n%2"
    }
  },

  onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, getLang, usersData }) {
    const { delayPerGroup } = envCommands[commandName];
    const senderID = event.senderID;
    const senderName = await usersData.getName(senderID) || "Unknown User";

    const now = moment().tz("Asia/Dhaka");
    const timeString = now.format("hh:mm A");
    const dateString = now.format("DD/MM/YYYY");

    // ✅ Handle message text
    const msgText = args.join(" ") || "";

    // ✅ Collect attachments from message or reply
    const attachments = [
      ...(event.attachments || []),
      ...(event.messageReply?.attachments || [])
    ].filter(item => ["photo", "animated_image", "video", "audio", "sticker"].includes(item.type));

    // ✅ If no message and no attachments
    if (!msgText && attachments.length === 0)
      return message.reply(getLang("missingMessage"));

    // ✅ Convert attachments safely
    let streamAttachments = [];
    if (attachments.length > 0) {
      try {
        streamAttachments = await getStreamsFromAttachment(attachments);
      } catch (err) {
        console.error("Attachment processing error:", err);
      }
    }

    // 🎀 Stylish notification body
    const formSend = {
      body:
`🎀 ━━━━━━━ ✧ ━━━━━━━ 🎀
       ⚜️  𝐁𝐎𝐓 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍  ⚜️
🎀 ━━━━━━━ ✧ ━━━━━━━ 🎀

👤  From: ${senderName}
🕒  Time: ${timeString} - ${dateString}

👇🏻
${msgText || "(media only)"}
────────────────────────────

💌`,
      attachment: streamAttachments
    };

    // ✅ Get all active threads
    const allThreads = (await threadsData.getAll()).filter(
      t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup
    );

    message.reply(getLang("sendingNotification", allThreads.length));

    let sent = 0;
    const failed = [];

    for (const thread of allThreads) {
      try {
        await api.sendMessage(formSend, thread.threadID);
        sent++;
      } catch (e) {
        failed.push({ id: thread.threadID, err: e.message });
      }
      await new Promise(res => setTimeout(res, delayPerGroup));
    }

    let report = "";
    if (sent > 0) report += getLang("sentNotification", sent) + "\n";
    if (failed.length > 0)
      report += getLang(
        "errorSendingNotification",
        failed.length,
        failed.map(f => `\n - ${f.err} [${f.id}]`).join("")
      );

    message.reply(report || "✅ All done!");
  }
};
