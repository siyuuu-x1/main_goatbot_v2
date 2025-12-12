const axios = require('axios');

const baseApiUrl = async () => {
    return "https://noobs-api.top/dipto";
};

// 🔹 Safe sendMessage wrapper (prevents messageID crash)
async function safeSend(api, content, event, callback = null) {
    try {
        if (!event || !event.threadID) {
            console.log("⚠️ No event context — sending without replyID");
            return api.sendMessage(content);
        }
        return api.sendMessage(content, event.threadID, callback, event?.messageID);
    } catch (err) {
        console.error("safeSend error:", err.message);
    }
}

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bbe", "babe"],
    version: "7.1.0",
    author: "siyuuuuu",
    countDown: 0,
    role: 0,
    description: "Better than all sim simi",
    category: "chat",
    guide: {
        en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR\nteach [react] [YourMessage] - [react1], [react2], [react3]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nmsg [YourMessage] OR\nlist OR all OR\nedit [YourMessage] - [NewMessage]"
    }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const link = `${await baseApiUrl()}/baby`;
    const dipto = args.join(" ").toLowerCase();
    const uid = event?.senderID;
    let command, comd, final;

    try {
        if (!args[0]) {
            const ran = ["Bolo baby", "hum", "type help baby", "type !baby hi"];
            return safeSend(api, ran[Math.floor(Math.random() * ran.length)], event);
        }

        if (args[0] === 'remove') {
            const fina = dipto.replace("remove ", "");
            const dat = (await axios.get(`${link}?remove=${fina}&senderID=${uid}`)).data.message;
            return safeSend(api, dat, event);
        }

        if (args[0] === 'rm' && dipto.includes('-')) {
            const [fi, f] = dipto.replace("rm ", "").split(' - ');
            const da = (await axios.get(`${link}?remove=${fi}&index=${f}`)).data.message;
            return safeSend(api, da, event);
        }

        if (args[0] === 'list') {
            if (args[1] === 'all') {
                const data = (await axios.get(`${link}?list=all`)).data;
                const teachers = await Promise.all(data.teacher.teacherList.map(async (item) => {
                    const number = Object.keys(item)[0];
                    const value = item[number];
                    const name = (await usersData.get(number)).name;
                    return { name, value };
                }));
                teachers.sort((a, b) => b.value - a.value);
                const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.value}`).join('\n');
                return safeSend(api, `Total Teach = ${data.length}\n👑 | List of Teachers of baby\n${output}`, event);
            } else {
                const d = (await axios.get(`${link}?list=all`)).data.length;
                return safeSend(api, `Total Teach = ${d}`, event);
            }
        }

        if (args[0] === 'msg') {
            const fuk = dipto.replace("msg ", "");
            const d = (await axios.get(`${link}?list=${fuk}`)).data.data;
            return safeSend(api, `Message ${fuk} = ${d}`, event);
        }

        if (args[0] === 'edit') {
            const command = dipto.split(' - ')[1];
            if (!command || command.length < 2)
                return safeSend(api, '❌ | Invalid format! Use edit [YourMessage] - [NewReply]', event);
            const dA = (await axios.get(`${link}?edit=${args[1]}&replace=${command}&senderID=${uid}`)).data.message;
            return safeSend(api, `changed ${dA}`, event);
        }

        if (args[0] === 'teach' && args[1] !== 'amar' && args[1] !== 'react') {
            [comd, command] = dipto.split(' - ');
            final = comd.replace("teach ", "");
            if (!command || command.length < 2)
                return safeSend(api, '❌ | Invalid format!', event);
            const re = await axios.get(`${link}?teach=${final}&reply=${command}&senderID=${uid}`);
            const tex = re.data.message;
            const teacher = (await usersData.get(re.data.teacher)).name;
            return safeSend(api, `✅ Replies added ${tex}\nTeacher: ${teacher}\nTeachs: ${re.data.teachs}`, event);
        }

        if (args[0] === 'teach' && args[1] === 'amar') {
            [comd, command] = dipto.split(' - ');
            final = comd.replace("teach ", "");
            if (!command || command.length < 2)
                return safeSend(api, '❌ | Invalid format!', event);
            const tex = (await axios.get(`${link}?teach=${final}&senderID=${uid}&reply=${command}&key=intro`)).data.message;
            return safeSend(api, `✅ Replies added ${tex}`, event);
        }

        if (args[0] === 'teach' && args[1] === 'react') {
            [comd, command] = dipto.split(' - ');
            final = comd.replace("teach react ", "");
            if (!command || command.length < 2)
                return safeSend(api, '❌ | Invalid format!', event);
            const tex = (await axios.get(`${link}?teach=${final}&react=${command}`)).data.message;
            return safeSend(api, `✅ Replies added ${tex}`, event);
        }

        if (dipto.includes('amar name ki') || dipto.includes('amr nam ki') || dipto.includes('whats my name')) {
            const data = (await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`)).data.reply;
            return safeSend(api, data, event);
        }

        // Normal font reply
        const d = (await axios.get(`${link}?text=${dipto}&senderID=${uid}`)).data.reply;
        api.sendMessage(d, event?.threadID, (error, info) => {
            if (!info?.messageID) return;
            global.GoatBot.onReply.set(info.messageID, {
                commandName: "bby",
                type: "reply",
                messageID: info.messageID,
                author: event.senderID,
                d,
                apiUrl: link
            });
        }, event?.messageID);

    } catch (e) {
        console.log(e);
        safeSend(api, "⚠️ Error: Check console for details", event);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    try {
        if (event.type == "message_reply") {
            const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(event.body?.toLowerCase())}&senderID=${event.senderID}`)).data.reply;
            api.sendMessage(a, event?.threadID, (error, info) => {
                if (!info?.messageID) return;
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: "bby",
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    a
                });
            }, event?.messageID);
        }

        if (event.senderID == "61584749395355") {
            const body = event.body ? event.body.toLowerCase() : "";
            if (body.startsWith("baby") || body.startsWith("bby") || body.startsWith("bot") ||
                body.startsWith("jan") || body.startsWith("babu") || body.startsWith("janu")) {

                const siyamReplies = [
                    "ji ji vai siyam bolo bolo suntechi🤗",
                    "ji siyam vaiya?😊",
                    "Siyam vaiya bolo kivabe help korte pari🤗",
                    "assalamualaikum siyam vaiya😊",
                    "Kemon aso siyam vaiya? 😎",
                    "siyam Vaiya ki masti korbo? 😁",
                    "hea siyam vai Bolo vaiya ki kaj korte pari 🤔"
                ];

                const replyMsg = siyamReplies[Math.floor(Math.random() * siyamReplies.length)];

                api.sendMessage(replyMsg, event?.threadID, (error, info) => {
                    if (!info?.messageID) return;
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: "bby",
                        type: "reply",
                        messageID: info.messageID,
                        author: event.senderID,
                        siyamReplies
                    });
                }, event?.messageID);

                return;
            }
        }
    } catch (err) {
        safeSend(api, `Error: ${err.message}`, event);
    }
};

module.exports.onChat = async ({ api, event, message }) => {
    try {
        const body = event.body ? event.body?.toLowerCase() : "";

        // Custom Siyam replies on chat
        if (event.senderID == "61584749395355" &&
            (body.startsWith("baby") || body.startsWith("bby") || body.startsWith("bot") ||
             body.startsWith("jan") || body.startsWith("babu") || body.startsWith("janu"))) {

            const siyamReplies = [
                "ji ji vai siyam bolo bolo suntechi🤗",
                    "ji siyam vaiya?😊",
                    "Siyam vaiya bolo kivabe help korte pari🤗",
                    "assalamualaikum siyam vaiya😊",
                    "Kemon aso siyam vaiya? 😎",
                    "siyam Vaiya ki masti korbo? 😁",
                    "hea siyam vai Bolo vaiya ki kaj korte pari 🤔"
                ];

            const replyMsg = siyamReplies[Math.floor(Math.random() * siyamReplies.length)];

            api.sendMessage(replyMsg, event?.threadID, (error, info) => {
                if (!info?.messageID) return;
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: "bby",
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    siyamReplies
                });
            }, event?.messageID);

            return;
        }

        // General chat replies
        if (body.startsWith("baby") || body.startsWith("bby") || body.startsWith("bot") ||
            body.startsWith("jan") || body.startsWith("babu") || body.startsWith("janu")) {
            const arr = body.replace(/^\S+\s*/, "");
            const randomReplies = ["😚", "Yes 😀, I am here", "What's up?", "Bolo jaan ki korte pari tmr jonno"];
            if (!arr) {
                return api.sendMessage(randomReplies[Math.floor(Math.random() * randomReplies.length)], event?.threadID, (error, info) => {
                    if (info?.messageID) {
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName: "bby",
                            type: "reply",
                            messageID: info.messageID,
                            author: event.senderID
                        });
                    }
                }, event?.messageID);
            }

            const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}`)).data.reply;
            api.sendMessage(a, event?.threadID, (error, info) => {
                if (!info?.messageID) return;
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: "bby",
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    a
                });
            }, event?.messageID);
        }
    } catch (err) {
        safeSend(api, `Error: ${err.message}`, event);
    }
};
