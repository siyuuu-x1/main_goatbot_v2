const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "delete",
		alises:["de"],
		version: "1.0",
		author: "siyuuu",
		countDown: 5,
		role: 2,
		description: {
			vi: "Xóa một lệnh",
			en: "Delete a command"
		},
		category: "admin",
		guide: {
			vi: "   {pn} <tên lệnh>: xóa lệnh",
			en: "   {pn} <command name>: delete command"
		}
	},

	langs: {
		vi: {
			noArgs: "⭕ Vui lòng cung cấp tên lệnh cần xóa",
			notFound: "⭕ Không tìm thấy lệnh: %1",
			deleted: "✅ Đã xóa lệnh: %1",
			error: "✗ Đã xảy ra lỗi: %1"
		},
		en: {
			noArgs: " Please provide command name to delete🤷🏻",
			notFound: " Command not found👉🏻: %1",
			deleted: "ok command 👉🏻 : %1 delete successful ⚙️☑️",
			error: "✗ An error occurred: %1"
		}
	},

	onStart: async function ({ args, message, getLang }) {
		if (!args.length) {
			return message.reply(getLang("noArgs"));
		}

		const commandName = args[0].toLowerCase();
		const commandPath = path.join(__dirname, `${commandName}.js`);

		try {
			// Check if file exists
			if (!fs.existsSync(commandPath)) {
				return message.reply(getLang("notFound", commandName));
			}

			// Delete the file
			fs.unlinkSync(commandPath);
			
			return message.reply(getLang("deleted", commandName));
		} catch (err) {
			return message.reply(getLang("error", err.message));
		}
	}
};
