#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { Jimp } from "jimp";

const __dirname = path.resolve();
const iconsDir = path.resolve(__dirname, "public", "icons");

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function generateIconFromSource({ source, size, output }) {
  try {
    const img = await Jimp.read(source);
    img.resize({ w: size, h: size });
    await img.write(output);
    console.log(
      `Generated ${path.basename(output)} from ${path.basename(source)}`,
    );
  } catch (err) {
    console.error(`Failed to generate ${path.basename(output)}:`, err);
  }
}

async function run() {
  await ensureDir(iconsDir);

  const sourceApp = path.join(iconsDir, "source-app.png");
  const sourceLobbies = path.join(iconsDir, "source-lobbies.png");
  const sourceHistory = path.join(iconsDir, "source-history.png");

  // Verify sources exist
  if (!fs.existsSync(sourceApp))
    throw new Error(`Missing source-app.png at ${sourceApp}`);
  // Shortcuts might be optional, but we generated them so we expect them.

  const tasks = [
    // Main App Icons
    generateIconFromSource({
      source: sourceApp,
      size: 192,
      output: path.join(iconsDir, "icon-192.png"),
    }),
    generateIconFromSource({
      source: sourceApp,
      size: 512,
      output: path.join(iconsDir, "icon-512.png"),
    }),

    // Maskable Icon (Safe zone centered) - reusing app icon for now as the source is already designed to be safe
    // Ideally we'd have a specific maskable source, but resizing the app icon is a good start
    generateIconFromSource({
      source: sourceApp,
      size: 512,
      output: path.join(iconsDir, "icon-maskable-512.png"),
    }),

    // Shortcuts
    generateIconFromSource({
      source: sourceLobbies,
      size: 96,
      output: path.join(iconsDir, "shortcut-lobbies-96.png"),
    }),
    generateIconFromSource({
      source: sourceHistory,
      size: 96,
      output: path.join(iconsDir, "shortcut-history-96.png"),
    }),
  ];

  await Promise.all(tasks);
}

run().catch((err) => {
  console.error("[generate-pwa-icons] Failed:", err);
  process.exit(1);
});
