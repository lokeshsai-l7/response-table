// utils/downloadExcel.js
// Install: npm install xlsx-js-style
// Usage:   import { downloadROExcel } from './utils/downloadExcel';
//
// <button onClick={() => downloadROExcel(leftTitles, roData, totalCount, reportMonth, reportName)}>
//   Download Excel
// </button>

import XLSX from "xlsx-js-style";

/*──────────────────────────────────────────────────────────────────────────────
  LAYOUT:

  Col A                  │ B … D  (RO Bengaluru block)         │ E … G  (RO Chennai block)
  ──────────────────────────────────────────────────────────────────────────────
  Row 0  │ reportName    │ RO Bengaluru (merged B–D)           │ RO Chennai (merged E–G)
  Row 1  │ (merged       │ March 2026   (merged B–D)           │ March 2026 (merged E–G)
  Row 2  │  rows 0–2)    │ Kerala │ Karnataka │ Total          │ Tamil Nadu │ … │ Total
  ──────────────────────────────────────────────────────────────────────────────
  Row 3  │ ── Enrollment Kits (title, merged full width) ──────────────────────
  Row 4  │ header1       │  321   │  121      │  141           │  …
  Row 5  │ header2       │  141   │  121      │  521           │  …
  Row 6  │ ── Total Enrollment (title, merged full width) ─────────────────────
  Row 7  │ header3       │  …
──────────────────────────────────────────────────────────────────────────────*/

// ── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  reportName: { bg: "1F4E79", font: "FFFFFF" }, // darkest navy / white
  roHeader: { bg: "2E75B6", font: "FFFFFF" }, // navy-blue    / white
  monthRow: { bg: "4A90C4", font: "FFFFFF" }, // mid-blue     / white
  stateHeader: { bg: "5BA3D9", font: "FFFFFF" }, // lighter blue / white
  totalHeader: { bg: "1F4E79", font: "FFFFFF" }, // dark navy    / white
  titleRow: { bg: "D6E4F0", font: "1F4E79" }, // pale blue    / navy
  rowEven: { bg: "FFFFFF", font: "333333" },
  rowOdd: { bg: "EBF3FB", font: "333333" },
  numEven: { bg: "FFFFFF", font: "1F4E79" },
  numOdd: { bg: "EBF3FB", font: "1F4E79" },
  totalNum: { bg: "D6E4F0", font: "1F4E79" },
};

const BORDER = {
  top: { style: "thin", color: { rgb: "B8CCE4" } },
  bottom: { style: "thin", color: { rgb: "B8CCE4" } },
  left: { style: "thin", color: { rgb: "B8CCE4" } },
  right: { style: "thin", color: { rgb: "B8CCE4" } },
};

