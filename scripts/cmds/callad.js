const { getStreamsFromAttachment, log } = global.utils;
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

const OWNER_UID = "61584749395355"; // ✅ Only this UID will receive messages

module.exports = {
	config: {
		name: "callad",
		version: "1.8",
		author: "NTKhang + Siyam",
		countDown: 5,
		role: 0,
		description: {
			vi: "Gửi báo cáo, góp ý, báo lỗi,... đến owner bot",
			en: "Send report, feedback, bug,... to owner bot"
		},
		category: "contacts admin",
		guide: {
			vi: "   {pn} <tin nhắn>",
			en: "   {pn} <message>"
		}
	},

	langs: {
		vi: {
			missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi về owner",
			content: "\n\nNội dung:\n─────────────────\n%1\n─────────────────\nReply tin nhắn này để gửi phản hồi",
			success: "✅ Tin nhắn của bạn đã được gửi đến owner thành công!",
			failed: "❌ Lỗi khi gửi tin nhắn đến owner\nKiểm tra console để biết thêm chi tiết",
			replyUserSuccess: "✅ Phản hồi của bạn đã được gửi đến người dùng thành công!"
		},
		en: {
			missingMessage: "Please enter the message you want to send to owner",
			content: "\n\nContent:\n─────────────────\n%1\n─────────────────\nReply this message to send a reply",
			success: "✅ Your message has been sent to the owner successfully!",
			failed: "❌ Failed to send message to owner\nCheck console for more details",
			replyUserSuccess: "✅ Your reply has been sent to the user successfully!"
		}
	},

	onStart: async function ({ args, message, event, usersData, threadsData, api, commandName, getLang }) {
		if (!args[0]) return message.reply(getLang("missingMessage"));

		const { senderID, threadID, isGroup } = event;
		const senderName = await usersData.getName(senderID);
		const threadName = isGroup ? (await threadsData.get(threadID)).threadName : "";

		const msg = `==📨 CALL OWNER 📨==\n- User Name: ${senderName}\n- User ID: ${senderID}` +
			(isGroup ? `\n- Group: ${threadName}\n- Thread ID: ${threadID}` : "") +
			getLang("content", args.join(" "));

		const formMessage = {
			body: msg,
			mentions: [{ id: senderID, tag: senderName }],
			attachment: await getStreamsFromAttachment(
				[...event.attachments, ...(event.messageReply?.attachments || [])]
					.filter(item => mediaTypes.includes(item.type))
			)
		};

		try {
			const info = await api.sendMessage(formMessage, OWNER_UID);
			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				threadID,
				messageIDSender: event.messageID,
				type: "userCallOwner"
			});
			return message.reply(getLang("success"));
		} catch (err) {
			log.err("CALL OWNER", err);
			return message.reply(getLang("failed"));
		}
	},

	onReply: async ({ args, event, api, message, Reply, usersData, getLang }) => {
		const { type, threadID, messageIDSender } = Reply;
		const senderName = await usersData.getName(event.senderID);

		switch (type) {
			case "userCallOwner": {
				// Reply from owner to user
				const formMessage = {
					body: `⌖ Reply from owner ${senderName}:\n─────────────────\n${args.join(" ")}\n─────────────────\nReply this message to continue`,
					mentions: [{ id: event.senderID, tag: senderName }],
					attachment: await getStreamsFromAttachment(
						event.attachments.filter(item => mediaTypes.includes(item.type))
					)
				};

				api.sendMessage(formMessage, threadID, (err, info) => {
					if (err) return message.err(err);
					message.reply(getLang("replyUserSuccess"));
					global.GoatBot.onReply.set(info.messageID, {
						commandName: Reply.commandName,
						messageID: info.messageID,
						messageIDSender: event.messageID,
						threadID,
						type: "ownerReply"
					});
				}, messageIDSender);
				break;
			}
			case "ownerReply":
				// Can implement reply back if needed
				break;
			default:
				break;
		}
	}
};
