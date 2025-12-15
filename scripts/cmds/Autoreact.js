module.exports = {
  config: {
    name: "autoreact",
    version: "4.1.0",
    author: "siyuuu",
    role: 0,
    category: "system",
    shortDescription: "Smart auto react (not on every text)",
    longDescription: "Bot reacts only on short, emoji or expressive messages"
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    try {
      const { messageID, body } = event;
      if (!messageID || !body) return;

      const text = body.toLowerCase().trim();

      // ❌ Ignore long normal messages
      if (text.length > 25 && !/[\u{1F300}-\u{1FAFF}]/u.test(text)) return;

      // ==========================
      // Emoji based categories
      // ==========================
      const categories = [
        { emojis: ["😀","😃","😄","😁","😆","😂","🤣","😹"], react: "😆" },
        { emojis: ["😢","😭","🥺","😞","💔"], react: "😢" },
        { emojis: ["❤️","💖","💕","😍","🥰","🫶"], react: "❤️" },
        { emojis: ["😡","😠","🤬"], react: "😡" },
        { emojis: ["😮","😱","😲","😳"], react: "😮" },
        { emojis: ["😎","🔥","💯"], react: "😎" },
        { emojis: ["💀","☠️"], react: "💀" },
        { emojis: ["🎉","🥳"], react: "🎉" },
        { emojis: ["😴","💤"], react: "😴" },
        { emojis: ["🤔"], react: "🤔" },
        { emojis: ["👍","👌","✌️"], react: "👍" }
      ];

      // ==========================
      // Text triggers (LIMITED)
      // ==========================
      const textTriggers = [
        { keys: ["haha","lol","xd","moja"], react: "😆" },
        { keys: ["sad","kharap","cry"], react: "😢" },
        { keys: ["love","valobasi","miss"], react: "❤️" },
        { keys: ["wow","omg"], react: "😮" },
        { keys: ["nice","cool"], react: "😎" },
        { keys: ["ok","yes","hmm"], react: "👍" },
        { keys: ["siyuuu","siyam","siyu","siyuu",
    "nila","mahi","riya","sumi","mimi",
    "nisa","jannat","ayesha","aisha",
    "sadia","nusrat","lamia","farin",
    "anika","tania","maria","faria",
    "tisha","mou","purnima","priya",
    "sraboni","nabila","neha","sonia",
    "afrin","tahmina","sabina","rima",
    "shanta","tumpa","koli","lipi",
    "puja","moumi","bristy","tithi",
    "mim","muna","nodi","sneha",
    "maisa","ifa","tina","lima"],
  react: "😘" } ];

      let react = null;

      // ==========================
      // Check emoji first
      // ==========================
      outer:
      for (const cat of categories) {
        for (const e of cat.emojis) {
          if (text.includes(e)) {
            react = cat.react;
            break outer;
          }
        }
      }

      // ==========================
      // Check text triggers
      // ==========================
      if (!react) {
        outer2:
        for (const t of textTriggers) {
          for (const k of t.keys) {
            if (text === k || text.includes(k)) {
              react = t.react;
              break outer2;
            }
          }
        }
      }

      // ❌ No match = no react
      if (!react) return;

      await api.setMessageReaction(react, messageID, () => {}, true);

    } catch (e) {
      console.log("AutoReact Error:", e.message);
    }
  }
};
