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

const Cell = ({ name, editable }) => {
  const { register, getValues } = useFormContext();
  if (!editable) return <span style={{ fontSize: 13 }}>{getValues(name)}</span>;
  return (
    <input
      {...register(name)}
      placeholder="Enter value"
      style={styles.input}
      onFocus={(e) => (e.target.style.borderColor = "#5c5ccc")}
      onBlur={(e) => (e.target.style.borderColor = "#d0d0d0")}
    />
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
          />
        </div>
      ))}
    </div>
  );
};

const StateTable = ({ state, isActive, sections, columns, editable }) => {
  const items = useFlattenedData(sections);
  return (
    <div style={{ display: isActive ? "block" : "none" }}>
      <List
        rowComponent={RowComponent}
        rowCount={items.length}
        rowHeight={48}
        rowProps={{ items, columns, editable, activeState: state }}
        style={{ height: 400, width: "100%" }}
      />
    </div>
  );
};

const ReportTable = ({ sections, columns, editable, activeState, states }) => (
  <div style={styles.wrapper}>
    {/* Column headers */}
    <div style={styles.header}>
      <div style={styles.headerTitle}>Title &amp; Parameters</div>
      {columns.map((col) => (
        <div key={col.key} style={styles.headerCell}>
          {col.label}
        </div>
      ))}
    </div>

    {/* All states mounted, only active visible */}
    {states.map((state) => (
      <StateTable
        key={state}
        state={state}
        isActive={state === activeState}
        sections={sections}
        columns={columns}
        editable={editable}
      />
    ))}
  </div>
);

export default ReportTable;
