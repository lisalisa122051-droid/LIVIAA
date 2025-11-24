// lib/media.js (CommonJS)
const sharp = require("sharp");

module.exports = {
  imageToWebpBuffer: async (inputBuffer) => {
    return await sharp(inputBuffer)
      .resize(512, 512, { fit: "inside" })
      .webp({ quality: 80 })
      .toBuffer();
  },

  webpToPngBuffer: async (inputBuffer) => {
    return await sharp(inputBuffer)
      .png()
      .toBuffer();
  }
};
