import React, { useMemo } from "react";

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

  const getFieldError = (errors, name) => {
    return name.split(".").reduce((obj, key) => obj?.[key], errors)?.message;
  };

  const error = getFieldError(errors, name);
  const currentValue = getValues(name);

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
    const {
      onChange: rhfOnChange,
      onBlur: rhfOnBlur,
      ...rest
    } = register(name, {
      setValueAs: (v) => (v === "" ? "" : Number(v)),
      validate: (value) => {
        const remarks = getValues(remarksName);
        if (remarks?.trim() && (value === "" || value === null)) {
          return "Count is required for these remarks";
        }
        return true;
      },
    });

    return (
      <div style={containerStyle}>
        <input
          {...rest}
          defaultValue={currentValue}
          onChange={(e) => {
            rhfOnChange(e);
            dirtyCountFields.current.add(countName);
          }}
          onKeyDown={(e) => {
            if (["e", "E", "+", "-"].includes(e.key)) {
              e.preventDefault();
            }
          }}
          onBlur={(e) => {
            rhfOnBlur(e);
            trigger([name, remarksName]);
            e.target.style.borderColor = error ? "#e53935" : "#d0d0d0";
            if (dirtyCountFields.current.has(countName)) {
              trigger(remarksName);
            }
          }}
          type="number"
          min={0}
          placeholder="Enter value"
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

  const {
    onChange: rhfRemarksChange,
    onBlur: rhfRemarksBlur,
    ...remarksRest
  } = register(name, {
    validate: (value) => {
      const count = getValues(countName);
      const countFilled = count !== "" && count !== null && count !== undefined;

      if (countFilled && !value?.trim()) {
        return "Remarks required";
      }
      return true;
    },
  });

  return (
    <div style={containerStyle}>
      <input
        {...remarksRest}
        defaultValue={currentValue}
        placeholder="Enter remarks"
        onChange={(e) => {
          rhfRemarksChange(e);
          trigger([name, countName]);
        }}
        onBlur={(e) => {
          rhfRemarksBlur(e);
          e.target.style.borderColor = error ? "#e53935" : "#d0d0d0";
        }}
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
