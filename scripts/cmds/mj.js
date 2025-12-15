const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);
const API_ENDPOINT = "https://dev.oculux.xyz/api/mj-proxy-pub"; 

async function downloadSingleImage(url, tempDir, index) {
    let tempFilePath = '';
    try {
        const imageStreamResponse = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            timeout: 120000 
        });

        tempFilePath = path.join(tempDir, `mj_single_${Date.now()}_${index}.jpg`);
        const writer = fs.createWriteStream(tempFilePath);
        imageStreamResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        return { path: tempFilePath };

    } catch (e) {
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        throw new Error("Failed to download the image.");
    }
}

module.exports = {
  config: {
    name: "midjourney",
    aliases: ["mj", "imagine"],
    version: "20.0",
    author: "siyuuu",
    countDown: 20,
    role: 0,
    longDescription: "Generate 4 Midjourney images and select one by replying.",
    category: "ai-image",
    guide: {
      en: "{pn} [prompt]. Reply U1-U4 or V1-V4 to select an image."
    }
  },

  onStart: async function({ message, args, event, commandName }) {
    let prompt = args.join(" ");
    const cacheDir = path.join(__dirname, 'cache');

    if (!fs.existsSync(cacheDir)) fs.mkdirp(cacheDir);

    if (!prompt) {
      return message.reply("❌ Please provide a prompt to generate an image.");
    }

    message.reaction("⏳", event.messageID);
    
    try {
      const cleanedPrompt = prompt.trim();
      
      const apiResponse = await axios.get(`${API_ENDPOINT}?prompt=${encodeURIComponent(cleanedPrompt)}&usepolling=false`, { timeout: 300000 }); 
      const data = apiResponse.data;

      if (!data.status || data.status === "failed" || !data.results || data.results.length < 4) {
        const errorDetail = data.message || "API did not return a successful status or enough images (expected 4).";
        throw new Error(`Generation failed: ${errorDetail}`);
      }
      
      const finalUrls = data.results.slice(0, 4); 
      const attachments = [];
      const tempPaths = [];

      for (let i = 0; i < finalUrls.length; i++) {
          const result = await downloadSingleImage(finalUrls[i], cacheDir, i + 1);
          attachments.push(fs.createReadStream(result.path));
          tempPaths.push(result.path);
      }
      
      message.reply({
        body: `✨ Midjourney image generated (4 images attached). Reply U1-U4 or V1-V4 to select the corresponding image.`,
        attachment: attachments 
      }, (err, info) => {
        if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
                commandName,
                messageID: info.messageID,
                author: event.senderID,
                imageUrls: finalUrls,
                tempPaths: tempPaths
            });
        }
      });
      
      message.reaction("✅", event.messageID);

    } catch (error) {
      message.reaction("❌", event.messageID);
      const errorMessage = error.response ? error.response.data.error || error.response.data.message || `HTTP Error: ${error.response.status}` : error.message;
      console.error("Midjourney Command Error:", error);
      message.reply(`❌ Image generation failed: ${errorMessage}`);
    }
  },

  onReply: async function({ message, event, Reply }) { 
    const { imageUrls, tempPaths } = Reply;
    const cacheDir = path.join(__dirname, 'cache');
    
    let tempImagePath = '';
    
    try {
        const userReply = event.body.trim().toUpperCase(); 
        const match = userReply.match(/^(U|V)([1-4])$/); 

        if (!match) {
            return;
        }

        const index = parseInt(match[2]); 
        const urlIndex = index - 1; 

        if (urlIndex >= imageUrls.length) {
            return message.reply(`❌ Invalid selection index.`);
        }

        message.reaction("⏳", event.messageID);

        const selectedUrl = imageUrls[urlIndex];
        
        const result = await downloadSingleImage(selectedUrl, cacheDir, `final_${index}`);
        tempImagePath = result.path;
        
        await message.reply({
            body: `Here is your image ✨`,
            attachment: fs.createReadStream(tempImagePath)
        });

        message.reaction("✅", event.messageID);

    } catch (error) {
        message.reaction("❌", event.messageID);
        console.error("Selection Download Error:", error);
        message.reply(`❌ Failed to retrieve selected image. Error: ${error.message}`);
    } finally {
        const cleanup = async () => {
            if (tempImagePath && fs.existsSync(tempImagePath)) {
                await fs.unlink(tempImagePath).catch(console.error);
            }
            if (tempPaths) {
                await Promise.all(tempPaths.map(p => fs.unlink(p).catch(console.error)));
            }
        };
        cleanup().catch(console.error);
    }
  }
};
