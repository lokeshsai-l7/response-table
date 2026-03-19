import { createContext, useState } from "react";

// The Context Object
export const WorkflowContext = createContext();

export const WorkflowProvider = ({ children }) => {
  // 1. The Object (State)
  const [workflow, setWorkflow] = useState({ name: "Draft", steps: 0 });

  // 2. The Method (Function to save/update)
  const saveWorkflow = (newData) => {
    setWorkflow({ ...workflow, ...newData });
  };

  return (
    <WorkflowContext.Provider value={{ workflow, saveWorkflow }}>
      {children}
    </WorkflowContext.Provider>
  );
};
