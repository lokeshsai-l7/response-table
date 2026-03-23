import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import ReportTable from "./ReportTable";
import {
  normalizeCreateData,
  normalizeEditData,
  denormalizeReport,
} from "./utils/normalizeReport";

const Page = ({ mode, workflowId, states, reportDetails, leftTitles }) => {
  const [activeState, setActiveState] = useState(states[0]);
  const editable = mode === "create" || mode === "edit";

  // ✅ Must be above any early returns — hooks can't be called conditionally
  const dirtyCountFields = useRef(new Set());
  const methods = useForm({ shouldUnregister: false });

  useEffect(() => {
    if (!leftTitles?.length) return;
    let report;
    if (mode === "create") {
      report = normalizeCreateData(states, leftTitles);
    } else {
      report = normalizeEditData(reportDetails, states, leftTitles);
    }
    methods.reset({ report });
  }, [leftTitles]);

  const onSubmit = (values) => {
    const payload = {
      workflowId,
      reportDetails: denormalizeReport(values.report),
    };
    console.log("FINAL PAYLOAD", payload);
  };

  const sections = useMemo(() => {
    return (leftTitles || []).map((section) => ({
      id: String(section.id),
      title: section.title, // ✅ was section.titleName — your data uses "title"
      rows: (section.headers || []).map((h) => ({ id: h, label: h })),
    }));
  }, [leftTitles]);

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

  if (leftTitles.length === 0) {
    return <div>Loading config...</div>;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} style={{ padding: 24 }}>
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
              style={tabStyles.tab(activeState === state)}
            >
              {state}
            </button>
          ))}
        </div>

        <ReportTable
          sections={sections}
          columns={columns}
          editable={editable}
          activeState={activeState}
          states={states}
          dirtyCountFields={dirtyCountFields}
        />
        <div>
          <h1>Workflow details</h1>
          <WorkflowProvider>
            {workflowConfig.map((eachConfig) => {
              return eachConfig.role === "HQSO" ? (
                <Hqso details={eachConfig} key={eachConfig.nodeIndex} />
              ) : eachConfig.role === "ROSO" ? (
                <Roso details={eachConfig} key={eachConfig.nodeIndex} />
              ) : null;
            })}
          </WorkflowProvider>
        </div>
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
      </form>
    </FormProvider>
  );
};

export default Page;
