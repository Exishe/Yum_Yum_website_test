// Builds the round transparent logo and app icons from the 1080 px logo photo.
// Run once: node scripts/make-brand-assets.mjs
import sharp from "sharp";

const src = "public/images/source/logo/yum-yum-logo-1080.jpg";
const size = 1080;
const circle = Buffer.from(
  `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 6}" fill="#fff"/></svg>`,
);
const round = await sharp(src).resize(size, size).composite([{ input: circle, blend: "dest-in" }]).png().toBuffer();

await sharp(round).resize(240, 240).png({ compressionLevel: 9 }).toFile("public/images/brand/logo-240.png");
await sharp(round).resize(512, 512).png({ compressionLevel: 9 }).toFile("public/images/brand/logo-512.png");
// App icons: the round mark on brand magenta so it fills a square.
for (const [s, pad, name] of [
  [192, 0, "icon-192.png"],
  [512, 0, "icon-512.png"],
  [512, 56, "icon-maskable-512.png"],
  [180, 0, "apple-touch-icon.png"],
]) {
  const inner = await sharp(round).resize(s - pad * 2, s - pad * 2).png().toBuffer();
  await sharp({ create: { width: s, height: s, channels: 4, background: "#DE1281" } })
    .composite([{ input: inner, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toFile(`public/images/brand/${name}`);
}
await sharp(round).resize(48, 48).png().toFile("app/icon.png");
await sharp(round).resize(180, 180).flatten({ background: "#DE1281" }).png().toFile("app/apple-icon.png");
console.log("Brand assets written.");
