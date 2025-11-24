// commands/igdl.js
const axios = require("axios");
module.exports = {
  name: "igdl",
  alias: ["instagram","ig"],
  category: "media",
  run: async ({ sock, msg, args }) => {
    const url = args[0];
    if (!url) return await sock.sendMessage(msg.key.remoteJid, { text: "Usage: !igdl <url>" }, { quoted: msg });
    try {
      // Try a public IG downloader API (subject to availability)
      const api = `https://r.jina.ai/http://r.jina.ai/http://r.jina.ai/http://r.jina.ai/http://r.jina.ai/${encodeURIComponent(url)}`;
      // NOTE: the above is placeholder — replace with reliable IG download API or implement scraping with puppeteer.
      const res = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
      // fallback: reply with original url if cannot fetch media
      await sock.sendMessage(msg.key.remoteJid, { text: `Unable to fetch direct media. Here is the link: ${url}` }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Error: ${e.message}` }, { quoted: msg });
    }
  }
};
