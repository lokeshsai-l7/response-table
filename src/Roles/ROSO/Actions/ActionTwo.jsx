import { useFormContext } from "react-hook-form";

export default function ActionTwo({ nodeIndex }) {
  const { register } = useFormContext();

  return (
    <div>
      <label>
        text7
        <input {...register(`workflow.node_${nodeIndex}.text7`)} type="text" />
      </label>
      <label>
        text8
        <input {...register(`workflow.node_${nodeIndex}.text8`)} type="text" />
      </label>
    </div>
  );
}
