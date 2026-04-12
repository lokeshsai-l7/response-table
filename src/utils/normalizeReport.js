// Strips spaces and special chars → safe RHF key
// "No. Of elements" → "NoOfelements"
export function sanitizeKey(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "");
}

export function normalizeCreateData(states, leftTitles) {
  const report = {};
  states.forEach((state) => {
    const stateKey = sanitizeKey(state);
    report[stateKey] = { _originalName: state }; // ✅ store original state name
    leftTitles.forEach((section) => {
      section.headers.forEach((header) => {
        const key = sanitizeKey(header);
        report[stateKey][key] = {
          count: "",
          remarks: "",
          _originalName: header,
        };
      });
    });
  });
  return report;
}

export function normalizeEditData(reportDetails, states, leftTitles) {
  const lookup = {};
  Object.values(reportDetails).forEach((cityData) => {
    Object.entries(cityData).forEach(([state, rows]) => {
      const stateKey = sanitizeKey(state);
      lookup[stateKey] = {};
      rows.forEach((row) => {
        const key = sanitizeKey(row.rowParameter);
        lookup[stateKey][key] = {
          count: row.count ?? "",
          remarks: row.remarks ?? "",
          _originalName: row.rowParameter,
        };
      });
    });
  });

  const report = {};
  states.forEach((state) => {
    const stateKey = sanitizeKey(state);
    report[stateKey] = { _originalName: state }; // ✅ store original state name
    leftTitles.forEach((section) => {
      section.headers.forEach((header) => {
        const key = sanitizeKey(header);
        report[stateKey][key] = lookup[stateKey]?.[key] ?? {
          count: "",
          remarks: "",
          _originalName: header,
        };
      });
    });
  });
  return report;
}

// Restore original state name and rowParameterName from _originalName
export function denormalizeReport(reportValues) {
  const reportDetails = {};
  Object.entries(reportValues).forEach(([, stateData]) => {
    const originalState = stateData._originalName; // ✅ restore original state name
    reportDetails[originalState] = Object.entries(stateData)
      .filter(([key]) => key !== "_originalName") // skip the meta key
      .map(([, fields]) => ({
        rowParameterName: fields._originalName,
        count: fields.count,
        remarks: fields.remarks,
      }));
  });
  return reportDetails;
}
