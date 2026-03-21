import { useQuery } from "react-query";
import styles from "./index.module.scss";
import { workflow } from "../../../services/workflow";
import { queryClientConfig } from "../../../config/queryClientConfig";
import { useForm, FormProvider } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { dateTimeFormat } from "../../../utils/formatString";
import { DaysDifference } from "../../../utils/dateUtils";
import Column from "../../../components/Column";
import WorkflowPanel from "../../../components/Workflow/WorkflowPanel";
import ActionHistory from "../../../components/Workflow/ActionHistory";
import { misReportNodeConfig } from "../../../config/misReportNodeConfig";
import HQSO from "./HQSO";
import { userRole } from "../../../constants/enum/userRole";
import { WorkflowProvider } from "../../../contexts/workflowContext";
import ReportDetails from "../ReportDetails";
import DetailsAccordion from "../../../components/DetailsAccordion";
import ROSO from "./ROSO";
import { workflowState } from "../../../navigation/atoms/workflow";
import { useRecoilValue } from "recoil";
import {
  denormalizeReport,
  normalizeCreateData,
  normalizeEditData,
} from "../ReportDetails/utils/normalizeReport";
import { MainNavBar } from "host/reusableComponents";
import ReportTable from "../ReportDetails/ReportTable";

// ✅ Extracted into its own proper component — hooks are now always called at top level
const StatesViewReport = ({ reportDetails, workflowId }) => {
  const { states } = useRecoilValue(workflowState);
  const [activeState, setActiveState] = useState(states[0]);

  // ✅ Derive mode from data — not from prop
  const isReportEmpty = useMemo(() => {
    if (!reportDetails || Object.keys(reportDetails).length === 0) return true;
    return !Object.values(reportDetails).some(
      (cityData) =>
        Array.isArray(cityData)
          ? cityData.length > 0
          : Object.values(cityData).some(
              (stateArray) => Array.isArray(stateArray) && stateArray.length > 0
            )
    );
  }, [reportDetails]);

  const mode = isReportEmpty ? "create" : "edit";
  const editable = true; // both create and edit are editable

  // Hardcoded for now — replace with API call when ready
  const leftTitles = [
    {
      id: 391,
      titleName: "title1",
      headers: ["Parameter1", "parameter2"],
    },
    {
      id: 392,
      titleName: "title2",
      headers: ["parameter3", "parameter4"],
    },
    {
      id: 393,
      titleName: "title3",
      headers: ["parameter6", "parameter5"],
    },
  ];

  // ✅ Sections derived cleanly based on mode
  const sections = useMemo(() => {
    if (mode === "create") {
      return leftTitles.map((section) => ({
        id: String(section.id),
        title: section.titleName,
        rows: section.headers.map((h) => ({ id: h, label: h })),
      }));
    }
    // edit — derive rows from first state's data, wrap in one section
    const firstStateRows = Object.values(reportDetails)[0] ?? [];
    return [
      {
        id: "s1",
        title: "Report Details",
        rows: firstStateRows.map((row) => ({
          id: row.rowParameterName,
          label: row.rowParameterName,
        })),
      },
    ];
  }, [mode, reportDetails]);

  const columns = [
    { key: "count", label: "Value" },
    { key: "remarks", label: "Remarks" },
  ];

  const listToMap = (list) =>
    Object.fromEntries(list.map((item) => [item, item]));

  return (
    <div className={styles.editabaleTableContainer}>
      <MainNavBar
        tabList={listToMap(states)}
        activeTab={activeState}
        setActiveTab={setActiveState}
        className={styles.editabaleTableContainer_navbar}
      />
      <ReportTable
        sections={sections}
        columns={columns}
        editable={editable}
        activeState={activeState}
        states={states}
      />
    </div>
  );
};

// ✅ Hook to animate a single accordion ref
const useAccordionAnimation = (expanded) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (expanded) {
      el.style.display = "block";
      const height = el.scrollHeight;
      el.style.height = "0px";
      requestAnimationFrame(() => {
        el.style.height = height + "px";
      });
      const end = () => {
        el.style.height = "auto";
        el.removeEventListener("transitionend", end);
      };
      el.addEventListener("transitionend", end);
    } else {
      el.style.height = el.scrollHeight + "px";
      requestAnimationFrame(() => {
        el.style.height = "0px";
      });
    }
  }, [expanded]);

  return ref;
};

