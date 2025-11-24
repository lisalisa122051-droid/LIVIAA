// commands/sticker.js
const fs = require("fs");
module.exports = {
  name: "sticker",
  alias: ["stiker","st","s"],
  category: "tools",
  run: async ({ sock, msg, media, utils }) => {
    try {
      // expect quoted image or image URL in args
      const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
      let buffer;
      if (quoted && quoted.imageMessage) {
        // download from quoted
        const stream = await sock.downloadMediaMessage({ message: quoted.imageMessage });
        buffer = Buffer.from(await stream.arrayBuffer());
      } else throw new Error("Reply to an image with this command.");
      const webp = await media.imageToWebpBuffer(buffer);
      await sock.sendMessage(msg.key.remoteJid, { sticker: webp }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Error: ${e.message}` }, { quoted: msg });
    }
  }
};
