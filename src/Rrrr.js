import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { PAGES } from "../../constants/navigation";
import BackNavigation from "../../components/BackNavigation";
import sharedStyles from "host/styles";
import styles from "./index.module.scss";
import { useQuery } from "react-query";
import { queryClientConfig } from "../../config/queryClientConfig";
import DetailsAccordion from "../../components/DetailsAccordion";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { pageAtom } from "../../navigation/atoms/atom";
import IntimationDetails from "./IntimationDetails";
import { workflowState } from "../../navigation/atoms/workflow";
import { misReportService } from "../../services/misReportService";
import { workflow } from "../../services/workflow";
import WorkflowDetails from "./WorkflowDetails";
import CenterLoader from "../../components/Loader";

const ViewReport = () => {
  const setActivePage = useSetRecoilState(pageAtom);
  const { reportName, workflowId, role, view } = useRecoilValue(workflowState);
  console.log("workflowId", workflowId);
  const [expandIntimationDetails, setExpandIntimationDetails] = useState(true);
  const ref = useRef(null);

  const workflowDataQuery = useQuery(
    ["misReportDetails", workflowId],
    () => misReportService.fetchWorkFlowData({ role, workflowId }),
    { enabled: !!workflowId },
  );

  const nodeHistoryQuery = useQuery(
    ["fetchWorkflowDetails", workflowId],
    () => workflow.groupByNodeHistory(workflowId),
    { enabled: !!workflowId, ...queryClientConfig },
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (expandIntimationDetails) {
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
      const height = el.scrollHeight;
      el.style.height = height + "px";
      requestAnimationFrame(() => {
        el.style.height = "0px";
      });
    }
  }, [expandIntimationDetails]);

  const misReportDetails = workflowDataQuery?.data?.successResponse?.data || [];
  const nodeHistory =
    nodeHistoryQuery.data?.successResponse?.responseData || [];
  const isLoading = workflowDataQuery.isLoading || nodeHistoryQuery.isLoading;

  console.log("misReportDetails", misReportDetails);
  console.log("nodeHistory", nodeHistory);

  return (
    <div>
      <BackNavigation
        label={`${reportName} (${workflowId})`}
        navigateTo={() => setActivePage(PAGES.DASHBOARD)}
      />
      <DetailsAccordion
        header={"Intimation details"}
        expanded={expandIntimationDetails}
        setExpanded={setExpandIntimationDetails}
      >
        <div className={styles.transformDetails} ref={ref}>
          <IntimationDetails
            workflowId={workflowId}
            reportDetails={misReportDetails.genericDetails}
          />
        </div>
      </DetailsAccordion>

      {isLoading ? (
        <CenterLoader />
      ) : (
        <WorkflowDetails
          workflowId={workflowId}
          nodeHistory={nodeHistory}
          misReportDetails={misReportDetails}
          view={view}
        />
      )}
    </div>
  );
};

export default ViewReport;


.transformDetails {
  height: auto;
  overflow: hidden;
  transition: height 0.2s ease;
}

import { useQuery } from "react-query";
import styles from "./index.module.scss";
import { workflow } from "../../../services/workflow";
import { queryClientConfig } from "../../../config/queryClientConfig";
import { toast } from "react-toastify";
import { useForm, FormProvider } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { dateTimeFormat } from "../../../utils/formatString";
import { DaysDifference } from "../../../utils/dateUtils";
import Column from "../../../components/Column";
import { stepStatus } from "../../../constants/enum/stepStatus";
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

