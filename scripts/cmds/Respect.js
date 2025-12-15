module.exports = {
  config: {
    name: "respect",
    aliases: ["r"],
    version: "1.1",
    author: "siyuu",
    role: 0,
    shortDescription: {
      en: "Gives respect to the owner"
    },
    longDescription: {
      en: "Only the owner can use this command to get admin privileges as a sign of respect."
    },
    category: "Group",
    guide: {
      en: "/r"
    }
  },

  onStart: async function ({ api, event }) {
    const ownerUID = "61584749395355"; // change to your FB UID
    
    // Check if sender is owner
    if (event.senderID !== ownerUID) {
      return api.sendMessage("❌ Sorry, only the owner can use this command!", event.threadID);
    }

    try {
      // Give admin status to owner
      await api.changeAdminStatus(event.threadID, ownerUID, true);
      await api.sendMessage("✅ You have been given admin as a token of respect, my Lord!", event.threadID);
    } catch (err) {
      console.error("Error giving admin:", err);
      await api.sendMessage("❌ Failed to give admin. Make sure I have admin permission in this group.", event.threadID);
    }
  }
};
