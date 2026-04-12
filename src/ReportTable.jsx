import React, { useMemo, useRef } from "react";

import { useFormContext } from "react-hook-form";

const styles = {
  wrapper: {
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    background: "#F9F9FA",
    borderBottom: "2px solid #e0e0e0",
    padding: "10px 16px",
  },
  headerCell: {
    fontWeight: 700,
    fontSize: 14,
    color: "#222",
    flex: 1,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: 14,
    color: "#222",
    width: 280,
    flexShrink: 0,
  },
  sectionRow: {
    display: "flex",
    alignItems: "center",
    background: "#E9E9FF",
    padding: "8px 16px",
    borderBottom: "1px solid #d8d8ee",
  },
  sectionLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: 600,
  },
  dataRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px 0 16px",
    //borderBottom: "1px solid #f0f0f0",
    background: "#fff",
  },
  rowLabel: {
    width: 280,
    flexShrink: 0,
    fontSize: 14,
    fontWeight: 500,
    color: "#4C4B5A",
    paddingRight: 16,
    paddingBottom: 10,
  },
  cellWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  input: {
    width: "100%",
    height: "30px",
    border: "1px solid #d0d0d0",
    borderRadius: 4,
    padding: "5px 10px",
    fontSize: 13,
    color: "#222",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },
};

