const axios = require("axios");

module.exports = {
  config: {
    name: "math",
    aliases: ["mathgame"],
    version: "1.8",
    author: "siyuu",
    longDescription: {
      en: "🧠 Think you're smart? Try this math challenge! 🏆",
    },
    category: "game",
    guide: {
      en: "⚡ Type: **{p}{n}** | Set mode: **{p}{n} set <difficulty> <type>**",
    },
  },

  userSettings: new Map(),

  onStart: async function ({ message, event, args }) {
    const userID = event.senderID;

    if (!this.userSettings.has(userID)) {
      this.userSettings.set(userID, { difficulty: "normal", type: "text" });
    }

    let userSetting = this.userSettings.get(userID);

    // Handle "set" command
    if (args.length === 3 && args[0].toLowerCase() === "set") {
      const difficulty = args[1].toLowerCase();
      const type = args[2].toLowerCase();

      const validDifficulties = ["easy", "normal", "hard"];
      const validTypes = ["text", "number"];

      if (!validDifficulties.includes(difficulty) || !validTypes.includes(type)) {
        return message.reply(
          `⚠️ Invalid choice! ❌\n📌 Difficulty: **easy, normal, hard**\n📌 Type: **text, number**`
        );
      }

      userSetting.difficulty = difficulty;
      userSetting.type = type;
      this.userSettings.set(userID, userSetting);

      return message.reply(
        `✅ Settings Updated!\n🎯 Difficulty: **${difficulty}**\n🎯 Type: **${type}**`
      );
    }

    // Fetch question from API
    try {
      const { difficulty, type } = userSetting;
      const apiUrl = `https://global-redwans-apis.onrender.com/api/math?difficulty=${difficulty}&type=${type}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.question || !data.options) {
        return message.reply("❌ Failed to generate a question!");
      }

      const { question, options, correct_answer: correctAnswer } = data;
      const optionKeys = Object.keys(options);
      const optionsText = optionKeys
        .map((key, index) => `${index + 1}. ${options[key]}`)
        .join("\n");

      const timeoutDuration =
        difficulty === "easy" ? 30000 : difficulty === "normal" ? 35000 : 40000;

      message.reply(
        `🎯 MATH GAME 🧮\n\n📢 Question: ${question}\n\n${optionsText}\n\n✨ Reply with (1,2,3,4) to answer! (⏳ ${timeoutDuration / 1000} sec)`,
        (err, info) => {
          if (!err) {
            const timeout = setTimeout(() => {
              if (global.GoatBot.onReply.has(info.messageID)) {
                try { message.unsend(info.messageID); } catch {}
                global.GoatBot.onReply.delete(info.messageID);
                message.reply("⏳ Time's up! ❌ You lose!");
              }
            }, timeoutDuration);

            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              messageID: info.messageID,
              author: event.senderID,
              options: options,
              correctAnswer: correctAnswer,
              timeout: timeout,
            });
          }
        }
      );
    } catch (error) {
      console.error("Error fetching math problem:", error.message);
      message.reply("❌ Oops! Something went wrong!");
    }
  },

  onReply: async function ({ message, event }) {
    try {
      if (!event.messageReply) return; // Ignore if not a reply

      const replyData = global.GoatBot.onReply.get(event.messageReply.messageID);
      if (!replyData || replyData.author !== event.senderID) return;

      const { options, correctAnswer, timeout } = replyData;
      clearTimeout(timeout);

      const optionKeys = Object.keys(options);
      const userAnswerIndex = parseInt(event.body.trim()) - 1;
      const userSelectedOption = optionKeys[userAnswerIndex];

      if (!userSelectedOption || options[userSelectedOption] === undefined) {
        return message.reply(
          "⚠️ Invalid Choice! ❌ Please select a number (1-4)."
        );
      }

      const userSelectedAnswer = options[userSelectedOption];

      try { message.unsend(event.messageReply.messageID); } catch {}

      if (
        userSelectedAnswer.toString().trim() === correctAnswer.toString().trim()
      ) {
        message.reply("🎉 CORRECT! 🏆 You win!");
      } else {
        message.reply("❌ WRONG! Better luck next time.");
      }

      global.GoatBot.onReply.delete(event.messageReply.messageID);
    } catch (error) {
      console.error("Error checking answer:", error.message);
      message.reply("⚠️ Error!");
    }
  },
};
