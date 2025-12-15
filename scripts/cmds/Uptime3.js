const os = require("os");
const pidusage = require("pidusage");
const fs = require("fs");

module.exports = {
  config: {
    name: "uptime3",
    aliases: ["upt3"],
    version: "2.5",
    author: "siyuuu",
    countDown: 1,
    role: 0,
    shortDescription: "Show system and bot status",
    longDescription: "Displays uptime, CPU, memory, disk, and bot stats",
    category: "info",
    guide: "{pn}",
    noPrefix: true
  },

  onStart: async function (ctx) {
    await module.exports.sendUptime(ctx);
  },

  onChat: async function (ctx) {
    const input = ctx.event.body?.toLowerCase().trim();
    const triggers = [this.config.name, ...(this.config.aliases || [])];
    if (!triggers.includes(input)) return;

    await module.exports.sendUptime(ctx);
  },

  sendUptime: async function ({ message, usersData, threadsData }) {
    // 1️⃣ Send initial message
    const loadingMsg = await message.reply("⏳ Starting...");

    // 2️⃣ Progress bar frames
    const frames = [
      "⏳ [░░░░░░░░░░] 0%",
      "⏳ [█░░░░░░░░░] 10%",
      "⏳ [██░░░░░░░░] 20%",
      "⏳ [███░░░░░░░] 30%",
      "⏳ [████░░░░░░] 40%",
      "⏳ [█████░░░░░] 50%",
      "⏳ [██████░░░░] 60%",
      "⏳ [███████░░░] 70%",
      "⏳ [████████░░] 80%",
      "⏳ [█████████░] 90%",
      "⏳ [██████████] 100%"
    ];

    // 3️⃣ Animate progress bar
    for (let i = 0; i < frames.length; i++) {
      await new Promise(r => setTimeout(r, 300)); // 0.3 sec per frame
      await message.edit(frames[i], loadingMsg.messageID);
    }

    // 4️⃣ Gather system & bot info
    const now = new Date();
    const formatDate = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    const uptimeBot = process.uptime();
    const uptimeSys = os.uptime();
    const toTime = (sec) => {
      const d = Math.floor(sec / 86400);
      const h = Math.floor((sec % 86400) / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${d ? `${d}d ` : ""}${h}h ${m}m ${s}s`;
    };

    const usage = await pidusage(process.pid);
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(0);
    const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(0);
    const usedRam = (usage.memory / 1024 / 1024).toFixed(1);
    const cpuUsage = usage.cpu.toFixed(1);
    const cpuModel = os.cpus()[0].model;
    const cpuCores = os.cpus().length;

    const pkgCount = Object.keys(
      JSON.parse(fs.readFileSync("package.json")).dependencies || {}
    ).length;

    const users = await usersData.getAll();
    const threads = await threadsData.getAll();

    // 5️⃣ Final uptime message
    const finalMsg = `
📅 Date: ${formatDate}

⏱️ Uptime : ${toTime(uptimeBot)}
🖥️ System time : ${toTime(uptimeSys)}

💻 CPU : ${cpuModel}
💻 CORES : ${cpuCores}
💻 LOAD : ${cpuUsage}%

💾 RAM : ${usedRam} MB / ${totalRam} GB
💾 Free memory : ${freeRam} GB

📦 Package : ${pkgCount}
👥 Users : ${users.length}
👨‍👩‍👧‍👦 Groups : ${threads.length}

🗂️ Disk used : _GB / __GB
📁 Available : _GB
`;

    await message.edit(finalMsg, loadingMsg.messageID);
  }
};
