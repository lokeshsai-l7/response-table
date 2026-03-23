// utils/normalizeReport.js

// Converts CREATE format (leftTitles + states) → internal RHF shape
export function normalizeCreateData(states, leftTitles) {
  const report = {};
  states.forEach((state) => {
    report[state] = {};
    leftTitles.forEach((section) => {
      section.headers.forEach((header) => {
        report[state][header] = { count: "", remarks: "" };
      });
    });
  });
  return report;
}

// Edit: build full structure from leftTitles (same as create),
// but fill count/remarks from reportDetails where data exists.
// Falls back to empty string if a row has no saved data yet.
export function normalizeEditData(reportDetails, states, leftTitles) {
  const lookup = {};

  // 1. reportDetails is an object { bengaluru: { ... } }
  Object.values(reportDetails).forEach((cityData) => {
    // 2. cityData is an object { kerala: [], Karnataka: [] }
    Object.entries(cityData).forEach(([state, rows]) => {
      lookup[state] = {};

      // 3. rows is the actual array of objects
      rows.forEach((row) => {
        // Use 'rowParameter' (as seen in your data) instead of 'rowParameterName'
        lookup[state][row.rowParameter] = {
          count: row.count ?? "",
          remarks: row.remarks ?? "",
        };
      });
    });
  });

  // Rest of your mapping logic...
  const report = {};
  states.forEach((state) => {
    report[state] = {};
    leftTitles.forEach((section) => {
      section.headers.forEach((header) => {
        report[state][header] = lookup[state]?.[header] ?? {
          count: "",
          remarks: "",
        };
      });
    });
  });

  return report;
}

// Converts internal RHF shape → final submit payload shape
export function denormalizeReport(reportValues) {
  const reportDetails = {};
  Object.entries(reportValues).forEach(([state, rows]) => {
    reportDetails[state] = Object.entries(rows).map(
      ([rowParameterName, fields]) => ({
        rowParameterName,
        count: fields.count,
        remarks: fields.remarks,
      }),
    );
  });
  return reportDetails;
}
