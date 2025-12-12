const axios = require("axios");
const ytdl = require("@distube/ytdl-core");
const fs = require("fs-extra");
const { getStreamFromURL, downloadFile, formatNumber } = global.utils;

async function getStreamAndSize(url, path = "") {
    const response = await axios({
        method: "GET",
        url,
        responseType: "stream",
        headers: {
            'Range': 'bytes=0-'
        }
    });
    if (path) response.data.path = path;
    const totalLength = response.headers["content-length"];
    return { stream: response.data, size: totalLength };
}

module.exports = {
    config: {
        name: "ytb",
        version: "1.16",
        author: "siyuu",
        countDown: 5,
        role: 0,
        description: {
            vi: "Tải video, audio hoặc xem thông tin video trên YouTube",
            en: "Download video, audio or view video information on YouTube"
        },
        category: "media",
        guide: {
            vi: "{pn} [video|-v] [<tên video>|<link video>]: dùng để tải video từ youtube.\n{pn} [audio|-a] [<tên video>|<link video>]: dùng để tải audio từ youtube\n{pn} [info|-i] [<tên video>|<link video>]: dùng để xem thông tin video từ youtube",
            en: "{pn} [video|-v] [<video name>|<video link>]: use to download video from youtube.\n{pn} [audio|-a] [<video name>|<video link>]: use to download audio from youtube\n{pn} [info|-i] [<video name>|<video link>]: use to view video information from youtube"
        }
    },

    langs: {
        vi: { error: "❌ Đã xảy ra lỗi: %1" },
        en: { error: "❌ An error occurred: %1" }
    },

    onStart: async function({ args, message, event, commandName, getLang }) {
        let type;
        switch (args[0]) {
            case "-v": case "video": type = "video"; break;
            case "-a": case "audio": type = "audio"; break;
            case "-i": case "info": type = "info"; break;
            default: return message.SyntaxError();
        }

        const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
        const urlYtb = checkurl.test(args[1]);

        if (urlYtb) {
            const infoVideo = await getVideoInfo(args[1]);
            return message.reply(`Video Title: ${infoVideo.title}\nChannel: ${infoVideo.channel.name}\nFixed by: Siyuuu`);
        }

        let keyWord = args.slice(1).join(" ").replace("?feature=share", "");
        const maxResults = 6;
        let result;
        try { result = (await search(keyWord)).slice(0, maxResults); }
        catch (err) { return message.reply(getLang("error", err.message)); }
        if (!result.length) return message.reply(getLang("noResult", keyWord));

        let msg = "";
        let i = 1;
        for (const info of result) {
            msg += `${i++}. ${info.title}\nTime: ${info.time}\nChannel: ${info.channel.name}\n\n`;
        }

        message.reply({
            body: getLang("choose", msg)
        }, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName, messageID: info.messageID, author: event.senderID, result, type
            });
        });
    },

    onReply: async function({ event, Reply, message }) {
        const { result, type } = Reply;
        const choice = parseInt(event.body);
        if (!choice || choice > result.length) return message.reply("Invalid choice.");

        const infoVideo = result[choice - 1];
        return message.reply(`Video Title: ${infoVideo.title}\nChannel: ${infoVideo.channel.name}\nFixed by: Siyuuu`);
    }
};
			
