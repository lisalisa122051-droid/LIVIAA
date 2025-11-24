// commands/ytmp4.js
const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "ytmp4",
  alias: ["ytmp","ytvideo"],
  category: "media",
  run: async ({ sock, msg, args }) => {
    const url = args[0];
    if (!url) return await sock.sendMessage(msg.key.remoteJid, { text: "Usage: !ytmp4 <youtube_url>" }, { quoted: msg });
    try {
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title.replace(/[<>:"/\\|?*\x00]/g, "").slice(0, 50);
      const filePath = path.join(process.cwd(), `${title}.mp4`);
      const writeStream = fs.createWriteStream(filePath);
      ytdl(url, { quality: "highestvideo" }).pipe(writeStream);
      writeStream.on("finish", async () => {
        const stat = fs.statSync(filePath);
        const maxSize = 100 * 1024 * 1024; // 100MB limit sample
        if (stat.size > maxSize) {
          await sock.sendMessage(msg.key.remoteJid, { text: "File too large to send via WA. Download locally from server." }, { quoted: msg });
          fs.unlinkSync(filePath);
          return;
        }
        await sock.sendMessage(msg.key.remoteJid, { video: fs.readFileSync(filePath), fileName: `${title}.mp4` }, { quoted: msg });
        fs.unlinkSync(filePath);
      });
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Error downloading: ${e.message}` }, { quoted: msg });
    }
  }
};
