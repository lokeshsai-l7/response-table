import { useMemo } from "react";
import ErrorBoundary from "./ErrorBoundary";
import Page from "./Page";
import { downloadROExcel } from "./utils/downloadExcel";

function App() {
  const roname = "bengaluru";
  const roData = {
    bengaluru: {
      Kerala: [
        { rowParameter: "header1", count: 321, remarks: "" },
        { rowParameter: "header2", count: 141, remarks: "" },
        { rowParameter: "header3", count: 323, remarks: "" },
        { rowParameter: "header4", count: 191, remarks: "" },
      ],
      Karnataka: [
        { rowParameter: "header1", count: 121, remarks: "" },
        { rowParameter: "header2", count: 121, remarks: "" },
        { rowParameter: "header3", count: 381, remarks: "" },
        { rowParameter: "header4", count: 641, remarks: "" },
      ],
    },
    chennai: {
      Tamilnadu: [
        { rowParameter: "header1", count: 321, remarks: "" },
        { rowParameter: "header2", count: 141, remarks: "" },
        { rowParameter: "header3", count: 323, remarks: "" },
        { rowParameter: "header4", count: 191, remarks: "" },
      ],
      coimbattor: [
        { rowParameter: "header1", count: 121, remarks: "" },
        { rowParameter: "header2", count: 121, remarks: "" },
        { rowParameter: "header3", count: 381, remarks: "" },
        { rowParameter: "header4", count: 641, remarks: "" },
      ],
    },
  };
  const totalCount = {
    bengaluru: { header1: 141, header2: 521, header3: 323, header4: 313 },
    chennai: { header1: 141, header2: 521, header3: 323, header4: 313 },
  };

  const leftTitles = [
    {
      id: 1,
      title: "Enrollment Kits",
      headers: ["header1", "header2"],
    },
    {
      id: 2,
      title: "Total Enrollment/Update",
      headers: ["header3", "header4"],
    },
  ];

  const reportMonth = "March 2026";
  const reportName = "Testing";

  return (
    <ErrorBoundary>
      {/* <Page
        mode={mode}
        workflowId={processApiResponse.workflowId}
        states={processApiResponse.states}
        reportDetails={processApiResponse.reportDetails}
        // Only pass leftTitles in create mode — no need to call headers API otherwise
        leftTitles={headersApiResponse.leftTitles}
      /> */}
      <button
        onClick={() =>
          downloadROExcel(
            leftTitles,
            roData,
            totalCount,
            reportMonth,
            reportName,
            "MyReport.xlsx",
          )
        }
      >
        Download Excel
      </button>
    </ErrorBoundary>
  );
}

export default App;
