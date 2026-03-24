// utils/downloadExcel.js
// Install: npm install xlsx
// Usage:   import { downloadROExcel } from './utils/downloadExcel';
//
// In your component:
//   <button onClick={() => downloadROExcel(leftTitles, roData)}>Download Excel</button>

import * as XLSX from "xlsx";

/*──────────────────────────────────────────────────────────────────────────────
  LAYOUT (single sheet, ROs side by side):

  Col A              | B … D  (RO Bengaluru states)  | E … G  (RO Chennai states)
  ───────────────────────────────────────────────────────────────────────────────
                     | ←───── RO Bengaluru ─────→    | ←── RO Chennai ──→
  Title & Parameter  | Kerala  Karnataka  Lakshadweep | Tamil Nadu  Telangana …
  ── Title 1 ────────────────────────────────────────────────────────────────────
   parameter1        |  321      121         30        |   200        …
   parameter2        |  141       99         45        |   …
  ── Title 2 ────────────────────────────────────────────────────────────────────
   parameter3        |  200      210         60        |   …
   parameter4        |  180      175         65        |   …
──────────────────────────────────────────────────────────────────────────────*/

// ── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  roHeader: { bg: "1F4E79", font: "FFFFFF" }, // dark navy / white
  stateHeader: { bg: "2E75B6", font: "FFFFFF" }, // blue / white
  titleRow: { bg: "D6E4F0", font: "1F4E79" }, // light blue / navy
  rowEven: { bg: "FFFFFF", font: "000000" }, // white
  rowOdd: { bg: "EBF3FB", font: "000000" }, // very light blue
  numEven: { bg: "FFFFFF", font: "1F4E79" }, // white / blue number
  numOdd: { bg: "EBF3FB", font: "1F4E79" }, // stripe / blue number
};

const BORDER = {
  top: { style: "thin", color: { rgb: "B8CCE4" } },
  bottom: { style: "thin", color: { rgb: "B8CCE4" } },
  left: { style: "thin", color: { rgb: "B8CCE4" } },
  right: { style: "thin", color: { rgb: "B8CCE4" } },
};

function style(bgHex, fontHex, bold = false, center = false) {
  return {
    fill: { fgColor: { rgb: bgHex } },
    font: { color: { rgb: fontHex }, bold, name: "Arial", sz: 10 },
    alignment: {
      horizontal: center ? "center" : "left",
      vertical: "center",
      wrapText: true,
    },
    border: BORDER,
  };
}

function put(ws, r, c, value, s) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const t = typeof value === "number" ? "n" : "s";
  ws[addr] = { v: value === "" ? "" : value, t, s };
}

// ── Main export ──────────────────────────────────────────────────────────────
export function downloadROExcel(
  leftTitles,
  roData,
  fileName = "RO_Report.xlsx",
) {
  const wb = XLSX.utils.book_new();
  const ws = {};
  const merges = [];

  const roEntries = Object.entries(roData);

  // Build column positions: col 0 = label, then states per RO
  const roColStart = {};
  let col = 1;
  roEntries.forEach(([roName, states]) => {
    roColStart[roName] = col;
    col += Object.keys(states).length;
  });
  const totalCols = col;

  // ── Row 0: "Title & Parameter" header + RO name banners ──────────────────
  // Col 0 spans rows 0 & 1
  put(
    ws,
    0,
    0,
    "Title & Parameter",
    style(C.roHeader.bg, C.roHeader.font, true, true),
  );
  merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });

  roEntries.forEach(([roName, states]) => {
    const sc = roColStart[roName];
    const len = Object.keys(states).length;
    put(ws, 0, sc, roName, style(C.roHeader.bg, C.roHeader.font, true, true));
    for (let ci = sc + 1; ci < sc + len; ci++) {
      put(ws, 0, ci, "", style(C.roHeader.bg, C.roHeader.font, true, true));
    }
    if (len > 1)
      merges.push({ s: { r: 0, c: sc }, e: { r: 0, c: sc + len - 1 } });
  });

  // ── Row 1: State name headers ─────────────────────────────────────────────
  roEntries.forEach(([roName, states]) => {
    const sc = roColStart[roName];
    Object.keys(states).forEach((stateName, i) => {
      put(
        ws,
        1,
        sc + i,
        stateName,
        style(C.stateHeader.bg, C.stateHeader.font, true, true),
      );
    });
  });

  // ── Rows 2+: title groups & parameters ────────────────────────────────────
  let row = 2;

  leftTitles.forEach(({ title, headers }) => {
    // Title row — merged across all cols
    put(ws, row, 0, title, style(C.titleRow.bg, C.titleRow.font, true, false));
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: totalCols - 1 } });
    for (let ci = 1; ci < totalCols; ci++) {
      put(ws, row, ci, "", style(C.titleRow.bg, C.titleRow.font, true, false));
    }
    row++;

    // Parameter rows
    headers.forEach((param, pIdx) => {
      const isOdd = pIdx % 2 === 1;
      const lblStyle = style(
        isOdd ? C.rowOdd.bg : C.rowEven.bg,
        isOdd ? C.rowOdd.font : C.rowEven.font,
        false,
        false,
      );
      const numStyle = style(
        isOdd ? C.numOdd.bg : C.numEven.bg,
        isOdd ? C.numOdd.font : C.numEven.font,
        false,
        true,
      );

      put(ws, row, 0, param, lblStyle);

      roEntries.forEach(([roName, states]) => {
        const sc = roColStart[roName];
        Object.values(states).forEach((rows, si) => {
          const entry = rows.find((r) => r.rowParameter === param);
          put(ws, row, sc + si, entry ? entry.count : "", numStyle);
        });
      });
      row++;
    });
  });

  // ── Column widths & row heights ───────────────────────────────────────────
  ws["!cols"] = [{ wch: 26 }, ...Array(totalCols - 1).fill({ wch: 14 })];
  ws["!rows"] = [{ hpt: 24 }, { hpt: 20 }];
  ws["!merges"] = merges;
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: row - 1, c: totalCols - 1 },
  });

  XLSX.utils.book_append_sheet(wb, ws, "RO Report");
  XLSX.writeFile(wb, fileName);
}