const WorkflowDetails = ({
  workflowId,
  nodeHistory,
  misReportDetails,
  view,
}) => {
  const [expandWorkflowDetails, setExpandWorkflowDetails] = useState(true);
  const [expandReportDetails, setExpandReportDetails] = useState(true);

  // ✅ Each accordion gets its own ref
  const workflowRef = useAccordionAnimation(expandWorkflowDetails);
  const reportRef = useAccordionAnimation(expandReportDetails);

  const { genericDetails, reportDetails } = misReportDetails;
  const { workflowStatus, updatedOn } = genericDetails;

  // ✅ Normalize data at this level — before useForm runs
  const defaultValues = useMemo(() => {
    if (view !== "statesView") return {};
    // Can't determine mode here without states — StatesViewReport handles its own form init
    return {};
  }, [view]);

  const methods = useForm({
    defaultValues,
    shouldUnregister: false,
  });

  // ✅ Reset form when reportDetails arrive (handles async data)
  useEffect(() => {
    if (view !== "statesView" || !reportDetails) return;
    const isReportEmpty =
      !reportDetails || Object.keys(reportDetails).length === 0;
    const normalized = isReportEmpty
      ? {} // StatesViewReport will handle create normalization
      : { report: normalizeEditData(reportDetails) };
    methods.reset(normalized);
  }, [reportDetails, view]);

  const onSubmit = (values) => {
    const payload = {
      workflowId,
      reportDetails: denormalizeReport(values.report),
    };
    console.log("FINAL PAYLOAD", payload);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <DetailsAccordion
          header="Report details"
          expanded={expandReportDetails}
          setExpanded={setExpandReportDetails}
        >
          <div ref={reportRef} className={styles.transformDetails}>
            {/* ✅ Conditional render — no hooks inside conditions */}
            {view === "statesView" ? (
              <StatesViewReport
                reportDetails={reportDetails}
                workflowId={workflowId}
              />
            ) : (
              <ReportDetails reportDetails={reportDetails} />
            )}
          </div>
        </DetailsAccordion>

        <DetailsAccordion
          header="Workflow details"
          expanded={expandWorkflowDetails}
          setExpanded={setExpandWorkflowDetails}
        >
          <div ref={workflowRef} className={styles.transformDetails}>
            <div className={styles.workflow_history}>
              <div className={styles.workflow_history_header}>
                <Column
                  headerVisible={true}
                  label="Workflow Id"
                  children={workflowId}
                />
                <Column
                  headerVisible={true}
                  label="Created on"
                  children={dateTimeFormat(
                    nodeHistory[0]?.actionHistoryList[0]?.startDate,
                    2
                  )}
                />
                <Column
                  headerVisible={true}
                  label="Completed on"
                  children={
                    workflowStatus === "COMPLETED"
                      ? dateTimeFormat(updatedOn, 2)
                      : "-"
                  }
                />
                <Column
                  headerVisible={true}
                  label="Elapsed Time"
                  children={
                    DaysDifference(
                      nodeHistory[0]?.actionHistoryList[0]?.startDate
                    ) + " days"
                  }
                />
                <Column
                  headerVisible={true}
                  label="Status"
                  children={workflowStatus}
                  type="status"
                />
              </div>

              <div className={styles.workflow_history_component}>
                {nodeHistory.map((node, key) => {
                  const workflowData = {
                    nodeConfig: misReportNodeConfig[node.nodeIndex],
                    currStepStatus: node.actionHistoryList[0].stepStatus,
                    workflowId,
                  };

                  return (
                    <WorkflowProvider value={workflowData} key={node.nodeIndex}>
                      <WorkflowPanel nodeHistory={node} index={key}>
                        <ActionHistory
                          actionHistoryList={node.actionHistoryList}
                        />
                        <div className={styles.workflowContainer}>
                          {workflowData.nodeConfig == null ? (
                            <div>node config null</div>
                          ) : workflowData.nodeConfig.role ===
                            userRole.HQ_SO ? (
                            <HQSO />
                          ) : workflowData.nodeConfig.role ===
                            userRole.RO_SO ? (
                            <ROSO />
                          ) : null}
                        </div>
                      </WorkflowPanel>
                    </WorkflowProvider>
                  );
                })}
              </div>
            </div>
          </div>
        </DetailsAccordion>

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

export default WorkflowDetails;
