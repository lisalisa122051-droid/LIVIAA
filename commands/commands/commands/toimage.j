// commands/toimage.js
module.exports = {
  name: "toimage",
  alias: ["toimg","sticker2img"],
  category: "tools",
  run: async ({ sock, msg, media }) => {
    try {
      const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted || !quoted.stickerMessage) throw new Error("Reply to a sticker.");
      const stream = await sock.downloadMediaMessage({ message: quoted.stickerMessage });
      const buffer = Buffer.from(await stream.arrayBuffer());
      const png = await media.webpToPngBuffer(buffer);
      await sock.sendMessage(msg.key.remoteJid, { image: png }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Error: ${e.message}` }, { quoted: msg });
    }
  }
};
