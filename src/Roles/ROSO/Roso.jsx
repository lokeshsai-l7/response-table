import ActionOne from "./Actions/ActionOne";
import ActionTwo from "./Actions/ActionTwo";

const Roso = ({ details }) => {
  const renderActions = () => {
    if (details.partOfWorkflow === 1) {
      return <ActionOne nodeIndex={details.nodeIndex} />;
    } else if (details.partOfWorkflow === 2) {
      return <ActionTwo nodeIndex={details.nodeIndex} />;
    }
  };
  return <div>{renderActions()}</div>;
};

export default Roso;
