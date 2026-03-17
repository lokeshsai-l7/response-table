import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import ReportTable from "./ReportTable";
import WorkflowActions from "./WorkflowActions";

const tabStyles = {
  wrapper: {
    borderBottom: "2px solid #e0e0e0",
    marginBottom: 24,
    display: "flex",
    gap: 0,
  },
  tab: (active) => ({
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
  }),
};

const Page = ({ config }) => {
  const [activeState, setActiveState] = useState(config.states[0]);

  const defaultValuesRef = React.useRef();
  if (!defaultValuesRef.current) {
    const report = {};
    config.states.forEach((state) => {
      report[state] = {};
      config.report.sections.forEach((section) => {
        section.rows.forEach((row) => {
          report[state][row.id] = { value: "", remarks: "" };
        });
      });
    });
    defaultValuesRef.current = { report, workflow: {} };
  }

  const methods = useForm({
    defaultValues: defaultValuesRef.current,
    shouldUnregister: false,
  });

  const onSubmit = (values) => {
    console.log("FINAL PAYLOAD", {
      workflowId: config.workflowId,
      action: values.workflow.action,
      reportDetails: values.report,
      workflowData: values.workflow,
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} style={{ padding: 24 }}>
        {/* Styled tabs */}
        <div style={tabStyles.wrapper}>
          {config.states.map((state) => (
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
          sections={config.report.sections}
          columns={config.report.columns}
          editable={config.report.editable}
          activeState={activeState}
          states={config.states}
        />

        <WorkflowActions config={config.workflow} />
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
