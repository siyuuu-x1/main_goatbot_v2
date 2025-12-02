const { getStreamFromURL } = global.utils;

module.exports = {
	config: {
		name: "gone",
		version: "1.0",
		author: "Neoaz ゐ | Fahim",
		countDown: 5,
		role: 4,//only dev can use to fuck their bot id 🥰
		description: {
			en: "Run if you want to vanish your bot id 🐦"
		},
		category: "XudlingPong ⚠️",
		guide: {
			en: "{pn} gone"
		}
	},

	langs: {
		en: {
			error: "You're very lucky brother 🐦"
		}
	},

	onStart: async function ({ message, getLang }) {
		try {
			const imageUrl = "https://i.postimg.cc/2yyxCM3L/http://img-20251202-002135.jpg";
			const imageStream = await getStreamFromURL(imageUrl, "gone.jpg");
			
			return message.reply({
				attachment: imageStream
			});
		} catch (error) {
			console.error(error);
			return message.reply(getLang("error"));
		}
	}
};
