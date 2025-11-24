// commands/google.js
const googleIt = require("google-it");
module.exports = {
  name: "google",
  alias: ["g"],
  category: "tools",
  run: async ({ sock, msg, args }) => {
    const q = args.join(" ");
    if (!q) return await sock.sendMessage(msg.key.remoteJid, { text: "Usage: !google <query>" }, { quoted: msg });
    try {
      const results = await googleIt({ query: q, limit: 5 });
      let out = `Google results for: ${q}\n\n`;
      results.forEach((r, i) => {
        out += `${i+1}. ${r.title}\n${r.link}\n${r.snippet || ""}\n\n`;
      });
      await sock.sendMessage(msg.key.remoteJid, { text: out.trim() }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Search error: ${e.message}` }, { quoted: msg });
    }
  }
};