function style(bgHex, fontHex, bold = false, center = false, sz = 10) {
  return {
    fill: { fgColor: { rgb: bgHex } },
    font: { color: { rgb: fontHex }, bold, name: "Arial", sz },
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
  ws[addr] = {
    v: value === "" ? "" : value,
    t: typeof value === "number" ? "n" : "s",
    s,
  };
}

// Fill every cell in a merged range with the same style (clean borders in xlsx-js-style)
function fillMerge(ws, r, cStart, cEnd, value, s) {
  for (let c = cStart; c <= cEnd; c++) {
    put(ws, r, c, c === cStart ? value : "", s);
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export function downloadROExcel(
  leftTitles, // [{ id, title, headers: string[] }]
  roData, // { roName: { stateName: [{ rowParameter, count }] } }
  totalCount, // { roName: { paramName: number } }
  reportMonth = "",
  reportName = "",
  fileName = "RO_Report.xlsx",
) {
  const wb = XLSX.utils.book_new();
  const ws = {};
  const merges = [];

  const roEntries = Object.entries(roData);

  // ── Build column map ──────────────────────────────────────────────────────
  // Col 0 = label; then per RO: state cols … + one Total col
  const roColStart = {};
  const roColEnd = {};
  let col = 1;

  roEntries.forEach(([roName, states]) => {
    roColStart[roName] = col;
    col += Object.keys(states).length;
    roColEnd[roName] = col; // Total column index
    col++;
  });

  const totalCols = col;

  // ── ROW 0 : reportName (col 0, merged rows 0-2) + RO name banners ─────────
  const rnStyle = style(C.reportName.bg, C.reportName.font, true, true, 12);
  const titleStyle = style(C.rowEven.bg, C.rowEven.font, true, true, 12);
  put(ws, 0, 0, reportName || "RO Report", rnStyle);
  put(ws, 1, 0, "Title & Paramters", titleStyle);
  put(ws, 2, 0, "", titleStyle);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 0 } });
  merges.push({ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } });

  roEntries.forEach(([roName, states]) => {
    const sc = roColStart[roName];
    const ec = roColEnd[roName];
    const len = ec - sc + 1;
    fillMerge(
      ws,
      0,
      sc,
      ec,
      roName,
      style(C.roHeader.bg, C.roHeader.font, true, true),
    );
    if (len > 1) merges.push({ s: { r: 0, c: sc }, e: { r: 0, c: ec } });
  });

  // ── ROW 1 : reportMonth per RO block ─────────────────────────────────────
  roEntries.forEach(([roName, states]) => {
    const sc = roColStart[roName];
    const ec = roColEnd[roName];
    const len = ec - sc + 1;
    fillMerge(
      ws,
      1,
      sc,
      ec,
      reportMonth,
      style(C.monthRow.bg, C.monthRow.font, false, true),
    );
    if (len > 1) merges.push({ s: { r: 1, c: sc }, e: { r: 1, c: ec } });
  });

  // ── ROW 2 : State headers + "Total" per RO ───────────────────────────────
  roEntries.forEach(([roName, states]) => {
    const sc = roColStart[roName];
    Object.keys(states).forEach((stateName, i) => {
      put(
        ws,
        2,
        sc + i,
        stateName,
        style(C.stateHeader.bg, C.stateHeader.font, true, true),
      );
    });
    put(
      ws,
      2,
      roColEnd[roName],
      "Total",
      style(C.totalHeader.bg, C.totalHeader.font, true, true),
    );
  });

  // ── ROWS 3+ : title groups & parameters ──────────────────────────────────
  let row = 3;

  leftTitles.forEach(({ title, headers }) => {
    // Title row — full-width merge
    fillMerge(
      ws,
      row,
      0,
      totalCols - 1,
      title,
      style(C.titleRow.bg, C.titleRow.font, true, false),
    );
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: totalCols - 1 } });
    row++;

    // Parameter rows
    headers.forEach((param, pIdx) => {
      const isOdd = pIdx % 2 === 1;
      const lblStyle = style(
        isOdd ? C.rowOdd.bg : C.rowEven.bg,
        isOdd ? C.rowOdd.font : C.rowEven.font,
      );
      const numStyle = style(
        isOdd ? C.numOdd.bg : C.numEven.bg,
        isOdd ? C.numOdd.font : C.numEven.font,
        false,
        true,
      );
      const totStyle = style(C.totalNum.bg, C.totalNum.font, true, true);

      put(ws, row, 0, param, lblStyle);

      roEntries.forEach(([roName, states]) => {
        const sc = roColStart[roName];

        Object.values(states).forEach((rows, si) => {
          const entry = rows.find((r) => r.rowParameter === param);
          put(ws, row, sc + si, entry ? entry.count : "", numStyle);
        });

        const total =
          totalCount &&
          totalCount[roName] &&
          totalCount[roName][param] !== undefined
            ? totalCount[roName][param]
            : "";
        put(ws, row, roColEnd[roName], total, totStyle);
      });

      row++;
    });
  });

  // ── Column widths & row heights ───────────────────────────────────────────
  ws["!cols"] = [{ wch: 28 }, ...Array(totalCols - 1).fill({ wch: 14 })];
  ws["!rows"] = [
    { hpt: 30 }, // row 0 — reportName / RO header
    { hpt: 18 }, // row 1 — month
    { hpt: 20 }, // row 2 — state headers
  ];
  ws["!merges"] = merges;
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: row - 1, c: totalCols - 1 },
  });

  XLSX.utils.book_append_sheet(wb, ws, "RO Report");
  XLSX.writeFile(wb, fileName);
}
