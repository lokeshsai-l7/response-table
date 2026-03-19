import { useFormContext } from "react-hook-form";

export default function ActionOne({ nodeIndex }) {
  const { register } = useFormContext();

  return (
    <div>
      <label>
        text5
        <input {...register(`workflow.node_${nodeIndex}.text5`)} type="text" />
      </label>
      <label>
        text6
        <input {...register(`workflow.node_${nodeIndex}.text6`)} type="text" />
      </label>
    </div>
  );
}
