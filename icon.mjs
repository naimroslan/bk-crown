// one-off: render crown.svg to icon-192/512.png
import sharp from "sharp";
for (const s of [192, 512]) {
  await sharp("public/crown.svg", { density: 300 })
    .resize(s, s)
    .png()
    .toFile(`public/icon-${s}.png`);
}
console.log("done");
