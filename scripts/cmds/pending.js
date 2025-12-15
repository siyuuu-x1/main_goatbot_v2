module.exports = {
  config: {
    name: "pending",
    version: "1.0.6",
    author: "siyuu",
    aliases: ["pen"],
    role: 2,
    shortDescription: "Manage bot's waiting messages",
    longDescription: "Approve or cancel pending groups",
    category: "system",
    countDown: 10
  },

  languages: {
    en: {
      invaildNumber: "%1 𝙸𝚂 𝙽𝙾𝚃 𝙰 𝚅𝙰𝙻𝙸𝙳 𝙽𝚄𝙼𝙱𝙴𝚁",
      cancelSuccess: "❌ 𝚁𝙴𝙵𝚄𝚂𝙴𝙳 %1 𝚃𝙷𝚁𝙴𝙰𝙳𝚂!",
      approveSuccess: "✅ 𝙰𝙿𝙿𝚁𝙾𝚅𝙴𝙳 %1 𝚃𝙷𝚁𝙴𝙰𝙳𝚂!",
      cantGetPendingList: "⚠️ 𝙲𝙰𝙽'𝚃 𝙶𝙴𝚃 𝚃𝙷𝙴 𝙿𝙴𝙽𝙳𝙸𝙽𝙶 𝙻𝙸𝚂𝚃!",
      returnListClean: "「𝙿𝙴𝙽𝙳𝙸𝙽𝙶」𝚃𝙷𝙴𝚁𝙴 𝙸𝚂 𝙽𝙾 𝚃𝙷𝚁𝙴𝙰𝙳 𝙸𝙽 𝚃𝙷𝙴 𝙻𝙸𝚂𝚃",
      returnListPending:
        "»「𝙿𝙴𝙽𝙳𝙸𝙽𝙶」«❮ 𝚃𝙾𝚃𝙰𝙻 𝚃𝙷𝚁𝙴𝙰𝙳𝚂 𝚃𝙾 𝙰𝙿𝙿𝚁𝙾𝚅𝙴: %1 ❯\n\n%2",
      notiBox:
        "✨🎉 𝙲𝙾𝙽𝙶𝚁𝙰𝚃𝚂! 𝚈𝙾𝚄𝚁 𝙶𝚁𝙾𝚄𝙿 𝙷𝙰𝚂 𝙱𝙴𝙴𝙽 𝙰𝙿𝙿𝚁𝙾𝚅𝙴𝙳! 🎉✨\n🚀 𝚄𝚂𝙴 %1help 𝚃𝙾 𝙴𝚇𝙿𝙻𝙾𝚁𝙴 𝙰𝙻𝙻 𝙰𝚅𝙰𝙸𝙻𝙰𝙱𝙻𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂"
    }
  },

  _getText(key, ...args) {
    let text = this.languages.en[key] || key;
    args.forEach((v, i) => {
      text = text.replace(`%${i + 1}`, v);
    });
    return text;
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    let pendingList = [];

    try {
      const other = await api.getThreadList(100, null, ["OTHER"]);
      const pending = await api.getThreadList(100, null, ["PENDING"]);
      pendingList = [...other, ...pending].filter(
        g => g.isGroup && g.isSubscribed
      );
    } catch {
      return api.sendMessage(
        this._getText("cantGetPendingList"),
        threadID,
        messageID
      );
    }

    if (!pendingList.length) {
      return api.sendMessage(
        this._getText("returnListClean"),
        threadID,
        messageID
      );
    }

    let msg = "";
    pendingList.forEach((g, i) => {
      msg += `${i + 1}/ ${g.name} (${g.threadID})\n`;
    });

    api.sendMessage(
      this._getText("returnListPending", pendingList.length, msg),
      threadID,
      (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          pending: pendingList,
          unsendTimeout: setTimeout(
            () => api.unsendMessage(info.messageID),
            this.config.countDown * 1000
          )
        });
      },
      messageID
    );
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, pending, unsendTimeout } = Reply;
    if (event.senderID != author) return;
    clearTimeout(unsendTimeout);

    const input = event.body.trim().split(/\s+/);
    let count = 0;

    if (input[0] === "c" || input[0] === "cancel") {
      for (let i = 1; i < input.length; i++) {
        const idx = parseInt(input[i]);
        if (isNaN(idx) || idx < 1 || idx > pending.length)
          return api.sendMessage(
            this._getText("invaildNumber", input[i]),
            event.threadID
          );

        await api.removeUserFromGroup(
          api.getCurrentUserID(),
          pending[idx - 1].threadID
        );
        count++;
      }
      return api.sendMessage(
        this._getText("cancelSuccess", count),
        event.threadID
      );
    }

    // ✅ APPROVE (dynamic prefix)
    for (const n of input) {
      const idx = parseInt(n);
      if (isNaN(idx) || idx < 1 || idx > pending.length)
        return api.sendMessage(
          this._getText("invaildNumber", n),
          event.threadID
        );

      const targetThread = pending[idx - 1].threadID;
      const prefix =
        global.GoatBot?.config?.prefix ||
        (await api.getPrefix(targetThread)) ||
        "!";

      await api.sendMessage(
        this._getText("notiBox", prefix),
        targetThread
      );
      count++;
    }

    return api.sendMessage(
      this._getText("approveSuccess", count),
      event.threadID
    );
  }
};
