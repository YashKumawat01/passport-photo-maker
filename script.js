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

// CONSTANTS
const DPI = 300;
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;

// GAP SETTING (ONLY ADDITION)
const GAP_CM = 0.5; // 5mm gap between photos

function cmToPx(cm) {
  return Math.round(cm * 118.11);
}

// IMAGE LOAD
upload.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  img.src = URL.createObjectURL(file);
  img.onload = () => {
    imageLoaded = true;
    updatePassportCanvasSize();
    drawPassportPreview();
  };
});

// UPDATE PASSPORT SIZE
function updatePassportCanvasSize() {
  const wCm = Number(document.getElementById("widthCm").value);
  const hCm = Number(document.getElementById("heightCm").value);

  passportPreview.width = cmToPx(wCm);
  passportPreview.height = cmToPx(hCm);
}

// MANUAL CROP / DRAW
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

  // Image transform
  const imgW = img.width * zoom;
  const imgH = img.height * zoom;

  const x = (w - imgW) / 2 + offsetX;
  const y = (h - imgH) / 2 + offsetY;

  pCtx.drawImage(img, x, y, imgW, imgH);

  // Border (preview only)
  pCtx.strokeStyle = "#000";
  pCtx.lineWidth = 2;
  pCtx.strokeRect(0, 0, w, h);
}

// LIVE CONTROLS
[zoomInput, offsetXInput, offsetYInput].forEach(i =>
  i.addEventListener("input", drawPassportPreview)
);

document.getElementById("bgColor").addEventListener("input", drawPassportPreview);
document.getElementById("widthCm").addEventListener("change", () => {
  updatePassportCanvasSize();
  drawPassportPreview();
});
document.getElementById("heightCm").addEventListener("change", () => {
  updatePassportCanvasSize();
  drawPassportPreview();
});

// GENERATE A4 SHEET
document.getElementById("generateBtn").addEventListener("click", () => {
  if (!imageLoaded) {
    alert("Upload image first");
    return;
  }

  const rows = Number(document.getElementById("rows").value);
  const cols = Number(document.getElementById("cols").value);

  const photoW = passportPreview.width;
  const photoH = passportPreview.height;

  const gap = cmToPx(GAP_CM);

  const a4Canvas = document.createElement("canvas");
  const a4Ctx = a4Canvas.getContext("2d");

  a4Canvas.width = A4_WIDTH;
  a4Canvas.height = A4_HEIGHT;

  // Paper background
  a4Ctx.fillStyle = "#ffffff";
  a4Ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

  // GRID SIZE (FIXED)
  const gridW = cols * photoW + (cols - 1) * gap;
  const gridH = rows * photoH + (rows - 1) * gap;

  const startX = (A4_WIDTH - gridW) / 2;
  const startY = 100;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {

      const dx = startX + c * (photoW + gap);
      const dy = startY + r * (photoH + gap);

      a4Ctx.drawImage(passportPreview, dx, dy, photoW, photoH);

      // FINAL BORDER
      a4Ctx.strokeStyle = "#000";
      a4Ctx.lineWidth = 3;
      a4Ctx.strokeRect(dx, dy, photoW, photoH);
    }
  }

  // A4 Preview (scaled)
  previewCanvas.width = A4_WIDTH / 4;
  previewCanvas.height = A4_HEIGHT / 4;

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(
    a4Canvas,
    0,
    0,
    previewCanvas.width,
    previewCanvas.height
  );

  downloadLink.href = a4Canvas.toDataURL("image/png");
});

document.getElementById("exportPdfBtn").addEventListener("click", () => {
  if (!downloadLink.href) {
    alert("Generate A4 sheet first");
    return;
  }

  const { jsPDF } = window.jspdf;

  // A4 size in mm
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Convert canvas to image
  const imgData = downloadLink.href;

  // A4 dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = 297;

  pdf.addImage(
    imgData,
    "PNG",
    0,
    0,
    pdfWidth,
    pdfHeight,
    undefined,
    "FAST"
  );

  pdf.save("passport_a4.pdf");
});


