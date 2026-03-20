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

// Converts EDIT/VIEW format (reportDetails already filled) → internal RHF shape
// No transformation needed — it's already the right shape, just rekey by rowParameterName
export function normalizeEditData(reportDetails) {
  const report = {};
  Object.entries(reportDetails).forEach(([state, rows]) => {
    report[state] = {};
    rows.forEach((row) => {
      report[state][row.rowParameterName] = {
        count: row.count,
        remarks: row.remarks,
      };
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
