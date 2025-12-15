module.exports = {
  config: {
    name: "love",
    version: "1.0",
    description: "Calculate love percentage between two people",
    guide: {
      en: "{pn} [name1] [name2]\nExample: love Tanjil Suayba"
    },
    category: "love",
    countDown: 1,
    role: 0,
    author: "〲T A N J I L ツ"
  },

  onStart: async function ({ message, args }) {
    if (args.length < 2) {
      return message.reply("দয়া করে দুইটি নাম লিখুন!\nযেমন: love Tanjil suayba ");
    }

    const name1 = args[0];
    const name2 = args[1];

    // Generate a random love percentage
    const lovePercent = Math.floor(Math.random() * 101);

    // Custom messages based on percentage
    let comment = "";
    if (lovePercent > 90) {
      comment = "ভালোবাসার রাজা-রানী! একদম পারফেক্ট কপল!";
    } else if (lovePercent > 70) {
      comment = "ভালোবাসা জমে উঠেছে! মনের কথা বলা বাকি!";
    } else if (lovePercent > 50) {
      comment = "ভালোই চলছে! আর একটু চেষ্টা করলে কেমিস্ট্রি হবে!";
    } else if (lovePercent > 30) {
      comment = "দুজনের মাঝে কিছু মিল আছে, তবে আরও সময় দরকার!";
    } else {
      comment = "ভাই-বোন মনে হচ্ছে! ভালোবাসা খুঁজে নাও অন্য কোথাও!";
    }

    // Final message
    const result = `❤️ Love Calculator ❤️
    
${name1} + ${name2}
ম্যাচ পার্সেন্টেজ: ${lovePercent}%

${comment}`;

    message.reply(result);
  }
};
