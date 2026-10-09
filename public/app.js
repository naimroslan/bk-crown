// BK Crown Cam - PWA, no build step.
// ponytail: face placement uses native FaceDetector when present, else
// crown at fixed spot the user can drag. Upgrade path: bundle a tiny face model.
const video = document.getElementById("video");
const shot = document.getElementById("shot");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");
const camBtn = document.getElementById("cam");
const snapBtn = document.getElementById("snap");
const saveBtn = document.getElementById("save");
const againBtn = document.getElementById("again");

let stream = null;
let base = null; // ImageBitmap of the clean photo
let crown = null; // ImageBitmap of crown.svg
let crowns = []; // one per face: {x, y, w}

const crownW = 0.35; // crown width as fraction of face width

async function loadBitmap(src) {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
  return img;
}

async function makeDetector() {
  if ("FaceDetector" in window) {
    try { return await new window.FaceDetector({ fastMode: true }); } catch {}
  }
  return null;
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 } },
      audio: false,
    });
  } catch (e) {
    alert("Camera unavailable: " + e.message);
    return;
  }
  video.srcObject = stream;
  video.hidden = false;
  camBtn.hidden = true;
  snapBtn.hidden = false;
}

async function snap() {
  const w = video.videoWidth, h = video.videoHeight;
  if (!w) return;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.translate(w, 0); g.scale(-1, 1); // mirror to match preview
  g.drawImage(video, 0, 0);
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
  base = await window.createImageBitmap(c);
  video.hidden = true; snapBtn.hidden = true;
  againBtn.hidden = false; saveBtn.hidden = false;
  await place();
}

async function place() {
  crowns = [];
  // Faces are relative to the DISPLAYED canvas, so detect first on native size.
  const det = await makeDetector();
  if (det) {
    try {
      const found = await det.detect(base);
      // ponytail: boundingBox is on the unmirrored capture while we mirrored it;
      // mirror x back so the crown lands where the user saw the face.
      crowns = found.map((f) => {
        const b = f.boundingBox;
        return { x: base.width - (b.x + b.width / 2), y: b.y, w: b.width };
      });
    } catch {}
  }
  if (crowns.length === 0) {
    crowns = [{ x: base.width / 2, y: base.height * 0.25, w: base.width * 0.35 }];
  }
  render();
}

function render() {
  canvas.width = base.width; canvas.height = base.height;
  ctx.drawImage(base, 0, 0);
  for (const f of crowns) {
    const cw = f.w * crownW * 3; // crown a bit wider than detected face box
    const ch = cw * (crown.height / crown.width);
    ctx.drawImage(crown, f.x - cw / 2, f.y - ch * 0.7, cw, ch);
  }
  canvas.hidden = false; shot.hidden = true;
  saveBtn.disabled = false;
}

// Tap = drag the nearest crown to that point. Adjust size with wheel/pinch.
canvas.addEventListener("click", (e) => {
  if (!crowns.length) return;
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (canvas.width / r.width);
  const y = (e.clientY - r.top) * (canvas.height / r.height);
  let best = 0, bestD = Infinity;
  crowns.forEach((f, i) => {
    const d = Math.hypot(f.x - x, f.y - y);
    if (d < bestD) { bestD = d; best = i; }
  });
  crowns[best].x = x;
  crowns[best].y = y + crowns[best].w * crownW * 3 * 0.7 * 0.4; // keep crown above tap point
  render();
});

saveBtn.addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = "bk-crown-" + Date.now() + ".png";
  a.href = canvas.toDataURL("image/png");
  a.click();
});

againBtn.addEventListener("click", () => {
  base = null; canvas.hidden = true; shot.hidden = true;
  againBtn.hidden = true; saveBtn.hidden = true;
  startCamera();
});

camBtn.addEventListener("click", startCamera);
snapBtn.addEventListener("click", snap);

video.hidden = false; // show live feed element for layout
crown = await loadBitmap("crown.svg");
