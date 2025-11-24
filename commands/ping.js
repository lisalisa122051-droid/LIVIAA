// commands/ping.js
module.exports = {
  name: "ping",
  alias: ["p"],
  category: "tools",
  run: async ({ sock, msg }) => {
    const start = Date.now();
    const reply = await sock.sendMessage(msg.key.remoteJid, { text: "Pinging..." }, { quoted: msg });
    const latency = Date.now() - start;
    await sock.sendMessage(msg.key.remoteJid, { text: `Pong! Latency: ${latency} ms` }, { quoted: reply });
  }
};
