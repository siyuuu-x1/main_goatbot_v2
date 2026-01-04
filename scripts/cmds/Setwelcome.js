const fs = require("fs-extra");
const { utils } = global;

module.exports = {
  config: {
    name: "setwelcome",
    version: "1.1",
    author: "Siyam Rohman",
    description: "Set a welcome message for new chat threads or users with group name and username",
    category: "config",
    guide: {
      en:
        "  {pn} <message>: Set welcome message for this chat\n" +
        "  Example:\n    {pn} Welcome {user} to our {group}!\n\n" +
        "  {pn} reset: Reset welcome message to default"
    }
  },

  langs: {
    en: {
      set: "✅ Welcome message set for this chat:\n%1",
      reset: "✅ Welcome message has been reset to default",
      noPerm: "❌ Only bot admins can set a welcome message"
    }
  },

  // Command execution
  onStart: async function ({ message, args, event, threadsData, role, getLang }) {
    if (!args[0]) return message.reply("❌ Please provide a welcome message or 'reset'");

    if (args[0].toLowerCase() === "reset") {
      await threadsData.set(event.threadID, null, "data.welcomeMessage");
      return message.reply(getLang("reset"));
    }

    const welcomeMessage = args.join(" ");
    await threadsData.set(event.threadID, welcomeMessage, "data.welcomeMessage");
    return message.reply(getLang("set", welcomeMessage));
  },

  // On new thread / new user join
  onNewUser: async function ({ ig, threadID, userID, threadsData, usersData }) {
    const welcomeMessage = await threadsData.get(threadID, "data.welcomeMessage");
    if (!welcomeMessage) return;

    const userName = await usersData.getName(userID);
    const threadInfo = await ig.feed.directInbox().thread(threadID);
    const threadName = threadInfo.thread_title || "this group"; // fallback if no title

    // Replace placeholders
    let messageToSend = welcomeMessage
      .replace(/\{user\}/gi, userName)
      .replace(/\{group\}/gi, threadName);

    // Send message to thread
    await ig.entity.directThread(threadID.toString()).broadcastText(messageToSend);
  }
};
