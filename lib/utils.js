// lib/utils.js (CommonJS)
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  fetchBuffer: async (url) => {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(res.data);
  },

  saveFile: async (buffer, filename) => {
    const filePath = path.join(process.cwd(), filename);
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  }
};