const WorkflowDetails = ({
  workflowId,
  nodeHistory,
  misReportDetails,
  view,
}) => {
  // console.log("workflowId", workflowId);
  const [expandWorkflowDetails, setExpandWorkflowDetails] = useState(true);
  const [expandReportDetails, setExpandReportDetails] = useState(true);
  const ref = useRef(null);

  const { genericDetails, reportDetails, totalAmount } = misReportDetails;
  const { workflowStatus, updatedOn } = genericDetails;

  const defaultValuesRef = useRef();

  const renderReportDetails = () => {
    if (view === "statesView") {
      const { states } = useRecoilValue(workflowState);
      const [activeState, setActiveState] = useState(states[0]);
      const isReportEmpty = useMemo(() => {
        return !Object.values(reportDetails).some((cityData) =>
          Object.values(cityData).some(
            (stateArray) => Array.isArray(stateArray) && stateArray.length > 0,
          ),
        );
      }, [reportDetails]);

      const mode = isReportEmpty ? "create" : "edit";

      const editable = mode === "create" || mode === "edit";
      const leftTitles = [
        {
          id: 391,
          titleName: "title1",
          roKey: 0,
          roName: "ALL",
          excelTitleType: "LEFT",
          titleStatus: null,
          headersList: null,
          headers: ["Parameter1", "parameter2"],
        },
        {
          id: 392,
          titleName: "title2",
          roKey: 0,
          roName: "ALL",
          excelTitleType: "LEFT",
          titleStatus: null,
          headersList: null,
          headers: ["parameter3", "parameter4"],
        },
        {
          id: 393,
          titleName: "title3",
          roKey: 0,
          roName: "ALL",
          excelTitleType: "LEFT",
          titleStatus: null,
          headersList: null,
          headers: ["parameter6", "parameter5"],
        },
      ];

      // Normalize once on mount

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

      const sections =
        mode === "create"
          ? leftTitles.map((section) => ({
              id: String(section.id),
              title: section.titleName,
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
        { key: "count", label: "Value" },
        { key: "remarks", label: "Remarks" },
      ];
      const listToMap = (list) => {
        return Object.fromEntries(list.map((item) => [item, item]));
      };
      return (
        <div className={styles.editabaleTableContainer}>
          <MainNavBar
            tabList={listToMap(states)}
            activeTab={activeState}
            setActiveTab={setActiveState}
            className={styles.editabaleTableContainer_navbar}
          />

          <ReportTable
            sections={normalizedSections}
            columns={columns}
            editable={editable}
            activeState={activeState}
            states={states}
          />
        </div>
      );
    } else {
      return <ReportDetails reportDetails={reportDetails} />;
    }
  };

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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (expandWorkflowDetails) {
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
      const height = el.scrollHeight;
      el.style.height = height + "px";
      requestAnimationFrame(() => {
        el.style.height = "0px";
      });
    }

    if (expandReportDetails) {
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
      const height = el.scrollHeight;
      el.style.height = height + "px";
      requestAnimationFrame(() => {
        el.style.height = "0px";
      });
    }
  }, [expandWorkflowDetails, expandReportDetails]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div>
          <DetailsAccordion
            header={"Report details"}
            expanded={expandReportDetails}
            setExpanded={setExpandReportDetails}
          >
            {renderReportDetails()}
          </DetailsAccordion>

          <DetailsAccordion
            header={"Workflow details"}
            expanded={expandWorkflowDetails}
            setExpanded={setExpandWorkflowDetails}
          >
            <div className={styles.workflow_history}>
              <div className={styles.workflow_history_header}>
                <Column
                  headerVisible={true}
                  label={"Workflow Id"}
                  children={workflowId}
                />
                <Column
                  headerVisible={true}
                  label={"Created on"}
                  children={dateTimeFormat(
                    nodeHistory[0]?.actionHistoryList[0]?.startDate,
                    2,
                  )}
                />
                <Column
                  headerVisible={true}
                  label={"Completed on"}
                  children={
                    workflowStatus === "COMPLETED"
                      ? dateTimeFormat(updatedOn, 2)
                      : "-"
                  }
                />
                <Column
                  headerVisible={true}
                  label={"Elapsed Time"}
                  children={
                    DaysDifference(
                      nodeHistory[0]?.actionHistoryList[0]?.startDate,
                    ) + "days"
                  }
                />
                <Column
                  headerVisible={true}
                  label={"Status"}
                  children={workflowStatus}
                  type={"status"}
                />
              </div>
              <div className={styles.workflow_history_component}>
                {nodeHistory.map((node, key) => {
                  const workflowData = {
                    nodeConfig: misReportNodeConfig[node.nodeIndex],
                    currStepStatus: node.actionHistoryList[0].stepStatus,
                    workflowId: workflowId,
                  };

                  return (
                    <WorkflowProvider value={workflowData} key={node.nodeIndex}>
                      <WorkflowPanel nodeHistory={node} index={key}>
                        <ActionHistory
                          actionHistoryList={node.actionHistoryList}
                        />
                        <div className={styles.workflowContainer}>
                          {typeof workflowData.nodeConfig == "undefined" ||
                          workflowData.nodeConfig == null ? (
                            <div>node config null</div>
                          ) : workflowData.nodeConfig.role == userRole.HQ_SO ? (
                            <HQSO />
                          ) : workflowData.nodeConfig.role == userRole.RO_SO ? (
                            <ROSO />
                          ) : (
                            <></>
                          )}
                        </div>
                      </WorkflowPanel>
                    </WorkflowProvider>
                  );
                })}
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
        </div>
      </form>
    </FormProvider>
  );
};

