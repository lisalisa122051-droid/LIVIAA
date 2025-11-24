// commands/ytmp3.js
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "ytmp3",
  alias: ["ytaudio","ytmp3"],
  category: "media",
  run: async ({ sock, msg, args }) => {
    const url = args[0];
    if (!url) return await sock.sendMessage(msg.key.remoteJid, { text: "Usage: !ytmp3 <youtube_url>" }, { quoted: msg });
    try {
      // check ffmpeg availability
      let ffmpegPath = null;
      try {
        ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
        ffmpeg.setFfmpegPath(ffmpegPath);
      } catch (e) {
        // maybe ffmpeg is installed system-wide
      }
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title.replace(/[<>:"/\\|?*\x00]/g, "").slice(0,60);
      const out = path.join(process.cwd(), `${title}.mp3`);
      const stream = ytdl(url, { quality: "highestaudio" });
      await new Promise((resolve, reject) => {
        const proc = ffmpeg(stream)
          .audioBitrate(128)
          .save(out)
          .on("end", resolve)
          .on("error", reject);
      });
      await sock.sendMessage(msg.key.remoteJid, { audio: fs.readFileSync(out), mimetype: "audio/mpeg", fileName: `${title}.mp3` }, { quoted: msg });
      fs.unlinkSync(out);
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Error: ${e.message}. Ensure ffmpeg is installed.` }, { quoted: msg });
    }
  }
};
