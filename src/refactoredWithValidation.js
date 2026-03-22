import React, { useMemo, useState } from "react";
import { List } from "react-window";
import { useFormContext } from "react-hook-form";

const tableStyles = {
  wrapper: {
    fontFamily: "'Segoe UI', sans-serif",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#fff",
    borderBottom: "2px solid #e0e0e0",
    padding: "10px 16px",
  },
  headerLeft: {
    display: "flex",
    flex: 1,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: "#222",
    width: 280,
    flexShrink: 0,
  },
  headerCell: {
    fontWeight: 700,
    fontSize: 13,
    color: "#222",
    flex: 1,
  },
  editBtn: (isEditing) => ({
    padding: "5px 16px",
    border: `1px solid ${isEditing ? "#e53935" : "#3f3fcc"}`,
    borderRadius: 5,
    background: isEditing ? "#fff5f5" : "#f0f0ff",
    color: isEditing ? "#e53935" : "#3f3fcc",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  }),
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
    display: "flex",
    flexDirection: "column",
  },
  input: (hasError) => ({
    width: "100%",
    border: `1px solid ${hasError ? "#e53935" : "#d0d0d0"}`,
    borderRadius: 4,
    padding: "5px 10px",
    fontSize: 13,
    color: "#222",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  }),
  errorText: {
    fontSize: 11,
    color: "#e53935",
    marginTop: 2,
  },
  readOnlyText: {
    fontSize: 13,
    color: "#333",
    padding: "5px 0",
  },
};

// ✅ Cell knows if it's editable and validates remarks when count changes
const Cell = ({ name, editable, isRemarks, linkedCountName }) => {
  const {
    register,
    getValues,
    formState: { errors },
  } = useFormContext();

  // Get nested error by path e.g. "report.Kerala.r1.remarks"
  const getError = (path) => {
    return path.split(".").reduce((acc, key) => acc?.[key], errors);
  };

  const error = getError(name);

  if (!editable) {
    return (
      <span style={tableStyles.readOnlyText}>{getValues(name) || "—"}</span>
    );
  }

  return (
    <div style={tableStyles.cellWrapper}>
      <input
        {...register(name, {
          // ✅ Remarks required only if the linked count field has a value
          validate: isRemarks
            ? (value) => {
                const countValue = getValues(linkedCountName);
                if (countValue && countValue !== "" && !value) {
                  return "Remarks required when value is changed";
                }
                return true;
              }
            : undefined,
        })}
        placeholder={isRemarks ? "Enter remarks" : "Enter value"}
        style={tableStyles.input(!!error)}
        onFocus={(e) => {
          if (!error) e.target.style.borderColor = "#5c5ccc";
        }}
        onBlur={(e) => {
          if (!error) e.target.style.borderColor = "#d0d0d0";
        }}
      />
      {error && <span style={tableStyles.errorText}>{error.message}</span>}
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
}) => {
  const item = items[index];
  if (!item) return null;

  if (item.type === "section") {
    return (
      <div style={{ ...style, ...tableStyles.sectionRow }}>
        <span style={tableStyles.sectionLabel}>{item.title}</span>
      </div>
    );
  }

  return (
    <div style={{ ...style, ...tableStyles.dataRow }}>
      <div style={tableStyles.rowLabel}>{item.label}</div>
      {columns.map((col) => {
        const name = `report.${activeState}.${item.id}.${col.key}`;
        const isRemarks = col.key === "remarks";
        // ✅ Link remarks to its sibling count field for cross-field validation
        const linkedCountName = `report.${activeState}.${item.id}.count`;

        return (
          <div key={col.key} style={{ flex: 1, paddingRight: 12 }}>
            <Cell
              name={name}
              editable={editable}
              isRemarks={isRemarks}
              linkedCountName={linkedCountName}
            />
          </div>
        );
      })}
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
        rowHeight={56} // slightly taller to fit error message
        rowProps={{ items, columns, editable, activeState: state }}
        style={{ height: 400, width: "100%" }}
      />
    </div>
  );
};

const ReportTable = ({
  sections,
  columns,
  editable: editableProp, // ✅ incoming prop = whether edit is allowed at all (mode-level)
  activeState,
  states,
}) => {
  // ✅ Local toggle — only available when editableProp is true
  const [isEditing, setIsEditing] = useState(false);

  // If prop says not editable (view mode), never allow editing
  const editable = editableProp && isEditing;

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  return (
    <div style={tableStyles.wrapper}>
      {/* Toolbar: column headers + edit button */}
      <div style={tableStyles.toolbar}>
        <div style={tableStyles.headerLeft}>
          <div style={tableStyles.headerTitle}>Title &amp; Parameters</div>
          {columns.map((col) => (
            <div key={col.key} style={tableStyles.headerCell}>
              {col.label}
            </div>
          ))}
        </div>

        {/* ✅ Only show edit button when editing is allowed */}
        {editableProp && (
          <button
            type="button"
            onClick={handleEditToggle}
            style={tableStyles.editBtn(isEditing)}
          >
            {isEditing ? "Cancel" : "✎ Edit"}
          </button>
        )}
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
};

export default ReportTable;
