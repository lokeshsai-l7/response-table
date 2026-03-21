import { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { useQuery } from "react-query";
import {
  Dropdown,
  TextArea,
  FileUpload,
  RadioGroup,
} from "host/reusableComponents";
import PreviousFile from "../../../components/PreviousFiles/PreviousFile";
import { action, actionType } from "../../../constants/enums/actionType";
import { assigningMode } from "../../../constants/enums/assigningMode";
import sharedStyles from "host/styles";
import { useFetchNextAssignee } from "./hooks/useFetchNextAssignee";
import { useFetchActionBit } from "./hooks/useFetchActionBit";
import { selfAssignText } from "../../../constants/selfAssignText";
import { userManagementService } from "../../../services/userManagementService";
import { queryClientConfig } from "../../../configs/queryClientConfig";
import { userRole } from "../../../constants/enums/UserRole";
import { useSelector } from "react-redux";
import ActionLoader from "../../Loader/ActionLoader";
import { useWorkflowContext } from "../../../contexts/workflowContext";
import styles from "./TakeAction.module.scss";

const TakeAction = ({
  isActionLoading = false,
  actionWorkflowId,
  currentNodeDetails = null,
  customActionType = actionType,
  previousFiles,
  setPreviousFiles = () => {},
  NextAssigneeComponent = () => null,
  CommentComponent = () => null,
  UploadFileComponent = () => null,
  setActionType = () => {},
  onSelfAssign = async () => {},   // renamed from onTakeAction for self-assign only
  requestInitiatedBy = null,
  filterNextNodes = null,
  customActionBit = null,
  requestorUserId = null,
  regionalOfficeId,
  consentDocuments,
}) => {
  const userDetails = useSelector((state) => state.userPerm.userPermissionData);
  const { nodeConfig } = useWorkflowContext();

  // ✅ All values now live in RHF, namespaced by nodeIndex
  const nodeKey = `workflow.node_${nodeConfig.nodeIndex}.takeAction`;
  const { control, setValue, watch } = useFormContext();

  // Watch values needed for conditional rendering (replaces reading from formState)
  const selectedNodeDetails = watch(`${nodeKey}.selectedNodeDetails`);
  const statusValue = watch(`${nodeKey}.status`);
  const regionalOfficeValue = watch(`${nodeKey}.regionalOffice`);

  const { noOfActiveBits, firstActiveBit, listOfBit, nextNodeList } =
    useFetchActionBit(
      statusValue,
      currentNodeDetails,
      actionWorkflowId,
      requestInitiatedBy,
      filterNextNodes,
      customActionBit
    );

  const nextAssigneeList = useFetchNextAssignee(
    selectedNodeDetails?.value?.assigningMode,
    selectedNodeDetails?.value?.nodeRole,
    requestorUserId,
    regionalOfficeId ?? regionalOfficeValue?.value?.id
  );

  // ✅ Derive radio options from listOfBit — no separate state needed
  const radioOptions = listOfBit.reduce((acc, bit, index) => {
    if (bit === "1" && index < customActionType.length) {
      acc.push({
        label: customActionType[index].value,
        value: customActionType[index].key,
      });
    }
    return acc;
  }, []);

  // ✅ Set initial status when firstActiveBit resolves
  useEffect(() => {
    if (firstActiveBit === -1) return;
    const initialStatus = action[customActionType[firstActiveBit].key];
    setValue(`${nodeKey}.status`, initialStatus);
    setActionType(initialStatus);
  }, [firstActiveBit]);

  // ✅ Set initial selectedNodeDetails when nextNodeList resolves
  useEffect(() => {
    if (nextNodeList.length === 0) return;
    setValue(`${nodeKey}.selectedNodeDetails`, nextNodeList[0]);
  }, [nextNodeList]);

  // Fetch regional office list
  const { data: roData, isLoading: roLoading } = useQuery(
    ["fetchAllRegionalOffice", selectedNodeDetails],
    async () => userManagementService.fetchAllRegionalOffice(),
    {
      ...queryClientConfig,
      enabled:
        selectedNodeDetails?.label === userRole.RO_ASO ||
        selectedNodeDetails?.label === userRole.RO_SO ||
        selectedNodeDetails?.label === userRole.RO_DD,
    }
  );

  const roList = roData?.successResponse?.map((value) => ({
    label: value.regionalOfficeName,
    value,
  })) ?? [];

  // Self assign flow — still has its own button and handler since it's a separate action
  const handleSelfAssign = async (e) => {
    e.preventDefault();
    await onSelfAssign();
  };

  if (isActionLoading) return <ActionLoader />;

  // ✅ Self assign mode
  if (listOfBit[4] === "1") {
    return (
      <div className={styles.takeActionButton}>
        <div className={sharedStyles.n1_sb_gray}>{selfAssignText}</div>
        <button
          type="button"
          className={sharedStyles.btn_small}
          onClick={handleSelfAssign}
        >
          {customActionType[4].value}
        </button>
      </div>
    );
  }

  const showRODropdown =
    (selectedNodeDetails?.label === userRole.RO_ASO ||
      selectedNodeDetails?.label === userRole.RO_SO ||
      selectedNodeDetails?.label === userRole.RO_DD) &&
    (userDetails.userRoleName === userRole.HQ_DD ||
      userDetails.userRoleName === userRole.HQ_SO ||
      userDetails.userRoleName === userRole.TC_DD ||
      userDetails.userRoleName === userRole.TC_DIR);

  const showNextAssignee =
    selectedNodeDetails?.value?.assigningMode === assigningMode.DEFAULT;

  const showNodeDropdown = nextNodeList.length > 1;
  const showAssigneeRow = showNodeDropdown || selectedNodeDetails?.value?.assigningMode === assigningMode.DEFAULT;

  return (
    <div className={styles.form}>
      {/* ✅ Radio group — status */}
      <div className={styles.formButtonsDiv}>
        <div className={styles.radioGroup}>
          <Controller
            name={`${nodeKey}.status`}
            control={control}
            defaultValue=""
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                name="Take Action"
                options={radioOptions}
                onChange={(value) => {
                  field.onChange(value);
                  setActionType(value);
                  // Reset dependent fields when action changes
                  setValue(
                    `${nodeKey}.selectedNodeDetails`,
                    value === "APPROVE" ? nextNodeList[0] : []
                  );
                  setValue(`${nodeKey}.nextAssignee`, "");
                }}
              />
            )}
          />
        </div>
      </div>

      <div className={styles.cardComponents}>
        {/* ✅ Next assignee section */}
        {NextAssigneeComponent() ?? (
          <>
            {showAssigneeRow && (
              <div className={styles.row}>
                {/* Next Role dropdown */}
                {showNodeDropdown && (
                  <Controller
                    name={`${nodeKey}.selectedNodeDetails`}
                    control={control}
                    defaultValue={[]}
                    render={({ field, fieldState }) => (
                      <Dropdown
                        label="Next Role"
                        menuPosition="absolute"
                        required={true}
                        value={field.value}
                        error={fieldState.error?.message}
                        helperText={fieldState.error?.message}
                        dropdownList={nextNodeList}
                        onChange={(val) => {
                          field.onChange(val);
                          setValue(`${nodeKey}.nextAssignee`, "");
                          setValue(`${nodeKey}.regionalOffice`, "");
                        }}
                      />
                    )}
                    rules={{ required: "Please select next role" }}
                  />
                )}

                {/* Regional Office dropdown */}
                {showRODropdown && (
                  <Controller
                    name={`${nodeKey}.regionalOffice`}
                    control={control}
                    defaultValue=""
                    render={({ field, fieldState }) => (
                      <Dropdown
                        label="Regional Office"
                        menuPosition="absolute"
                        isLoading={roLoading}
                        required={true}
                        value={field.value}
                        error={fieldState.error?.message}
                        helperText={fieldState.error?.message}
                        dropdownList={roList}
                        onChange={field.onChange}
                      />
                    )}
                    rules={{ required: "Please select regional office" }}
                  />
                )}

                {/* Next Assignee dropdown */}
                {showNextAssignee && (
                  <Controller
                    name={`${nodeKey}.nextAssignee`}
                    control={control}
                    defaultValue=""
                    render={({ field, fieldState }) => (
                      <Dropdown
                        label={`Next Assignee${
                          selectedNodeDetails?.value?.nodeRole
                            ? ` (${selectedNodeDetails.value.nodeRole})`
                            : ""
                        }`}
                        menuPosition="absolute"
                        required={true}
                        value={field.value}
                        error={fieldState.error?.message}
                        helperText={fieldState.error?.message}
                        dropdownList={nextAssigneeList}
                        onChange={field.onChange}
                      />
                    )}
                    rules={{ required: "Please select next assignee" }}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* ✅ File upload + comments */}
        <div className={styles.takeAction}>
          {UploadFileComponent() ?? (
            <div className={styles.uploadFiles}>
              <Controller
                name={`${nodeKey}.uploadedFiles`}
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <FileUpload
                    maxFileSize={5}
                    required={false}
                    label={
                      consentDocuments
                        ? "Supporting Documents/Consent Documents"
                        : "Supporting Documents"
                    }
                    isMultiple={true}
                    uploadedFiles={field.value}
                    setUploadedFiles={field.onChange}
                    otherUserDocs={[]}
                  />
                )}
              />
              <PreviousFile
                previousFiles={previousFiles}
                setPreviousFiles={setPreviousFiles}
                heading={
                  consentDocuments
                    ? "Previous Uploaded Supporting Documents/Consent Documents"
                    : "Previous Uploaded Supporting Documents"
                }
              />
            </div>
          )}

          {CommentComponent() ?? (
            <Controller
              name={`${nodeKey}.comments`}
              control={control}
              defaultValue=""
              rules={{
                required: "Comments are required",
                maxLength: { value: 1000, message: "Maximum 1000 characters" },
              }}
              render={({ field, fieldState }) => (
                <TextArea
                  label="Comments"
                  placeholder="Please enter Feedback / Comments(maximum 1000 characters)"
                  value={field.value}
                  error={fieldState.error?.message}
                  rows={6}
                  cols={80}
                  maxLength={1000}
                  required={true}
                  helperText={fieldState.error?.message}
                  name="workflow_comment"
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          )}
        </div>
      </div>

      <div className={`${sharedStyles.my_20} ${styles.hr}`} />
      {/* ✅ No submit button here — outer form's submit handles everything */}
    </div>
  );
};

export default TakeAction;
