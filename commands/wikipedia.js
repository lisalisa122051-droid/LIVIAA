// commands/wikipedia.js
const Wiki = require('wikijs').default;
module.exports = {
  name: "wikipedia",
  alias: ["wiki"],
  category: "tools",
  run: async ({ sock, msg, args }) => {
    const q = args.join(" ");
    if (!q) return await sock.sendMessage(msg.key.remoteJid, { text: "Usage: !wikipedia <query>" }, { quoted: msg });
    try {
      const page = await Wiki().page(q);
      const summary = await page.summary();
      await sock.sendMessage(msg.key.remoteJid, { text: summary.slice(0, 4000) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: `No article found for: ${q}` }, { quoted: msg });
    }
  }
};
