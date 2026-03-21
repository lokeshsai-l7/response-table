WorkflowDetails/
├── index.jsx                  ← root, owns FormProvider + onSubmit
├── ReportSection.jsx          ← report accordion
├── WorkflowSection.jsx        ← workflow accordion + node history
├── WorkflowMetaHeader.jsx     ← the 5 Column header row
├── StatesViewReport.jsx       ← already extracted, move to own file
└── hooks/
    └── useAccordionAnimation.js

import { useEffect, useRef } from "react";

export const useAccordionAnimation = (expanded) => {
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


import { useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import { workflowState } from "../../../navigation/atoms/workflow";
import { MainNavBar } from "host/reusableComponents";
import ReportTable from "../ReportDetails/ReportTable";
import { normalizeCreateData } from "../ReportDetails/utils/normalizeReport";
import styles from "./index.module.scss";

// Hardcoded — replace with API call when ready
const LEFT_TITLES = [
  { id: 391, titleName: "title1", headers: ["Parameter1", "parameter2"] },
  { id: 392, titleName: "title2", headers: ["parameter3", "parameter4"] },
  { id: 393, titleName: "title3", headers: ["parameter6", "parameter5"] },
];

const COLUMNS = [
  { key: "count", label: "Value" },
  { key: "remarks", label: "Remarks" },
];

const StatesViewReport = ({ reportDetails }) => {
  const { states } = useRecoilValue(workflowState);
  const [activeState, setActiveState] = useState(states[0]);

  const isReportEmpty = useMemo(() => {
    if (!reportDetails || Object.keys(reportDetails).length === 0) return true;
    return !Object.values(reportDetails).some((cityData) =>
      Array.isArray(cityData)
        ? cityData.length > 0
        : Object.values(cityData).some(
            (arr) => Array.isArray(arr) && arr.length > 0
          )
    );
  }, [reportDetails]);

  const mode = isReportEmpty ? "create" : "edit";

  const sections = useMemo(() => {
    if (mode === "create") {
      return LEFT_TITLES.map((section) => ({
        id: String(section.id),
        title: section.titleName,
        rows: section.headers.map((h) => ({ id: h, label: h })),
      }));
    }
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
        columns={COLUMNS}
        editable={true}
        activeState={activeState}
        states={states}
      />
    </div>
  );
};

export default StatesViewReport;


import Column from "../../../components/Column";
import { dateTimeFormat } from "../../../utils/formatString";
import { DaysDifference } from "../../../utils/dateUtils";
import styles from "./index.module.scss";

const WorkflowMetaHeader = ({ workflowId, nodeHistory, workflowStatus, updatedOn }) => (
  <div className={styles.workflow_history_header}>
    <Column headerVisible label="Workflow Id">{workflowId}</Column>
    <Column headerVisible label="Created on">
      {dateTimeFormat(nodeHistory[0]?.actionHistoryList[0]?.startDate, 2)}
    </Column>
    <Column headerVisible label="Completed on">
      {workflowStatus === "COMPLETED" ? dateTimeFormat(updatedOn, 2) : "-"}
    </Column>
    <Column headerVisible label="Elapsed Time">
      {DaysDifference(nodeHistory[0]?.actionHistoryList[0]?.startDate) + " days"}
    </Column>
    <Column headerVisible label="Status" type="status">
      {workflowStatus}
    </Column>
  </div>
);

export default WorkflowMetaHeader;


import { useState } from "react";
import DetailsAccordion from "../../../components/DetailsAccordion";
import ReportDetails from "../ReportDetails";
import StatesViewReport from "./StatesViewReport";
import { useAccordionAnimation } from "./hooks/useAccordionAnimation";
import styles from "./index.module.scss";

const ReportSection = ({ view, reportDetails, workflowId }) => {
  const [expanded, setExpanded] = useState(true);
  const ref = useAccordionAnimation(expanded);

  return (
    <DetailsAccordion
      header="Report details"
      expanded={expanded}
      setExpanded={setExpanded}
    >
      <div ref={ref} className={styles.transformDetails}>
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
  );
};

export default ReportSection;



import { useState } from "react";
import DetailsAccordion from "../../../components/DetailsAccordion";
import WorkflowPanel from "../../../components/Workflow/WorkflowPanel";
import ActionHistory from "../../../components/Workflow/ActionHistory";
import { WorkflowProvider } from "../../../contexts/workflowContext";
import { misReportNodeConfig } from "../../../config/misReportNodeConfig";
import { userRole } from "../../../constants/enum/userRole";
import { stepStatus } from "../../../constants/enum/stepStatus";
import { useAccordionAnimation } from "./hooks/useAccordionAnimation";
import WorkflowMetaHeader from "./WorkflowMetaHeader";
import HQSO from "./HQSO";
import ROSO from "./ROSO";
import styles from "./index.module.scss";

const WorkflowSection = ({ workflowId, nodeHistory, genericDetails }) => {
  const [expanded, setExpanded] = useState(true);
  const ref = useAccordionAnimation(expanded);
  const { workflowStatus, updatedOn } = genericDetails;

  return (
    <DetailsAccordion
      header="Workflow details"
      expanded={expanded}
      setExpanded={setExpanded}
    >
      <div ref={ref} className={styles.transformDetails}>
        <div className={styles.workflow_history}>
          <WorkflowMetaHeader
            workflowId={workflowId}
            nodeHistory={nodeHistory}
            workflowStatus={workflowStatus}
            updatedOn={updatedOn}
          />

          <div className={styles.workflow_history_component}>
            {nodeHistory.map((node, key) => {
              const workflowData = {
                nodeConfig: misReportNodeConfig[node.nodeIndex],
                currStepStatus: node.actionHistoryList[0].stepStatus,
                workflowId,
                // ✅ Active node flag derived here — single source of truth
                isActiveNode:
                  node.actionHistoryList[0].stepStatus === stepStatus.PENDING,
              };

              return (
                <WorkflowProvider value={workflowData} key={node.nodeIndex}>
                  <WorkflowPanel nodeHistory={node} index={key}>
                    <ActionHistory actionHistoryList={node.actionHistoryList} />
                    <div className={styles.workflowContainer}>
                      {workflowData.nodeConfig == null ? (
                        <div>node config null</div>
                      ) : workflowData.nodeConfig.role === userRole.HQ_SO ? (
                        <HQSO />
                      ) : workflowData.nodeConfig.role === userRole.RO_SO ? (
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
  );
};

export default WorkflowSection;


import { useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { stepStatus } from "../../../constants/enum/stepStatus";
import {
  denormalizeReport,
  normalizeEditData,
} from "../ReportDetails/utils/normalizeReport";
import ReportSection from "./ReportSection";
import WorkflowSection from "./WorkflowSection";
import styles from "./index.module.scss";

const WorkflowDetails = ({ workflowId, nodeHistory, misReportDetails, view }) => {
  const { genericDetails, reportDetails } = misReportDetails;

  const methods = useForm({
    defaultValues: {},
    shouldUnregister: false,
  });

  // ✅ Populate form when async reportDetails arrives
  useEffect(() => {
    if (view !== "statesView" || !reportDetails) return;
    const isEmpty = Object.keys(reportDetails).length === 0;
    if (!isEmpty) {
      methods.reset({ report: normalizeEditData(reportDetails) });
    }
  }, [reportDetails, view]);

  const onSubmit = (values) => {
    const allNodes = Object.values(values.workflow || {});

    // Active node — the one the current user is acting on
    const activeNode = allNodes.find(
      (node) => node._meta?.currStepStatus === stepStatus.PENDING
    );

    if (!activeNode) {
      console.warn("No active node found");
      return;
    }

    const { _meta, takeAction } = activeNode;

    const payload = {
      workflowId,
      reportDetails: denormalizeReport(values.report),
      action: {
        nodeIndex: _meta.nodeIndex,
        role: _meta.role,
        status: takeAction?.status,
        comments: takeAction?.comments,
        nextAssignee: takeAction?.nextAssignee,
        selectedNodeDetails: takeAction?.selectedNodeDetails,
        regionalOffice: takeAction?.regionalOffice,
        uploadedFiles: takeAction?.uploadedFiles,
      },
    };

    console.log("FINAL PAYLOAD", payload);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <ReportSection
          view={view}
          reportDetails={reportDetails}
          workflowId={workflowId}
        />
        <WorkflowSection
          workflowId={workflowId}
          nodeHistory={nodeHistory}
          genericDetails={genericDetails}
        />
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