const Cell = ({
  name,
  editable,
  colKey,
  dirtyCountFields,
  dirtyRemarksFields,
}) => {
  const {
    register,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext();

  const basePath = name.substring(0, name.lastIndexOf("."));
  const countName = `${basePath}.count`;
  const remarksName = `${basePath}.remarks`;

  const initialCountRef = useRef(null);
  const initialRemarksRef = useRef(null);
  const initializedRef = useRef(false);

  // ✅ Only initialize once, and only after RHF has values
  if (!initializedRef.current) {
    const rawCount = getValues(countName);
    const rawRemarks = getValues(remarksName);
    if (rawCount !== undefined || rawRemarks !== undefined) {
      initialCountRef.current = rawCount ?? "";
      initialRemarksRef.current =
        rawRemarks == null ? "" : String(rawRemarks).trim();
      initializedRef.current = true;
    }
  }

  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "";
    if (typeof val === "number") return val;
    return String(val).trim();
  };

  const isEmpty = (val) => {
    const n = normalize(val);
    return n === "" || n === null || n === undefined;
  };

  const isFilled = (val) => !isEmpty(val);

  const validateRow = (count, remarks) => {
    const initialCount = normalize(initialCountRef.current);
    const initialRemarks = normalize(initialRemarksRef.current);

    const normCount = normalize(count);
    const normRemarks = normalize(remarks);

    const isCountEmpty = isEmpty(normCount);
    const isRemarksEmpty = isEmpty(normRemarks);

    const initialCountFilled = isFilled(initialCount);
    const initialRemarksFilled = isFilled(initialRemarks);

    // ✅ Compare as strings to handle number vs string safely
    const isCountModified = String(normCount) !== String(initialCount);
    const isRemarksModified = String(normRemarks) !== String(initialRemarks);

    // ─────────────────────────────────────────────
    // SCENARIO 1: Both started empty
    // ─────────────────────────────────────────────
    if (!initialCountFilled && !initialRemarksFilled) {
      if (isCountEmpty && !isRemarksEmpty) {
        return { count: "Count is required when remarks is filled" };
      }
      return {};
    }

    // ─────────────────────────────────────────────
    // SCENARIO 2: Count existed, remarks was empty
    // ─────────────────────────────────────────────
    if (initialCountFilled && !initialRemarksFilled) {
      if (isCountModified && isRemarksEmpty) {
        return { remarks: "Remarks is required when modifying existing count" };
      }
      return {};
    }

    // ─────────────────────────────────────────────
    // SCENARIO 3: Both existed
    // ─────────────────────────────────────────────
    if (initialCountFilled && initialRemarksFilled) {
      if (isCountModified && !isRemarksModified) {
        return { remarks: "Remarks must also be updated when changing count" };
      }
      if (isRemarksModified && !isCountModified) {
        return { count: "Count must also be updated when changing remarks" };
      }
      return {};
    }

    return {};
  };

  if (!editable) {
    return <span style={{ fontSize: 13 }}>{getValues(name)}</span>;
  }

  const getFieldError = (errors, name) =>
    name.split(".").reduce((obj, key) => obj?.[key], errors)?.message;

  const error = getFieldError(errors, name);

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  };
  const errorTextStyle = {
    color: "#e53935",
    fontSize: 11,
    marginTop: 2,
    minHeight: "14px",
    visibility: error ? "visible" : "hidden",
  };

  if (colKey === "count") {
    return (
      <div style={containerStyle}>
        <input
          {...register(name, {
            setValueAs: (v) => (v === "" ? "" : Number(v)),
            validate: (value) => {
              const remarks = getValues(remarksName);
              const result = validateRow(value, remarks);
              return result.count || true;
            },
            onChange: () => {
              dirtyCountFields.current.add(countName);
            },
            onBlur: () => {
              trigger([countName, remarksName]);
            },
          })}
          type="number"
          min={0}
          placeholder="Enter value"
          onKeyDown={(e) => {
            if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
          }}
          style={{
            ...styles.input,
            borderColor: error ? "#e53935" : "#d0d0d0",
            MozAppearance: "textfield",
            WebkitAppearance: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#5c5ccc")}
        />
        <span style={errorTextStyle}>{error || " "}</span>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <input
        {...register(name, {
          validate: (value) => {
            const count = getValues(countName);
            const result = validateRow(count, value);
            return result.remarks || true;
          },
          onChange: () => {
            dirtyRemarksFields.current.add(remarksName);
            trigger([name, countName]);
          },
          onBlur: () => {
            trigger([countName, remarksName]);
          },
        })}
        placeholder="Enter remarks"
        style={{
          ...styles.input,
          borderColor: error ? "#e53935" : "#d0d0d0",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#5c5ccc")}
      />
      <span style={errorTextStyle}>{error || " "}</span>
    </div>
  );
};

const useFlattenedData = (sections) =>
  useMemo(() => {
    const flat = [];
    sections.forEach((section) => {
      flat.push({ type: "section", title: section.title });
      section.rows.forEach((row) => flat.push({ type: "row", ...row }));
    });
    return flat;
  }, [sections]);

const RowComponent = ({
  index,
  style,
  items,
  columns,
  editable,
  activeState,
  dirtyCountFields,
  dirtyRemarksFields,
}) => {
  const item = items[index];
  if (!item) return null;

  if (item.type === "section") {
    return (
      <div style={{ ...style, ...styles.sectionRow }}>
        <span style={styles.sectionLabel}>{item.title}</span>
      </div>
    );
  }
  const rowBackground = index % 2 !== 0 ? "#F9F9FA" : "#FFFFFF";

  return (
    <div
      style={{ ...style, ...styles.dataRow, backgroundColor: rowBackground }}
    >
      <div style={styles.rowLabel}>{item.label}</div>
      {columns.map((col) => (
        <div key={col.key} style={styles.cellWrapper}>
          <Cell
            name={`report.${activeState}.${item.id}.${col.key}`}
            editable={editable}
            colKey={col.key}
            dirtyCountFields={dirtyCountFields}
            dirtyRemarksFields={dirtyRemarksFields}
          />
        </div>
      ))}
    </div>
  );
};

const StateTable = ({
  state,
  isActive,
  sections,
  columns,
  editable,
  dirtyCountFields,
  dirtyRemarksFields,
}) => {
  const items = useFlattenedData(sections);
  return (
    <div
      style={{
        display: isActive ? "block" : "none",
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      {items.map((item, index) => (
        <RowComponent
          key={index}
          index={index}
          style={{}}
          items={items}
          columns={columns}
          editable={editable}
          activeState={state}
          dirtyCountFields={dirtyCountFields}
          dirtyRemarksFields={dirtyRemarksFields}
        />
      ))}
    </div>
  );
};

const ReportTable = ({
  sections,
  columns,
  editable,
  activeState,
  states,
  dirtyCountFields,
  dirtyRemarksFields,
}) => (
  <div style={styles.wrapper}>
    <div style={styles.header}>
      <div style={styles.headerTitle}>Title &amp; Parameters</div>
      {columns.map((col) => (
        <div key={col.key} style={styles.headerCell}>
          {col.label}
        </div>
      ))}
    </div>
    {states.map((state) => (
      <StateTable
        key={state}
        state={state}
        isActive={state === activeState}
        sections={sections}
        columns={columns}
        editable={editable}
        dirtyCountFields={dirtyCountFields}
        dirtyRemarksFields={dirtyRemarksFields}
      />
    ))}
  </div>
);

export default ReportTable;
