import React, { useMemo, useRef } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

export function sanitizeKey(str) {
  return String(str).replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Parse raw API titles into:
 *  - leftTitles  : titles with excelTitleType === "LEFT"
 *  - topColumns  : headers from titles with excelTitleType === "TOP"
 *                  + always appends a "Remarks" column
 *  - rowHeaders  : flat list of all LEFT header names (row labels)
 *  - sections    : [{ title, rows: [{ label, id }] }]
 */
export function parseTitles(titles) {
  const leftTitles = titles.filter((t) => t.excelTitleType === "LEFT");
  const topTitles = titles.filter((t) => t.excelTitleType === "TOP");

  // Columns from TOP headers + Remarks always at end
  const topColumns = [
    ...topTitles.flatMap((t) => t.headers.map((h) => h.headerName)),
    "Remarks",
  ];

  // Sections with rows for the left side
  const sections = leftTitles.map((title) => ({
    title: title.titleName,
    rows: title.headers.map((h) => ({
      label: h.headerName,
      id: sanitizeKey(h.headerName),
      originalName: h.headerName,
    })),
  }));

  const rowHeaders = leftTitles.flatMap((t) =>
    t.headers.map((h) => h.headerName)
  );

  return { leftTitles, topColumns, sections, rowHeaders };
}

/**
 * Build default form values from parsed titles.
 * Shape: { [colKey]: { [rowKey]: { count: "", _originalName: "" } } }
 * Remarks column stores string, others store number string.
 */
export function buildDefaultValues(topColumns, sections) {
  const values = {};
  topColumns.forEach((col) => {
    const colKey = sanitizeKey(col);
    values[colKey] = { _originalColName: col };
    sections.forEach((section) => {
      section.rows.forEach((row) => {
        values[colKey][row.id] = {
          count: "",
          _originalName: row.originalName,
        };
      });
    });
  });
  return values;
}

/**
 * Convert form values → reportCountDetails output format.
 */
export function denormalize(formValues, topColumns) {
  const result = {};
  topColumns.forEach((col) => {
    const colKey = sanitizeKey(col);
    const colData = formValues[colKey] || {};
    result[col] = Object.entries(colData)
      .filter(([k]) => k !== "_originalColName")
      .map(([, field]) => ({
        rowParameterName: field._originalName,
        count: field.count,
      }));
  });
  return result;
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const S = {
  wrapper: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    border: "1px solid #E2E4EA",
    borderRadius: 10,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  headerRow: {
    display: "flex",
    alignItems: "stretch",
    background: "#1E1F2E",
    borderBottom: "2px solid #2D2E40",
  },
  headerCell: (isFirst) => ({
    padding: "12px 16px",
    fontWeight: 600,
    fontSize: 13,
    color: "#F0F1F7",
    letterSpacing: "0.03em",
    flex: isFirst ? "0 0 220px" : 1,
    borderRight: "1px solid #2D2E40",
    display: "flex",
    alignItems: "center",
  }),
  sectionRow: {
    display: "flex",
    alignItems: "center",
    background: "#F0F1FA",
    borderBottom: "1px solid #E2E4EA",
    padding: "7px 16px",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#5C5F80",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  dataRow: (isEven) => ({
    display: "flex",
    alignItems: "flex-start",
    background: isEven ? "#F9FAFB" : "#FFFFFF",
    borderBottom: "1px solid #EDEEF3",
    padding: "10px 0",
  }),
  rowLabel: {
    flex: "0 0 220px",
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 500,
    color: "#3C3E52",
    display: "flex",
    alignItems: "center",
    borderRight: "1px solid #EDEEF3",
  },
  cellWrapper: {
    flex: 1,
    padding: "0 12px",
    borderRight: "1px solid #EDEEF3",
  },
  input: {
    width: "100%",
    height: 32,
    border: "1.5px solid #D6D8E7",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 13,
    color: "#1E1F2E",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  inputFocus: {
    borderColor: "#4F51A3",
  },
  inputError: {
    borderColor: "#E53935",
    background: "#FFF5F5",
  },
  errorText: {
    color: "#E53935",
    fontSize: 11,
    marginTop: 3,
    minHeight: 14,
  },
  submitArea: {
    padding: "16px 20px",
    borderTop: "1px solid #E2E4EA",
    background: "#F9FAFB",
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
  btn: (variant) => ({
    padding: "8px 22px",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    background: variant === "primary" ? "#1E1F2E" : "#E2E4EA",
    color: variant === "primary" ? "#fff" : "#3C3E52",
    transition: "opacity 0.15s",
  }),
  outputBox: {
    margin: "16px 0 0 0",
    background: "#1E1F2E",
    borderRadius: 8,
    padding: "16px 20px",
    color: "#A8C7FA",
    fontSize: 12,
    fontFamily: "'Fira Code', monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 320,
    overflowY: "auto",
  },
};

// ─────────────────────────────────────────────────────────────
// CELL
// ─────────────────────────────────────────────────────────────

const Cell = ({ name, isRemarks }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const [focused, setFocused] = React.useState(false);

  const getError = (errObj, path) =>
    path.split(".").reduce((o, k) => o?.[k], errObj)?.message;

  const error = getError(errors, name);

  const inputStyle = {
    ...S.input,
    ...(focused ? S.inputFocus : {}),
    ...(error ? S.inputError : {}),
  };

  if (isRemarks) {
    return (
      <div>
        <input
          {...register(name)}
          placeholder="Enter remarks"
          style={inputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <div style={S.errorText}>{error}</div>
      </div>
    );
  }

  return (
    <div>
      <input
        {...register(name, {
          setValueAs: (v) => (v === "" ? "" : Number(v)),
          min: { value: 0, message: "Min 0" },
        })}
        type="number"
        min={0}
        placeholder="Enter value"
        onKeyDown={(e) => {
          if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
        }}
        style={{
          ...inputStyle,
          MozAppearance: "textfield",
          WebkitAppearance: "none",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <div style={S.errorText}>{error}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// REPORT TABLE
// ─────────────────────────────────────────────────────────────

const ReportTable = ({ sections, topColumns }) => {
  // Build flat items list: section header + rows
  const items = useMemo(() => {
    const flat = [];
    sections.forEach((section) => {
      if (section.title) flat.push({ type: "section", title: section.title });
      section.rows.forEach((row, ri) =>
        flat.push({ type: "row", ...row, globalIndex: flat.length + ri })
      );
    });
    return flat;
  }, [sections]);

  let rowCount = 0;

  return (
    <div style={S.wrapper}>
      {/* Header */}
      <div style={S.headerRow}>
        <div style={S.headerCell(true)}>Title &amp; Parameters</div>
        {topColumns.map((col) => (
          <div key={col} style={S.headerCell(false)}>
            {col}
          </div>
        ))}
      </div>

      {/* Body */}
      {items.map((item, idx) => {
        if (item.type === "section") {
          return (
            <div key={`section-${idx}`} style={S.sectionRow}>
              <span style={S.sectionLabel}>{item.title}</span>
            </div>
          );
        }

        const isEven = rowCount % 2 === 0;
        rowCount++;

        return (
          <div key={item.id} style={S.dataRow(isEven)}>
            <div style={S.rowLabel}>{item.label}</div>
            {topColumns.map((col) => {
              const colKey = sanitizeKey(col);
              const isRemarks = col === "Remarks";
              return (
                <div key={col} style={S.cellWrapper}>
                  <Cell
                    name={`${colKey}.${item.id}.count`}
                    isRemarks={isRemarks}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// DEMO / WRAPPER
// ─────────────────────────────────────────────────────────────

const SAMPLE_TITLES = [
  {
    titleName: "Government",
    excelTitleType: "LEFT",
    headers: [{ headerName: "DDG" }, { headerName: "DD" }],
  },
  {
    titleName: "NISG",
    excelTitleType: "LEFT",
    headers: [{ headerName: "DIE" }, { headerName: "DLg" }],
  },
  {
    titleName: "",
    excelTitleType: "TOP",
    headers: [{ headerName: "Sanctioned" }, { headerName: "Working" }],
  },
];

export default function ReportTableForm({ titles = SAMPLE_TITLES, onSubmit }) {
  const { topColumns, sections } = useMemo(() => parseTitles(titles), [titles]);
  const defaultValues = useMemo(
    () => buildDefaultValues(topColumns, sections),
    [topColumns, sections]
  );

  const methods = useForm({ defaultValues });
  const [output, setOutput] = React.useState(null);

  const handleSubmit = methods.handleSubmit((values) => {
    const reportCountDetails = denormalize(values, topColumns);
    setOutput(reportCountDetails);
    onSubmit?.(reportCountDetails);
  });

  const handleReset = () => {
    methods.reset(defaultValues);
    setOutput(null);
  };

  return (
    <FormProvider {...methods}>
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 4,
              height: 22,
              background: "#4F51A3",
              borderRadius: 2,
            }}
          />
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "#1E1F2E",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Report Entry
          </h2>
        </div>

        <ReportTable sections={sections} topColumns={topColumns} />

        <div style={S.submitArea}>
          <button
            type="button"
            onClick={handleReset}
            style={S.btn("secondary")}
          >
            Reset
          </button>
          <button type="button" onClick={handleSubmit} style={S.btn("primary")}>
            Submit Report
          </button>
        </div>

        {output && (
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#5C5F80",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Output — reportCountDetails
            </div>
            <div style={S.outputBox}>
              {JSON.stringify({ reportCountDetails: output }, null, 2)}
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
}
