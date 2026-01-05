const { getPrefix } = global.utils;
const { commands } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    aliases: ["h"],
    version: "4.1",
    author: "T A N J I L 🎀 (fixed by Siyuu)",
    role: 0,
    shortDescription: "Show help menu",
    longDescription: "Show all commands or command detail",
    category: "info",
    guide: "{pn} | {pn} <command>"
  },

  onStart: async function ({ message, event, args }) {
    const prefix = await getPrefix(event.threadID);

    /* ================= COMMAND DETAIL ================= */
    if (args[0]) {
      const cmdName = args[0].toLowerCase();
      const cmd =
        commands.get(cmdName) ||
        [...commands.values()].find(c =>
          c.config.aliases?.includes(cmdName)
        );

      if (!cmd) {
        return message.reply(`❌ Command "${cmdName}" not found.`);
      }

      const {
        name,
        category,
        version,
        author,
        countDown,
        shortDescription,
        longDescription,
        guide
      } = cmd.config;

      const desc =
        typeof longDescription === "string"
          ? longDescription
          : longDescription?.en || shortDescription?.en || "No description";

      const usage =
        typeof guide === "string"
          ? guide
          : guide?.en
              ?.replace(/{pn}/g, `${prefix}${name}`) ||
            `${prefix}${name}`;

      const box = 
`╭──❏ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗗𝗘𝗧𝗔𝗜𝗟 ❏──╮
│ ✧ Name: ${name}
│ ✧ Category: ${category || "Uncategorized"}
│ ✧ Version: ${version || "1.0"}
│ ✧ Author: ${author || "Unknown"}
│ ✧ Cooldowns: ${countDown || 0}s
╰─────────────────────⭓
📘 Description: ${desc}
📗 Usage: ${usage}`;

      return message.reply(box);
    }

    /* ================= FULL HELP MENU ================= */
    const botName = "Maiko";
    const creator = "Siyuu";

    const videos = [
      "https://files.catbox.moe/pck0sn.mp4",
      "https://files.catbox.moe/3s3pkw.mp4",
      "https://files.catbox.moe/81lsp7.mp4",
      "https://files.catbox.moe/c21xsl.mp4"
    ];
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];

    const categories = {};
    for (const cmd of commands.values()) {
      if (cmd.config.role > 1) continue;
      const cate = cmd.config.category || "OTHER";
      if (!categories[cate]) categories[cate] = [];
      categories[cate].push(cmd.config.name);
    }

    let text =
`╭──────୨ৎ──────╮
    ${botName} HELP MENU
╰──────୨ৎ──────╯`;

    for (const cate of Object.keys(categories).sort()) {
      text += `\n┍─━〔 ${cate.toUpperCase()} 〕\n`;
      for (const name of categories[cate].sort()) {
        text += `╎ᯓ✧. ${name}\n`;
      }
      text += `┕━─────୨ৎ─────━ᥫ᭡`;
    }

    text += `
• Need help with a command?  
Use ${prefix}help <command>

╭──────୨ৎ──────╮
╎ 🔢 Total Commands: ${commands.size}
╎ ⚡ Prefix: ${prefix || "NoPrefix"}
╎ 👤 Creator: ${creator}
╰──────୨ৎ──────╯`;

    return message.reply({
      body: text,
      attachment: await global.utils.getStreamFromURL(randomVideo)
    });
  },

  onChat: async function ({ event, message }) {
    if (event.body?.toLowerCase().trim() === "help") {
      return this.onStart({ message, event, args: [] });
    }
  }
};
