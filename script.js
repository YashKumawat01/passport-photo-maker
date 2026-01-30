const upload = document.getElementById("upload");
const passportPreview = document.getElementById("passportPreview");
const previewCanvas = document.getElementById("preview");

const pCtx = passportPreview.getContext("2d");
const previewCtx = previewCanvas.getContext("2d");

const zoomInput = document.getElementById("zoom");
const offsetXInput = document.getElementById("offsetX");
const offsetYInput = document.getElementById("offsetY");

const downloadLink = document.getElementById("download");

const img = new Image();
let imageLoaded = false;

/* ================= CONSTANTS ================= */
const DPI = 300;
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;

// Inner passport photo (1.3 x 1.7 inch)
const INNER_W = Math.round(1.3 * DPI);
const INNER_H = Math.round(1.7 * DPI);

// Outer box (1.5 x 1.9 inch)
const OUTER_W = Math.round(1.5 * DPI);
const OUTER_H = Math.round(1.9 * DPI);

// Padding between inner & outer
const PAD_X = (OUTER_W - INNER_W) / 2;
const PAD_Y = (OUTER_H - INNER_H) / 2;

// SAME thin border for inner & outer
const BORDER_PX = 2;

/* ================= IMAGE LOAD ================= */
upload.addEventListener("change", (e) => {
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

/* ================= PREVIEW DRAW ================= */
function drawPassportPreview() {
  if (!imageLoaded) return;

  const bgColor = document.getElementById("bgColor").value;
  const zoom = Number(zoomInput.value);
  const offsetX = Number(offsetXInput.value);
  const offsetY = Number(offsetYInput.value);

  const w = passportPreview.width;
  const h = passportPreview.height;

  pCtx.clearRect(0, 0, w, h);

  // Background
  pCtx.fillStyle = bgColor;
  pCtx.fillRect(0, 0, w, h);

  // Image positioning (same logic as A4)
  const imgW = img.width * zoom;
  const imgH = img.height * zoom;

  const dx = (w - imgW) / 2 + offsetX;
  const dy = (h - imgH) / 2 + offsetY;

  pCtx.drawImage(img, dx, dy, imgW, imgH);

  // Inner border (preview)
  pCtx.strokeStyle = "#000";
  pCtx.lineWidth = BORDER_PX;
  pCtx.strokeRect(0, 0, w, h);
}

/* ================= LIVE CONTROLS ================= */
[zoomInput, offsetXInput, offsetYInput].forEach((el) =>
  el.addEventListener("input", drawPassportPreview),
);

document
  .getElementById("bgColor")
  .addEventListener("input", drawPassportPreview);

/* ================= A4 GENERATION ================= */
document.getElementById("generateBtn").addEventListener("click", () => {
  if (!imageLoaded) {
    alert("Upload image first");
    return;
  }

  const rows = Number(document.getElementById("rows").value);
  const cols = Number(document.getElementById("cols").value);
  const bgColor = document.getElementById("bgColor").value;

  const zoom = Number(zoomInput.value);
  const offsetX = Number(offsetXInput.value);
  const offsetY = Number(offsetYInput.value);

  const a4Canvas = document.createElement("canvas");
  const ctx = a4Canvas.getContext("2d");

  a4Canvas.width = A4_WIDTH;
  a4Canvas.height = A4_HEIGHT;

  // White paper
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

  // GRID (NO GAP, NO BORDER LOSS)
  const gridW = cols * OUTER_W + BORDER_PX;
  const gridH = rows * OUTER_H + BORDER_PX;

  const startX = Math.round((A4_WIDTH - gridW) / 2);
  const startY = 120;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * OUTER_W + BORDER_PX / 2;
      const y = startY + r * OUTER_H + BORDER_PX / 2;

      /* ===== OUTER BOX ===== */
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y, OUTER_W, OUTER_H);

      ctx.strokeStyle = "#000";
      ctx.lineWidth = BORDER_PX;
      ctx.strokeRect(x, y, OUTER_W, OUTER_H);

      /* ===== INNER BACKGROUND ===== */
      ctx.fillStyle = bgColor;
      ctx.fillRect(x + PAD_X, y + PAD_Y, INNER_W, INNER_H);

      /* ===== IMAGE DRAW (CORRECT FIT) ===== */
      const imgW = img.width * zoom;
      const imgH = img.height * zoom;

      const sx = (INNER_W - imgW) / 2 + offsetX;
      const sy = (INNER_H - imgH) / 2 + offsetY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x + PAD_X, y + PAD_Y, INNER_W, INNER_H);
      ctx.clip();

      ctx.drawImage(img, x + PAD_X + sx, y + PAD_Y + sy, imgW, imgH);

      ctx.restore();

      /* ===== INNER BORDER ===== */
      ctx.strokeStyle = "#000";
      ctx.lineWidth = BORDER_PX;
      ctx.strokeRect(x + PAD_X, y + PAD_Y, INNER_W, INNER_H);
    }
  }

  /* ===== PREVIEW ===== */
  previewCanvas.width = A4_WIDTH / 4;
  previewCanvas.height = A4_HEIGHT / 4;

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(
    a4Canvas,
    0,
    0,
    previewCanvas.width,
    previewCanvas.height,
  );

  downloadLink.href = a4Canvas.toDataURL("image/png");
});

/* ================= PDF EXPORT ================= */
document.getElementById("exportPdfBtn").addEventListener("click", () => {
  if (!downloadLink.href) {
    alert("Generate A4 sheet first");
    return;
  }

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  pdf.addImage(downloadLink.href, "PNG", 0, 0, 210, 297, undefined, "FAST");

  pdf.save("passport_a4.pdf");
});


document.getElementById("uploadBtn").addEventListener("click", () => {
  upload.click();
});
