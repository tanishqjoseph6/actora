/**
 * Generates app-only favicon assets from scripts/favicon-source.svg.
 * Does not modify public/icon.png (full brand logo).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = path.join(root, "scripts/favicon-source.svg");
const svg = fs.readFileSync(svgPath);

const appIcon = path.join(root, "app/icon.png");
const appApple = path.join(root, "app/apple-icon.png");
const appFavicon = path.join(root, "app/favicon.ico");

const png1024 = await sharp(svg).resize(1024, 1024).png().toBuffer();
fs.writeFileSync(appIcon, png1024);
fs.writeFileSync(appApple, png1024);

const icoSizes = [16, 32, 48];
const icoBuffers = await Promise.all(
  icoSizes.map((size) => sharp(svg).resize(size, size).png().toBuffer())
);

const ico = await toIco(icoBuffers);
fs.writeFileSync(appFavicon, ico);

console.log("Wrote app/icon.png, app/apple-icon.png, app/favicon.ico");
