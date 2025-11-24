// commands/tiktok.js
const axios = require("axios");
module.exports = {
  name: "tiktok",
  alias: ["tt","tiktokdl"],
  category: "media",
  run: async ({ sock, msg, args }) => {
    const url = args[0];
    if (!url) return await sock.sendMessage(msg.key.remoteJid, { text: "Usage: !tiktok <url>" }, { quoted: msg });
    try {
      // Example: use a public tiktok-no-watermark API if available.
      const api = `https://api.tikwm.com/?url=${encodeURIComponent(url)}`;
      const res = await axios.get(api);
      if (res.data && res.data.data && res.data.data.play) {
        const videoUrl = res.data.data.play;
        const vid = await axios.get(videoUrl, { responseType: "arraybuffer" });
        await sock.sendMessage(msg.key.remoteJid, { video: Buffer.from(vid.data) }, { quoted: msg });
      } else {
        throw new Error("Failed to retrieve video.");
      }
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Error: ${e.message}` }, { quoted: msg });
    }
  }
};