export default WorkflowDetails;

.dashboard {
  padding: 20px;
}
.footer {
  background-color: white;
  position: fixed;
  bottom: 0px;
  left: 0px;
  right: 0px;
  .button {
    display: flex;
    justify-content: center;
  }
}
.workflow {
  &_history {
    margin: 10px 0px 20px 0px;
    padding: 10px 0px;
    border: 1px solid #d9d9df;
    border-radius: 5px;
    &_header {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-row-gap: 6px;
      align-items: center;
      padding: 20px 20px;
    }
    &_component {
      border-top: 1px solid #d9d9df;
    }
  }
}

.workflowContainer {
  padding: 20px;
}

.editabaleTableContainer {
  margin: 10px 0px;
  &_navbar {
    margin-bottom: 10px;
  }
}


import React, { useMemo } from "react";
import { List } from "react-window";
import { useFormContext } from "react-hook-form";

const styles = {
  wrapper: {
    fontFamily: "'Segoe UI', sans-serif",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    borderBottom: "2px solid #e0e0e0",
    padding: "10px 16px",
  },
  headerCell: {
    fontWeight: 700,
    fontSize: 13,
    color: "#222",
    flex: 1,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: "#222",
    width: 280,
    flexShrink: 0,
  },
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
  },
  input: {
    width: "100%",
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

const Cell = ({ name, editable }) => {
  const { register, getValues } = useFormContext();
  if (!editable) return <span style={{ fontSize: 13 }}>{getValues(name)}</span>;
  return (
    <input
      {...register(name)}
      placeholder="Enter value"
      style={styles.input}
      onFocus={(e) => (e.target.style.borderColor = "#5c5ccc")}
      onBlur={(e) => (e.target.style.borderColor = "#d0d0d0")}
    />
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
      <div style={{ ...style, ...styles.sectionRow }}>
        <span style={styles.sectionLabel}>{item.title}</span>
      </div>
    );
  }

  return (
    <div style={{ ...style, ...styles.dataRow }}>
      <div style={styles.rowLabel}>{item.label}</div>
      {columns.map((col) => (
        <div key={col.key} style={styles.cellWrapper}>
          <Cell
            name={`report.${activeState}.${item.id}.${col.key}`}
            editable={editable}
          />
        </div>
      ))}
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
        rowHeight={48}
        rowProps={{ items, columns, editable, activeState: state }}
        style={{ height: 400, width: "100%" }}
      />
    </div>
  );
};

const ReportTable = ({ sections, columns, editable, activeState, states }) => (
  <div style={styles.wrapper}>
    {/* Column headers */}
    <div style={styles.header}>
      <div style={styles.headerTitle}>Title &amp; Parameters</div>
      {columns.map((col) => (
        <div key={col.key} style={styles.headerCell}>
          {col.label}
        </div>
      ))}
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

export default ReportTable;
