const upload = document.getElementById("upload");
const passportPreview = document.getElementById("passportPreview");
const previewCanvas = document.getElementById("preview");

const pCtx = passportPreview.getContext("2d");
const previewCtx = previewCanvas.getContext("2d");

const zoomInput = document.getElementById("zoom");
const offsetXInput = document.getElementById("offsetX");
const offsetYInput = document.getElementById("offsetY");

const rowsInput = document.getElementById("rows");
const colsInput = document.getElementById("cols");

const bgColorInput = document.getElementById("bgColor");

const downloadLink = document.getElementById("download");

const uploadBtn = document.getElementById("uploadBtn");
const addPersonBtn = document.getElementById("addPersonBtn");
const generateBtn = document.getElementById("generateBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");

let img = new Image();
let imageLoaded = false;

/* ================= CONSTANTS ================= */
const DPI = 300;
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;

const INNER_W = Math.round(1.3 * DPI);
const INNER_H = Math.round(1.7 * DPI);

const OUTER_W = Math.round(1.5 * DPI);
const OUTER_H = Math.round(1.9 * DPI);

const PAD_X = (OUTER_W - INNER_W) / 2;
const PAD_Y = (OUTER_H - INNER_H) / 2;

const BORDER_PX = 2;

/* ================= PERSON STORAGE ================= */
const persons = []; // multi-person data

/* ================= IMAGE LOAD ================= */
uploadBtn.addEventListener("click", () => upload.click());

upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  img = new Image();
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

  const zoom = Number(zoomInput.value);
  const offsetX = Number(offsetXInput.value);
  const offsetY = Number(offsetYInput.value);
  const bgColor = bgColorInput.value;

  pCtx.clearRect(0, 0, INNER_W, INNER_H);

  pCtx.fillStyle = bgColor;
  pCtx.fillRect(0, 0, INNER_W, INNER_H);

  const imgW = img.width * zoom;
  const imgH = img.height * zoom;

  const dx = (INNER_W - imgW) / 2 + offsetX;
  const dy = (INNER_H - imgH) / 2 + offsetY;

  pCtx.drawImage(img, dx, dy, imgW, imgH);

  pCtx.strokeStyle = "#000";
  pCtx.lineWidth = BORDER_PX;
  pCtx.strokeRect(0, 0, INNER_W, INNER_H);
}

/* ================= LIVE CONTROLS ================= */
[zoomInput, offsetXInput, offsetYInput, bgColorInput].forEach((el) =>
  el.addEventListener("input", drawPassportPreview),
);

/* ================= ADD PERSON ================= */
addPersonBtn.addEventListener("click", () => {
  if (!imageLoaded) {
    alert("Upload image first");
    return;
  }

  persons.push({
    img: img,
    zoom: Number(zoomInput.value),
    offsetX: Number(offsetXInput.value),
    offsetY: Number(offsetYInput.value),
    bgColor: bgColorInput.value,
    rows: Number(rowsInput.value),
    cols: Number(colsInput.value),
  });

  alert(`Person added (Total: ${persons.length})`);
});

/* ================= A4 GENERATION ================= */
generateBtn.addEventListener("click", () => {
  if (!imageLoaded && persons.length === 0) {
    alert("Upload image first");
    return;
  }

  const a4Canvas = document.createElement("canvas");
  const ctx = a4Canvas.getContext("2d");

  a4Canvas.width = A4_WIDTH;
  a4Canvas.height = A4_HEIGHT;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

  let startY = 120;

  // MODE 1 — MULTI PERSON
  if (persons.length > 0) {
    persons.forEach((p) => {
      const gridW = p.cols * OUTER_W + BORDER_PX;
      const startX = Math.round((A4_WIDTH - gridW) / 2);

      for (let r = 0; r < p.rows; r++) {
        for (let c = 0; c < p.cols; c++) {
          const x = startX + c * OUTER_W + BORDER_PX / 2;
          const y = startY + r * OUTER_H + BORDER_PX / 2;

          ctx.strokeStyle = "#000";
          ctx.lineWidth = BORDER_PX;
          ctx.strokeRect(x, y, OUTER_W, OUTER_H);

          ctx.fillStyle = p.bgColor;
          ctx.fillRect(x + PAD_X, y + PAD_Y, INNER_W, INNER_H);

          const imgW = p.img.width * p.zoom;
          const imgH = p.img.height * p.zoom;

          const sx = (INNER_W - imgW) / 2 + p.offsetX;
          const sy = (INNER_H - imgH) / 2 + p.offsetY;

          ctx.save();
          ctx.beginPath();
          ctx.rect(x + PAD_X, y + PAD_Y, INNER_W, INNER_H);
          ctx.clip();

          ctx.drawImage(
            p.img,
            x + PAD_X + sx,
            y + PAD_Y + sy,
            imgW,
            imgH,
          );

          ctx.restore();

          ctx.strokeRect(x + PAD_X, y + PAD_Y, INNER_W, INNER_H);
        }
      }

      startY += p.rows * OUTER_H + 40;
    });
  }

  // MODE 2 — SINGLE PERSON (ORIGINAL BEHAVIOR)
  else {
    const rows = Number(rowsInput.value);
    const cols = Number(colsInput.value);
    const bgColor = bgColorInput.value;

    const zoom = Number(zoomInput.value);
    const offsetX = Number(offsetXInput.value);
    const offsetY = Number(offsetYInput.value);

    const gridW = cols * OUTER_W + BORDER_PX;
    const startX = Math.round((A4_WIDTH - gridW) / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * OUTER_W + BORDER_PX / 2;
        const y = startY + r * OUTER_H + BORDER_PX / 2;

        ctx.strokeRect(x, y, OUTER_W, OUTER_H);

        ctx.fillStyle = bgColor;
        ctx.fillRect(x + PAD_X, y + PAD_Y, INNER_W, INNER_H);

        const imgW = img.width * zoom;
        const imgH = img.height * zoom;

        const sx = (INNER_W - imgW) / 2 + offsetX;
        const sy = (INNER_H - imgH) / 2 + offsetY;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x + PAD_X, y + PAD_Y, INNER_W, INNER_H);
        ctx.clip();

        ctx.drawImage(
          img,
          x + PAD_X + sx,
          y + PAD_Y + sy,
          imgW,
          imgH,
        );

        ctx.restore();

        ctx.strokeRect(x + PAD_X, y + PAD_Y, INNER_W, INNER_H);
      }
    }
  }

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
exportPdfBtn.addEventListener("click", () => {
  if (!downloadLink.href) {
    alert("Generate A4 sheet first");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("portrait", "mm", "a4");
  pdf.addImage(downloadLink.href, "PNG", 0, 0, 210, 297);
  pdf.save("passport_a4.pdf");
});
