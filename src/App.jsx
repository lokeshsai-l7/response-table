import { useMemo } from "react";
import ErrorBoundary from "./ErrorBoundary";
import Page from "./Page";

function App() {
  // Simulating what you'd get from your process API
  const roname = "bengaluru";
  const processApiResponse = {
    workflowId: "WF-123",
    states: ["Kerala", "Karnataka"],
    reportDetails: {
      bengaluru: {
        Kerala: [
          { rowParameter: "header1", count: 321, remarks: "test" },
          { rowParameter: "header2", count: 141, remarks: "" },
        ],
        Karnataka: [
          { rowParameter: "header1", count: 121, remarks: "" },
          { rowParameter: "header2", count: 121, remarks: "" },
        ],
      },
    }, // empty on first load (CREATE mode)
  };

  // Simulating your headers API response
  const headersApiResponse = {
    leftTitles: [
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
    ],
  };

  const hasExistingData =
    Object.keys(processApiResponse.reportDetails[roname] ?? {}).length > 0;

  console.log("hasExistingData", hasExistingData);

  const mode = hasExistingData ? "edit" : "create";
  // pass "view" explicitly when you want read-only

  return (
    <ErrorBoundary>
      <Page
        mode={mode}
        workflowId={processApiResponse.workflowId}
        states={processApiResponse.states}
        reportDetails={processApiResponse.reportDetails}
        // Only pass leftTitles in create mode — no need to call headers API otherwise
        leftTitles={headersApiResponse.leftTitles}
      />
    </ErrorBoundary>
  );
}

export default App;
