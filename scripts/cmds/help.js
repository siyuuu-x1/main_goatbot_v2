const fs = require("fs-extra");

module.exports = {
    config: {
        name: "help",
        aliases: ["menu", "commands"],
        version: "4.8",
        author: "Siyuu",
        shortDescription: "Show all available commands",
        longDescription: "Displays a clean and premium-styled categorized list of commands.",
        category: "system",
        guide: "{pn}help [command name]",
        cooldown: 5
    },

    onStart: async function ({ message, args, prefix }) {
        const allCommands = global.GoatBot.commands;
        const categories = {};

        const cleanCategoryName = (text) => {
            if (!text) return "others";
            return text
                .normalize("NFKD")
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, " ")
                .trim()
                .toUpperCase();
        };

        for (const [name, cmd] of allCommands) {
            const cat = cleanCategoryName(cmd.config.category);
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd.config.name);
        }

        // Single command detail
        if (args[0]) {
            const query = args[0].toLowerCase();
            const cmd =
                allCommands.get(query) ||
                [...allCommands.values()].find(c => (c.config.aliases || []).includes(query));
            if (!cmd) return message.reply(`❌ Command "${query}" not found.`);

            const {
                name,
                version,
                author,
                guide,
                category,
                shortDescription,
                longDescription,
                aliases,
                cooldown
            } = cmd.config;

            const desc = longDescription || shortDescription || "No description";
            const usage = (guide || `${prefix}${name}`).replace(/{pn}/g, prefix);

            const box = 
`╭──❏ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗗𝗘𝗧𝗔𝗜𝗟 ❏──╮
│ ✧ Name: ${name}
│ ✧ Category: ${category || "Uncategorized"}
│ ✧ Version: ${version}
│ ✧ Author: ${author}
│ ✧ Cooldowns: ${cooldown || 0}s
╰─────────────────────⭓
📘 Description: ${desc}
📗 Usage: ${usage}`;

            return message.reply(box);
        }

        // Full help menu
        const formatCommands = (cmds) => cmds.sort().map(c => `║ • ${c}`).join("\n");
        let msg = `‣ Bot Owner: Siyam\n╔═─── HELP ──═╗\n`;

        const sortedCategories = Object.keys(categories).sort();
        for (const cat of sortedCategories) {
            msg += `╟─ 🗂️ Category: ${cat}\n`;
            msg += `${formatCommands(categories[cat])}\n`;
        }

        msg += `╚═───────═╝\n`;
        msg += `📊 Total Commands: ${allCommands.size} — by Siyam`;

        return message.reply(msg);
    }
};
