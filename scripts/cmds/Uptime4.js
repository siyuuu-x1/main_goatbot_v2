const axios = require('axios');
const os = require('os');
const si = require('systeminformation');
const moment = require('moment-timezone');
const fs = require('fs-extra');
const path = require('path');

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
}

async function getCurrentCPUUsage() {
    return new Promise((resolve) => {
        const startCores = os.cpus();
        setTimeout(() => {
            const endCores = os.cpus();
            let totalIdle = 0, totalTick = 0;
            for (let i = 0; i < endCores.length; i++) {
                const start = startCores[i].times;
                const end = endCores[i].times;
                totalTick += (end.user - start.user) + (end.nice - start.nice) + (end.sys - start.sys) + (end.irq - start.irq) + (end.idle - start.idle);
                totalIdle += (end.idle - start.idle);
            }
            const usage = totalTick > 0 ? ((totalTick - totalIdle) / totalTick) * 100 : 0;
            resolve(Math.max(0, Math.min(100, usage)).toFixed(2));
        }, 100);
    });
}

async function getDiskUsage() {
    try {
        const data = await si.fsSize();
        const primaryDisk = data.find(d => d.mount === '/' || d.fs.toLowerCase().startsWith('c:')) || data[0]; 
        return primaryDisk ? primaryDisk.use.toFixed(1) : 0;
    } catch (e) {
        console.error("Disk Info Fetch Error:", e);
        return 0;
    }
}

module.exports = {
    config: {
        name: "system4",
        aliases: ["up4", "uptime4", "upt4"],
        version: "1.0",
        author: "Siyuu",
        countDown: 10,
        role: 0,
        category: "utility",
        guide: { en: "Shows dynamic system and bot information." }
    },

    onStart: async function ({ message }) {
        try {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const ramLoad = ((totalMem - freeMem) / totalMem * 100).toFixed(1);
            const cpuLoad = await getCurrentCPUUsage();
            const diskLoad = await getDiskUsage(); 
            const sysUptime = formatUptime(os.uptime());
            const botUptime = formatUptime(process.uptime());
            const cpuCores = os.cpus().length;
            const totalRam = (totalMem / 1024 / 1024 / 1024).toFixed(1) + ' GB';
            const nodeVersion = process.version;
            const cpuModel = os.cpus()[0].model.split('@')[0].trim();

            const now = moment().tz("Asia/Dhaka");
            const textMessage = `
━━━━━━━━━━━━━━
𝐒𝐲𝐬𝐭𝐞𝐦 𝐈𝐧𝐟𝐨:
╭─╼━━━━━━━━╾─╮
│ RAM Usage     : ${ramLoad}%
│ CPU Usage     : ${cpuLoad}%
│ Disk Usage    : ${diskLoad}%
│ System Uptime : ${sysUptime}
│ Bot Uptime    : ${botUptime}
│ CPU Cores     : ${cpuCores}
│ Node.js       : ${nodeVersion}
╰─━━━━━━━━━╾─╯
📅 Date: ${now.format("YYYY-MM-DD")}
⏰ Time: ${now.format("HH:mm:ss")}
`;

            const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
            const rawRes = await axios.get(GITHUB_RAW);
            const apiBase = rawRes.data.apiv1;
            const apiUrl = `${apiBase}/api/uptime?ramLoad=${ramLoad}&cpuLoad=${cpuLoad}&diskLoad=${diskLoad}&sysUptime=${sysUptime}&botUptime=${botUptime}&cpuCores=${cpuCores}&totalRam=${totalRam}&nodeVersion=${nodeVersion}&cpuModel=${encodeURIComponent(cpuModel)}`;

            try {
                const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 5000 });
                if (response && response.data) {
                    const imagePath = path.join(__dirname, 'cache', `${Date.now()}_system.png`);
                    await fs.ensureDir(path.dirname(imagePath));
                    await fs.writeFile(imagePath, response.data);

                    await message.reply({ 
                        body: textMessage, 
                        attachment: fs.createReadStream(imagePath) 
                    });

                    fs.unlink(imagePath, (err) => { if (err) console.error("Cache clean up failed:", err); });
                    return;
                }
            } catch (imgErr) {
                console.error("Image fetch failed, sending text only:", imgErr);
            }

            await message.reply(textMessage);

        } catch (err) {
            console.error("SYSTEM COMMAND ERROR:", err);
            return message.reply("❌ Oops! Something went wrong, please try again later.");
        }
    }
};
