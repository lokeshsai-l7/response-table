import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./index.css";

export default function MonthlyReport({ month }) {
  const [report, setReport] = useState(null);
  const [dirtyCells, setDirtyCells] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch report
  useEffect(() => {
    async function fetchReport() {
      const res = await axios.get(`http://localhost:3000/${month}`);
      setReport(res.data[0]);
      setLoading(false);
    }
    fetchReport();
  }, [month]);

  // Handle cell edit
  const handleChange = (rowId, columnId, value) => {
    setReport((prev) => {
      const updated = structuredClone(prev);

      function updateRow(rows) {
        for (let row of rows) {
          if (row.id === rowId) {
            row.values[columnId] = value;
          }
          if (row.children) updateRow(row.children);
        }
      }

      updateRow(updated.rows);
      return updated;
    });

    // Track only changed cells
    setDirtyCells((prev) => ({
      ...prev,
      [`${rowId}_${columnId}`]: {
        rowId,
        columnId,
        value: Number(value),
      },
    }));
  };

  // Flatten rows for rendering
  const flattenRows = (rows, level = 0) => {
    let result = [];
    for (let row of rows) {
      result.push({ ...row, level });
      if (row.children) {
        result = result.concat(flattenRows(row.children, level + 1));
      }
    }
    return result;
  };

  const handleSave = async () => {
    const changes = Object.values(dirtyCells);

    if (!changes.length) return;

    const payload = {
      reportId: report.reportId,
      version: report.version,
      changes,
    };
    console.log("payload", payload);

    setDirtyCells({});
    alert("Saved successfully");
  };

  if (loading) return <p>Loading...</p>;
  if (!report) return <p>No data</p>;

  const flatRows = flattenRows(report.rows);

  return (
    <div>
      <h2>Monthly Report</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Parameter</th>
            {report.columns.map((col) => (
              <th key={col.id}>{col.name}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {flatRows.map((row) => {
            const isParent = !!row.children;

            // 🔥 If it is a section header (parent row)
            if (isParent && row.level === 0) {
              return (
                <tr key={row.id} className="section-row">
                  <td
                    colSpan={report.columns.length + 1}
                    style={{
                      fontWeight: "bold",
                      backgroundColor: "#e5e5e5",
                      textAlign: "left",
                      padding: "10px",
                    }}
                  >
                    {row.name}
                  </td>
                </tr>
              );
            }

            // 🔥 Normal editable row
            return (
              <tr key={row.id}>
                <td style={{ paddingLeft: row.level * 20 }}>{row.name}</td>

                {report.columns.map((col) => (
                  <td key={col.id}>
                    <input
                      type={col.type}
                      value={row.values?.[col.id] ?? ""}
                      onChange={(e) =>
                        handleChange(row.id, col.id, e.target.value)
                      }
                      style={{
                        width: col.dimensions.width,
                        height: col.dimensions.height,
                      }}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <button onClick={handleSave} disabled={!Object.keys(dirtyCells).length}>
        Save Changes
      </button>
    </div>
  );
}
