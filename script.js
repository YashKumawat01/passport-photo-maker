const upload = document.getElementById("upload");
const passportPreview = document.getElementById("passportPreview");
const previewCanvas = document.getElementById("preview");

const pCtx = passportPreview.getContext("2d");
const previewCtx = previewCanvas.getContext("2d");

const zoomInput = document.getElementById("zoom");
const offsetXInput = document.getElementById("offsetX");
const offsetYInput = document.getElementById("offsetY");
const bgColorInput = document.getElementById("bgColor");

const downloadLink = document.getElementById("download");

const img = new Image();
let imageLoaded = false;

// ================= CONSTANTS =================
const DPI = 300;
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;

// Inner image (passport)
const INNER_W = 1.3 * DPI;
const INNER_H = 1.7 * DPI;

// Outer box
const OUTER_W = 1.5 * DPI;
const OUTER_H = 1.9 * DPI;

// Padding
const PAD_X = (OUTER_W - INNER_W) / 2;
const PAD_Y = (OUTER_H - INNER_H) / 2;

// Border (0.5mm)
const BORDER_PX = (0.5 / 25.4) * DPI;

// ================= IMAGE LOAD =================
upload.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  img.src = URL.createObjectURL(file);
  img.onload = () => {
    imageLoaded = true;
    passportPreview.width = INNER_W;
    passportPreview.height = INNER_H;
    drawPassportPreview();
  };
});

// ================= SHARED DRAW FUNCTION =================
function drawImageManual(ctx, img, boxW, boxH, zoom, offsetX, offsetY) {
  const imgW = img.width * zoom;
  const imgH = img.height * zoom;

  const x = (boxW - imgW) / 2 + offsetX;
  const y = (boxH - imgH) / 2 + offsetY;

  ctx.drawImage(img, x, y, imgW, imgH);
}

// ================= PASSPORT PREVIEW =================
function drawPassportPreview() {
  if (!imageLoaded) return;

  const bgColor = bgColorInput.value;
  const zoom = Number(zoomInput.value);
  const offsetX = Number(offsetXInput.value);
  const offsetY = Number(offsetYInput.value);

  pCtx.clearRect(0, 0, INNER_W, INNER_H);

  // Background
  pCtx.fillStyle = bgColor;
  pCtx.fillRect(0, 0, INNER_W, INNER_H);

  // Image
  drawImageManual(
    pCtx,
    img,
    INNER_W,
    INNER_H,
    zoom,
    offsetX,
    offsetY
  );

  // Border
  pCtx.strokeStyle = "#000";
  pCtx.lineWidth = 2;
  pCtx.strokeRect(0, 0, INNER_W, INNER_H);
}

// ================= LIVE CONTROLS =================
[zoomInput, offsetXInput, offsetYInput, bgColorInput]
  .forEach(el => el.addEventListener("input", drawPassportPreview));

// ================= A4 GENERATION =================
document.getElementById("generateBtn").addEventListener("click", () => {
  if (!imageLoaded) {
    alert("Upload image first");
    return;
  }

  const rows = Number(document.getElementById("rows").value);
  const cols = Number(document.getElementById("cols").value);
  const bgColor = bgColorInput.value;

  const zoom = Number(zoomInput.value);
  const offsetX = Number(offsetXInput.value);
  const offsetY = Number(offsetYInput.value);

  const a4Canvas = document.createElement("canvas");
  const ctx = a4Canvas.getContext("2d");

  a4Canvas.width = A4_WIDTH;
  a4Canvas.height = A4_HEIGHT;

  // Paper
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

  const gridW = cols * OUTER_W;
  const startX = (A4_WIDTH - gridW) / 2;
  const startY = 100;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {

      const x = startX + c * OUTER_W;
      const y = startY + r * OUTER_H;

      // Outer box
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y, OUTER_W, OUTER_H);

      ctx.lineWidth = BORDER_PX;
      ctx.strokeStyle = "#000";
      ctx.strokeRect(
        x + BORDER_PX / 2,
        y + BORDER_PX / 2,
        OUTER_W - BORDER_PX,
        OUTER_H - BORDER_PX
      );

      // Inner background
      ctx.fillStyle = bgColor;
      ctx.fillRect(
        x + PAD_X,
        y + PAD_Y,
        INNER_W,
        INNER_H
      );

      // Image (CLIPPED TO INNER BOX)
ctx.save();
ctx.translate(x + PAD_X, y + PAD_Y);

// CLIP to passport photo area
ctx.beginPath();
ctx.rect(0, 0, INNER_W, INNER_H);
ctx.clip();

// Draw image using SAME math as preview
drawImageManual(
  ctx,
  img,
  INNER_W,
  INNER_H,
  zoom,
  offsetX,
  offsetY
);

ctx.restore();

// INNER IMAGE BORDER (VERY THIN)
ctx.lineWidth = 1; // thin, print-safe
ctx.strokeStyle = "#000000";
ctx.strokeRect(
  x + PAD_X,
  y + PAD_Y,
  INNER_W,
  INNER_H
);


    }
  }

  // Preview
  previewCanvas.width = A4_WIDTH / 4;
  previewCanvas.height = A4_HEIGHT / 4;

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(a4Canvas, 0, 0, previewCanvas.width, previewCanvas.height);

  downloadLink.href = a4Canvas.toDataURL("image/png");
});

// ================= PDF EXPORT =================
document.getElementById("exportPdfBtn").addEventListener("click", () => {
  if (!downloadLink.href) {
    alert("Generate A4 sheet first");
    return;
  }

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  pdf.addImage(downloadLink.href, "PNG", 0, 0, 210, 297);
  pdf.save("passport_a4.pdf");
});
