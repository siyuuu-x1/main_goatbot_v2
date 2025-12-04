const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
const mime = require("mime-types");

module.exports = {
  config: {
    name: "catbox",
    aliases: ["cb"],
    version: "1.0",
    author: "Saimx69x",
    role: 0,
    category: "utility",
    Description: "Upload media to Catbox and return the link.",
    guide: { en: "Reply to an image/video/file to upload it to Catbox.moe" },
  },

  onStart: async function ({ api, event }) {
    const attachment = event.messageReply?.attachments?.[0];
    const attachmentUrl = attachment?.url;

    if (!attachmentUrl) {
      return api.sendMessage("❌ Please reply to a media file to upload.", event.threadID, event.messageID);
    }

    const ext = path.extname(attachmentUrl.split("?")[0]) || ".bin";
    const filename = "upload" + ext;

    api.setMessageReaction("🕒", event.messageID, async () => {
      try {
        const fileRes = await axios.get(attachmentUrl, { responseType: "stream" });

        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", fileRes.data, {
          filename: filename,
          contentType: mime.lookup(ext) || "application/octet-stream",
        });

        const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
          headers: form.getHeaders(),
        });

        api.setMessageReaction("✅", event.messageID, () => {}, true);
        api.sendMessage(data, event.threadID, event.messageID);
      } catch (err) {
        console.error("Upload error:", err.message);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        api.sendMessage("❌ Upload failed. File may not be supported.", event.threadID, event.messageID);
      }
    }, true);
  }
};
