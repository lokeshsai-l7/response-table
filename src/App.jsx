import Page from "./Page";

function App() {
  // Simulating what you'd get from your process API
  const processApiResponse = {
    workflowId: "WF-123",
    states: ["Kerala", "Karnataka"],
    reportDetails: {}, // empty on first load (CREATE mode)
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

  // Derive mode from processApiResponse
  const hasExistingData =
    processApiResponse.reportDetails &&
    Object.keys(processApiResponse.reportDetails).length > 0;

  const mode = hasExistingData ? "edit" : "create";
  // pass "view" explicitly when you want read-only

  return (
    <Page
      mode={mode}
      workflowId={processApiResponse.workflowId}
      states={processApiResponse.states}
      reportDetails={processApiResponse.reportDetails}
      // Only pass leftTitles in create mode — no need to call headers API otherwise
      leftTitles={hasExistingData ? null : headersApiResponse.leftTitles}
    />
  );
}

export default App;
