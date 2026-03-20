import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import ReportTable from "./ReportTable";
import {
  normalizeCreateData,
  normalizeEditData,
  denormalizeReport,
} from "./utils/normalizeReport";

const Page = ({ mode, workflowId, states, reportDetails, leftTitles }) => {
  const [activeState, setActiveState] = useState(states[0]);

  const editable = mode === "create" || mode === "edit"; // view = read-only

  // Normalize once on mount
  const defaultValuesRef = React.useRef();
  if (!defaultValuesRef.current) {
    let report;
    if (mode === "create") {
      // Use headers from leftTitles API
      report = normalizeCreateData(states, leftTitles);
    } else {
      // edit or view — use existing reportDetails from process API
      report = normalizeEditData(reportDetails);
    }
    defaultValuesRef.current = { report };
  }

  const methods = useForm({
    defaultValues: defaultValuesRef.current,
    shouldUnregister: false,
  });

  const onSubmit = (values) => {
    const payload = {
      workflowId,
      reportDetails: denormalizeReport(values.report), // back to API shape
    };
    console.log("FINAL PAYLOAD", payload);
  };

  // Build sections for ReportTable from leftTitles (create) or reportDetails (edit/view)
  const sections =
    mode === "create"
      ? leftTitles.map((section) => ({
          id: String(section.id),
          title: section.title,
          rows: section.headers.map((h) => ({ id: h, label: h })),
        }))
      : (Object.entries(reportDetails)[0]?.[1].map((row, i) => ({
          // In edit/view, derive rows from first state's keys
          id: row.rowParameterName,
          label: row.rowParameterName,
        })) ?? []);

  // For edit/view, wrap rows in a single section if your data has no titles
  const normalizedSections =
    mode === "create"
      ? sections
      : [{ id: "s1", title: "Report Details", rows: sections }];

  const columns = [
    { key: "count", label: "Count" },
    { key: "remarks", label: "Remarks" },
  ];

  const tabStyle = (active) => ({
    padding: "10px 24px",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    color: active ? "#3f3fcc" : "#555",
    borderBottom: active ? "2px solid #3f3fcc" : "2px solid transparent",
    marginBottom: -2,
    transition: "all 0.15s",
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} style={{ padding: 24 }}>
        {/* Tabs */}
        <div
          style={{
            borderBottom: "2px solid #e0e0e0",
            marginBottom: 24,
            display: "flex",
          }}
        >
          {states.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => setActiveState(state)}
              style={tabStyle(activeState === state)}
            >
              {state}
            </button>
          ))}
        </div>

        <ReportTable
          sections={normalizedSections}
          columns={columns}
          editable={editable}
          activeState={activeState}
          states={states}
        />

        {editable && (
          <button
            type="submit"
            style={{
              marginTop: 24,
              padding: "10px 32px",
              background: "#3f3fcc",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Submit
          </button>
        )}
      </form>
    </FormProvider>
  );
};

export default Page;
