import Page from "./Page";

function App() {
  const config = {
    workflowId: "WF-123",

    states: ["Tamil Nadu", "Kerala"],

    report: {
      editable: true,

      columns: [
        { key: "value", label: "Value" },
        { key: "remarks", label: "Remarks" },
      ],

      sections: [
        {
          id: "s1",
          title:
            "Enrollment Kits/Operators Currently Operational & Inspection Details",
          rows: [
            { id: "r1", label: "Total Enrollment kits Operational" },
            { id: "r2", label: "Total CELC kits Currently Operational" },
          ],
        },
        {
          id: "s2",
          title: "Total Enrollment/Update",
          rows: [
            { id: "r3", label: "Total enrollment" },
            { id: "r4", label: "Total update" },
          ],
        },
      ],
    },
  };

  return <Page config={config} />;
}

export default App;
