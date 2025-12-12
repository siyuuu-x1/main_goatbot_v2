module.exports = {
  config: {
    name: "gcname",
    version: "1.2.0",
    author: "siyuu",
    countDown: 0,
    role: 1, // গ্রুপ অ্যাডমিন বা বট অ্যাডমিন
    shortDescription: "Change group name",
    longDescription: "তুমি যেই নাম দেবে সেটাই গ্রুপের নতুন নাম হবে।",
    category: "box",
    guide: "{pn} [new name]"
  },

  onStart: async function ({ api, event, args }) {
    const { senderID, threadID } = event;
    const name = args.join(" ");

    // প্রথমে গ্রুপের ডিটেইল নাও
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    // চেক করো কে গ্রুপ অ্যাডমিন
    const isSenderAdmin = threadInfo.adminIDs.some(admin => admin.id == senderID);
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);

    // কেউ নাম দেনি
    if (!name) {
      return api.sendMessage(
        "❌ | দয়া করে নতুন গ্রুপ নাম লিখো!\n\n📝 উদাহরণঃ /gcname bla bla 🐸🙌🏻",
        threadID,
        event.messageID
      );
    }

    // যদি না হয় অ্যাডমিন
    if (!isSenderAdmin) {
      // কেউ নাম চেঞ্জ করলে আগের নামে ফিরিয়ে আন
      try {
        await api.setTitle(threadInfo.name, threadID);
        return api.sendMessage(
          `⚠️ | তুমি গ্রুপের নাম পরিবর্তন করতে পারো না। শুধুমাত্র গ্রুপ অ্যাডমিনরা পারবে।`,
          threadID,
          event.messageID
        );
      } catch (err) {
        console.error(err);
        return api.sendMessage(
          "⚠️ | নাম পুনঃস্থাপন করা যায়নি! নিশ্চিত হও বটের পর্যাপ্ত পারমিশন আছে কিনা।",
          threadID,
          event.messageID
        );
      }
    }

    // সব ঠিক থাকলে নাম চেঞ্জ করো
    try {
      await api.setTitle(name, threadID);
      api.sendMessage(`✅ | গ্রুপের নাম পরিবর্তন হয়েছে:\n➡️ ${name}`, threadID, event.messageID);
    } catch (err) {
      console.error(err);
      api.sendMessage(
        "⚠️ | নাম পরিবর্তন করা যায়নি! নিশ্চিত হও বটের পর্যাপ্ত পারমিশন আছে কিনা।",
        threadID,
        event.messageID
      );
    }
  }
};
