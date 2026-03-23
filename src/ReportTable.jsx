import React, { useMemo } from "react";
import { List } from "react-window";
import { useFormContext } from "react-hook-form";

const styles = {
  wrapper: {
    fontFamily: "'Segoe UI', sans-serif",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    borderBottom: "2px solid #e0e0e0",
    padding: "10px 16px",
  },
  headerCell: {
    fontWeight: 700,
    fontSize: 13,
    color: "#222",
    flex: 1,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: "#222",
    width: 280,
    flexShrink: 0,
  },
  sectionRow: {
    display: "flex",
    alignItems: "center",
    background: "#eeeef7",
    padding: "8px 16px",
    borderBottom: "1px solid #d8d8ee",
  },
  sectionLabel: {
    fontSize: 13,
    color: "#333",
    fontWeight: 500,
  },
  dataRow: {
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    borderBottom: "1px solid #f0f0f0",
    background: "#fff",
  },
  rowLabel: {
    width: 280,
    flexShrink: 0,
    fontSize: 13,
    color: "#333",
    paddingRight: 16,
  },
  cellWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  input: {
    width: "100%",
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

function getFieldError(errors, name) {
  return name.split(".").reduce((acc, key) => acc?.[key], errors)?.message;
}

const Cell = ({ name, editable, colKey, dirtyCountFields }) => {
  const {
    register,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext();

  const basePath = name.substring(0, name.lastIndexOf("."));
  const countName = `${basePath}.count`;
  const remarksName = `${basePath}.remarks`;

  if (!editable) {
    return <span style={{ fontSize: 13 }}>{getValues(name)}</span>;
  }

  if (colKey === "count") {
    const { onChange: rhfOnChange, ...rest } = register(name, {
      setValueAs: (v) => (v === "" ? "" : Number(v)), // ✅ store as number in RHF
    });

    // ✅ Read current form value so remounted inputs restore their value
    const currentValue = getValues(name);

    return (
      <input
        {...rest}
        defaultValue={currentValue} // ✅ restores value after react-window remount
        onChange={(e) => {
          rhfOnChange(e);
          dirtyCountFields.current.add(countName);
        }}
        type="number" // ✅ browser blocks non-numeric input
        min={0}
        placeholder="Enter value"
        style={{
          ...styles.input,
          // removes the ugly spinner arrows
          MozAppearance: "textfield",
          WebkitAppearance: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#5c5ccc")}
        onBlur={(e) => {
          e.target.style.borderColor = "#d0d0d0";
          if (dirtyCountFields.current.has(countName)) {
            trigger(remarksName);
          }
        }}
      />
    );
  }

  // Remarks field
  const error = getFieldError(errors, name);
  const currentValue = getValues(name);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <input
        {...register(name, {
          validate: (value) => {
            // ✅ Only validate if user actually touched/changed this count field
            // This prevents pre-filled edit-mode counts from triggering errors
            // and prevents other tabs' fields from erroring on unrelated triggers
            if (!dirtyCountFields.current.has(countName)) {
              return true;
            }
            const count = getValues(countName);
            const countFilled =
              count !== "" && count !== null && count !== undefined;
            if (countFilled && !value?.trim()) {
              return "Remarks required";
            }
            return true;
          },
        })}
        defaultValue={currentValue}
        placeholder="Enter remarks"
        style={{
          ...styles.input,
          borderColor: error ? "#e53935" : "#d0d0d0",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#5c5ccc")}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#e53935" : "#d0d0d0";
        }}
      />
      {error && (
        <span style={{ color: "#e53935", fontSize: 11, marginTop: 2 }}>
          {error}
        </span>
      )}
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

  return (
    <div style={{ ...style, ...styles.dataRow }}>
      <div style={styles.rowLabel}>{item.label}</div>
      {columns.map((col) => (
        <div key={col.key} style={styles.cellWrapper}>
          <Cell
            name={`report.${activeState}.${item.id}.${col.key}`}
            editable={editable}
            colKey={col.key}
            dirtyCountFields={dirtyCountFields}
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
}) => {
  const items = useFlattenedData(sections);
  return (
    <div style={{ display: isActive ? "block" : "none" }}>
      {/* ✅ No virtualization — all rows stay mounted, RHF never loses registrations */}
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
      />
    ))}
  </div>
);

export default ReportTable;
