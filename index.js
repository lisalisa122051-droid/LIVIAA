// index.js (ESM)
import { makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import P from "pino";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import config from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// paths
const SESSION_DIR = path.join(__dirname, "session");
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
const AUTH_FILE = path.join(SESSION_DIR, "auth_info.json");

// useSingleFileAuthState saves credentials
const { state, saveState } = useSingleFileAuthState(AUTH_FILE);

// simple logger (pino) with low verbosity to avoid spam logs (good for pterodactyl)
const logger = P({ level: process.env.LOG_LEVEL || "warn" });

// command loader (commands are CommonJS modules with module.exports)
const commands = new Map();
const commandsDir = path.join(__dirname, "commands");
if (fs.existsSync(commandsDir)) {
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));
  for (const f of files) {
    try {
      const cmd = require(path.join(commandsDir, f));
      if (cmd && cmd.name) commands.set(cmd.name, cmd);
    } catch (e) {
      console.error("Failed loading command", f, e);
    }
  }
}

// pairing code cache (for HTTP endpoint)
let currentPairing = { code: null, ref: null, expires: null };

// wrapper to create socket and handle reconnect
async function startSock() {
  // try to find latest baileys version (optional)
  let version = undefined;
  try {
    const v = await fetchLatestBaileysVersion();
    version = v.version;
  } catch (e) {
    // ignore
  }

  const sock = makeWASocket({
    logger,
    printQRInTerminal: false, // we use pairing code output, not QR
    auth: state,
    version, // may be undefined
    getMessage: async key => {
      // optional: implement message retrieval for receipts
      return { conversation: "..." };
    }
  });

  // save state on changes
  sock.ev.on("creds.update", saveState);

  // connection handling with pairing code support
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr, pairing } = update;
    if (pairing) {
      // pairing.code is an array of strings usually; combine to a single string
      const code = Array.isArray(pairing.code) ? pairing.code.join("") : pairing.code;
      console.log("=== PAIRING CODE ===");
      console.log(code);
      console.log("Open WhatsApp -> Linked devices -> Link a device -> Enter pairing code above");
      currentPairing = { code, ref: pairing.ref || null, expires: pairing.expiresAt || null };
      // we intentionally do not spam logs
    } else if (connection === "open") {
      console.log("Connected ✓");
      currentPairing = { code: null, ref: null, expires: null };
    }

    if (connection === "close") {
      const reason = (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output) ? lastDisconnect.error.output.statusCode : null;
      console.log("Connection closed:", reason || lastDisconnect?.error || "unknown");
      // bail out: let reconnect logic outside handle restart
    }
  });

  // simple message handler
  sock.ev.on('messages.upsert', async m => {
    try {
      const messages = m.messages || [];
      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        const from = msg.key.remoteJid;
        const content = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        if (!content) continue;
        if (!content.startsWith(config.prefix)) continue;
        const withoutPrefix = content.slice(config.prefix.length).trim();
        const [cmdName, ...rest] = withoutPrefix.split(/\s+/);
        const args = rest;
        // find command by name or alias
        let cmd = [...commands.values()].find(c => c.name === cmdName || (c.alias && c.alias.includes(cmdName)));
        if (!cmd) {
          await sock.sendMessage(from, { text: `Command not found: ${cmdName}` }, { quoted: msg });
          continue;
        }
        try {
          await cmd.run({ sock, msg, args, config, utils: require("./lib/utils.js"), media: require("./lib/media.js") });
        } catch (err) {
          console.error("Command Error:", err);
          await sock.sendMessage(from, { text: `Error in command ${cmd.name}: ${err.message || err}` }, { quoted: msg });
        }
      }
    } catch (e) {
      console.error("messages.upsert error:", e);
    }
  });

  return sock;
}

// reconnect loop with exponential backoff (clean logs)
let sockInstance = null;
let attempt = 0;
async function run() {
  while (true) {
    try {
      sockInstance = await startSock();
      attempt = 0;
      // keep process alive until disconnect
      await new Promise((resolve, reject) => {
        sockInstance.ev.on("connection.update", update => {
          if (update.connection === "close") {
            resolve();
          }
        });
      });
    } catch (e) {
      console.error("Socket failed:", e?.message || e);
    }
    // exponential backoff, cap at 2 minutes
    attempt++;
    const waitMs = Math.min(120000, 1000 * Math.pow(2, Math.min(attempt, 8)));
    console.log(`Reconnecting in ${waitMs/1000}s...`);
    // wait without spamming
    await new Promise(r => setTimeout(r, waitMs));
  }
}

// small http server to show pairing code (helpful in Pterodactyl web console)
const app = express();
app.get("/", (req, res) => res.send(`<h3>${config.botName}</h3><p>Prefix: ${config.prefix}</p><p>Owner: ${config.owner || "not set"}</p>`));
app.get("/pairing", (req, res) => {
  if (!currentPairing.code) return res.send("No active pairing code.");
  res.send(`<h3>Pairing Code</h3><pre style="font-size:2rem">${currentPairing.code}</pre><p>Expires: ${currentPairing.expires || "unknown"}</p>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HTTP server running on port ${PORT}`));

// start
run().catch(console.error);
