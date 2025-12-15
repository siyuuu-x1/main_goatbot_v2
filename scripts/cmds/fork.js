module.exports = {
  config: {
    name: "fork",
    aliases: ["repo", "git"],
    version: "1.0",
    author: "siyuuu",
    countDown: 3,
    role: 0,
    longDescription: "Returns the link to the official, updated fork of the bot's repository.",
    category: "system",
    guide: { en: "{pn}" }
  },

  onStart: async function({ message }) {
    const text = "✓ | Here is the updated fork:\n\nhttps://github.com/siyamislam1591-cyber/Neo-prime1\n\n" +
                 "Changes:\n all fixed \n\n" +
                 "🛂";
    
    message.reply(text);
  }
};
