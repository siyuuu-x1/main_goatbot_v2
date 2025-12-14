module.exports = {
  config: {
    name: "out",
    aliases: ["o"],
    version: "1.0",
    author: "siyuuu",
    countDown: 5,
    role: 3,
    shortDescription: {
      en: "Bot leaves the group",
    },
    category: "owner",
    guide: {
      en: "{pn} — Make bot leave from this group"
    }
  },

  onStart: async function ({ api, event }) {
    try {

      await api.sendMessage(
        "ok , bye👋🏻",
        event.threadID
      );

      setTimeout(() => {
        api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
      }, 500);
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to leave the group.", event.threadID);
    }
  }
};
