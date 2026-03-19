import ActionOne from "./ActionOne";
import ActionTwo from "./ActionTwo";

const Hqso = ({ details }) => {
  const renderActions = () => {
    if (details.partOfWorkflow === 1) {
      return <ActionOne />;
    } else if (details.partOfWorkflow === 2) {
      return <ActionTwo />;
    }
  };
  return <div>{renderActions()}</div>;
};

export default Hqso;
