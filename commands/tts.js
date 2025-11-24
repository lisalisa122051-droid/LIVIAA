// commands/tts.js
const gtts = require("google-tts-api");
const axios = require("axios");
module.exports = {
  name: "tts",
  alias: ["say"],
  category: "tools",
  run: async ({ sock, msg, args }) => {
    const text = args.join(" ");
    if (!text) return await sock.sendMessage(msg.key.remoteJid, { text: "Usage: !tts <text>" }, { quoted: msg });
    try {
      const url = gtts.getAudioUrl(text, { lang: "id", slow: false, host: "https://translate.google.com" });
      const audio = await axios.get(url, { responseType: "arraybuffer" });
      await sock.sendMessage(msg.key.remoteJid, { audio: Buffer.from(audio.data), mimetype: "audio/mpeg" }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: "TTS error: " + e.message }, { quoted: msg });
    }
  }
};
