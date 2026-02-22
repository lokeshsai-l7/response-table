import { useState, useEffect } from "react";
import MonthlyReport from "./MonthlyReport";
import "./App.css";

function App() {
  const [month, setMonth] = useState();

  useEffect(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    setMonth(`${yyyy}-${mm}`);
  }, []);

  return (
    <>
      <div>{month}</div>
      <input
        value={month}
        type="month"
        onChange={(e) => setMonth(e.target.value)}
      />
      <MonthlyReport month={month} />
    </>
  );
}

export default App;
