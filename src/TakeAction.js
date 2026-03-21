import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import styles from "./TakeAction.module.scss";
import { useQuery, useQueryClient } from "react-query";
import {
  Dropdown,
  TextArea,
  FileUpload,
  RadioGroup,
} from "host/reusableComponents";
import PreviousFile, {
  deleteFile,
} from "../../../components/PreviousFiles/PreviousFile";
import { action, actionType } from "../../../constants/enums/actionType";
import { validate } from "../../../utils/validate";
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

const TakeAction = ({
  isActionLoading = false,
  actionWorkflowId,
  currentNodeDetails = null,
  buttonLabel = "Submit",
  customActionType = actionType,
  previousFiles,
  setPreviousFiles = () => {},
  NextAssigneeComponent = () => null,
  CommentComponent = () => null,
  UploadFileComponent = () => null,
  SubmitComponent = () => null,
  setActionType = () => {},
  onTakeAction = async () => {},
  requestInitiatedBy = null,
  filterNextNodes = null,
  customActionBit = null,
  requestorUserId = null,
  regionalOfficeId,
  consentDocuments,
}) => {
  const [loading, setLoading] = useState(false);
  const userDetails = useSelector((state) => state.userPerm.userPermissionData);
  const queryClient = useQueryClient();
  const [roList, setRoList] = useState([]);
  const [formState, setFormState] = useState({
    formValid: true,
    radioOptions: [],
    comments: {
      value: "",
      error: "",
    },
    status: {
      value: "",
      error: "",
    },
    nextAssignee: {
      value: "",
      error: "",
    },
    regionalOffice: {
      value: "",
      error: "",
    },
    uploadedFiles: [],
    selectedNodeDetails: {
      value: [],
      error: "",
    },
  });

  const { noOfActiveBits, firstActiveBit, listOfBit, nextNodeList } =
    useFetchActionBit(
      formState.status.value,
      currentNodeDetails,
      actionWorkflowId,
      requestInitiatedBy,
      filterNextNodes,
      customActionBit
    );
  const nextAssigneeList = useFetchNextAssignee(
    formState?.selectedNodeDetails?.value?.value?.assigningMode,
    formState?.selectedNodeDetails?.value?.value?.nodeRole,
    requestorUserId,
    regionalOfficeId ?? formState.regionalOffice?.value?.value?.id
  );

  useEffect(() => {
    if (nextNodeList.length === 0) return;
    setFormState((formState) => ({
      ...formState,
      selectedNodeDetails: {
        value: nextNodeList[0],
        error: "",
      },
    }));
  }, [nextNodeList]);

  useEffect(() => {
    if (firstActiveBit === -1) return;
    setFormState((formState) => ({
      ...formState,
      status: {
        value: action[customActionType[firstActiveBit].key],
        error: "",
      },
    }));
    setActionType(action[customActionType[firstActiveBit].key]);
  }, [firstActiveBit]);

  useEffect(() => {
    handleTakeActionOptions();
  }, [noOfActiveBits, listOfBit]);

  const handleRadioChange = (value) => {
    setFormState((formState) => ({
      ...formState,
      status: { value: value, error: "" },

      selectedNodeDetails: {
        value: [],
        error: "",
      },
      nextAssignee: {
        value: "",
        error: "",
      },
    }));
    setActionType(value);
    if (value == "APPROVE") {
      setFormState((formState) => ({
        ...formState,
        selectedNodeDetails: {
          value: nextNodeList[0],
          error: "",
        },
      }));
    }
  };

  const handleTakeActionOptions = () => {
    var tempMap = [];
    listOfBit.map((value, index) => {
      if (value == "1" && index < customActionType.length) {
        tempMap.push({
          label: customActionType[index].value,
          value: customActionType[index].key,
        });
      }
    });
    setFormState((formState) => ({
      ...formState,
      radioOptions: tempMap,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    await onTakeAction(formState);
    setFormState((formState) => {
      return {
        ...formState,
        formValid: validate.comment(formState.comments.value) == "",
        nextAssignee: {
          value: formState.nextAssignee?.value,
          error: validate.dropdown(formState.nextAssignee?.value?.value),
        },
        comments: {
          value: formState.comments?.value,
          error: validate.comment(formState.comments?.value),
        },
      };
    });
    setLoading(false);
  };

  const handleSelfAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onTakeAction(formState);
    queryClient.invalidateQueries("FetchGrievance");
    setLoading(false);
  };
  const { data: data, isLoading: isLoading } = useQuery(
    ["fetchAllRegionalOffice", formState.selectedNodeDetails?.value],
    async () => {
      const response = await userManagementService.fetchAllRegionalOffice();
      return response;
    },
    {
      ...queryClientConfig,
      enabled:
        formState?.selectedNodeDetails?.value?.label == userRole.RO_ASO ||
        formState?.selectedNodeDetails?.value?.label == userRole.RO_SO ||
        formState?.selectedNodeDetails?.value?.label == userRole.RO_DD,
    }
  );
  useEffect(() => {
    if (typeof data != "undefined") {
      const list = [];
      data?.successResponse.map((value) => {
        list.push({
          label: value?.regionalOfficeName,
          value: value,
        });
      });
      setRoList(list);
    }
  }, [data]);

  if (isActionLoading) {
    return <ActionLoader />;
  }

  return listOfBit[4] == "1" ? (
    <div className={styles.takeActionButton}>
      <div className={sharedStyles.n1_sb_gray}>{selfAssignText}</div>
      <button
        type={"button"}
        className={sharedStyles.btn_small}
        onClick={handleSelfAssign}
        disabled={loading}
      >
        {customActionType[4].value}
      </button>
    </div>
  ) : (
    <div className={styles.form}>
      <div className={styles.formButtonsDiv}>
        {/* {noOfActiveBits != 1 && ( */}
        <div className={styles.radioGroup}>
          <RadioGroup
            value={formState.status.value}
            name={"Take Action"}
            onChange={handleRadioChange}
            options={formState.radioOptions}
          />
        </div>
        {/* )} */}
      </div>
      {listOfBit[4] != "1" && (
        <div className={styles.cardComponents}>
          {NextAssigneeComponent() ?? (
            <>
              {(nextNodeList.length > 1 ||
                formState.selectedNodeDetails?.value?.value?.assigningMode ==
                  assigningMode.DEFAULT) && (
                <div className={styles.row}>
                  {nextNodeList.length > 1 && (
                    <Dropdown
                      label="Next Role"
                      helperText={formState.selectedNodeDetails.error}
                      menuPosition={"absolute"}
                      error={formState.selectedNodeDetails.error}
                      value={formState.selectedNodeDetails.value}
                      required={true}
                      dropdownList={nextNodeList}
                      onChange={(selectedValue) => {
                        setFormState((formState) => ({
                          ...formState,
                          selectedNodeDetails: {
                            value: selectedValue,
                            error: "",
                          },
                        }));
                      }}
                    />
                  )}
                  {(formState?.selectedNodeDetails?.value?.label ==
                    userRole.RO_ASO ||
                    formState?.selectedNodeDetails?.value?.label ==
                      userRole.RO_SO ||
                    formState?.selectedNodeDetails?.value?.label ==
                      userRole.RO_DD) &&
                    (userDetails.userRoleName == userRole.HQ_DD ||
                      userDetails.userRoleName == userRole.HQ_SO ||
                      userDetails.userRoleName == userRole.TC_DD ||
                      userDetails.userRoleName == userRole.TC_DIR) && (
                      <Dropdown
                        label={"Regional Office"}
                        menuPosition={"absolute"}
                        isLoading={isLoading}
                        value={formState.regionalOffice.value}
                        error={formState.regionalOffice.error}
                        required={true}
                        helperText={formState.regionalOffice.error}
                        dropdownList={roList}
                        onChange={(selectedValue) => {
                          setFormState((formState) => ({
                            ...formState,
                            regionalOffice: {
                              value: selectedValue,
                              error: "",
                            },
                          }));
                        }}
                      />
                    )}
                  {formState?.selectedNodeDetails?.value?.value
                    ?.assigningMode == assigningMode.DEFAULT && (
                    <Dropdown
                      label={`Next Assignee${
                        formState?.selectedNodeDetails?.value?.value.nodeRole
                          ? " (" +
                            formState?.selectedNodeDetails?.value?.value
                              .nodeRole +
                            ")"
                          : ""
                      }`}
                      helperText={formState.nextAssignee.error}
                      menuPosition={"absolute"}
                      value={formState?.nextAssignee.value}
                      error={formState.nextAssignee.error}
                      required={true}
                      dropdownList={nextAssigneeList}
                      onChange={(selectedValue) => {
                        setFormState((formState) => ({
                          ...formState,
                          nextAssignee: {
                            value: selectedValue,
                            error: "",
                          },
                        }));
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}
          <div className={styles.takeAction}>
            {UploadFileComponent() ?? (
              <div className={styles.uploadFiles}>
                <FileUpload
                  maxFileSize={5}
                  required={false}
                  label={
                    consentDocuments
                      ? "Supporting Documents/Consent Documents"
                      : "Supporting Documents"
                  }
                  isMultiple={true}
                  uploadedFiles={formState.uploadedFiles}
                  setUploadedFiles={(file) => {
                    setFormState((formState) => ({
                      ...formState,
                      uploadedFiles: file,
                    }));
                  }}
                  otherUserDocs={[]}
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
              <TextArea
                label="Comments"
                placeholder="Please enter Feedback / Comments(maximum 1000 characters)"
                value={formState.comments.value}
                error={formState.comments.error}
                rows={6}
                cols={80}
                maxLength={1000}
                required={true}
                helperText={formState.comments.error}
                name="workflow_comment"
                onInvalid={(e) =>
                  e.target.setCustomValidity(formState.comments.error)
                }
                onChange={(e) => {
                  setFormState({
                    ...formState,
                    formValid: validate.comment(e.target.value, 1000) == "",
                    comments: {
                      value: e.target.value,
                      error: validate.comment(e.target.value, 1000),
                    },
                  });
                  e.target.setCustomValidity("");
                }}
              />
            )}
          </div>
        </div>
      )}
      <div className={`${sharedStyles.my_20} ${styles.hr}`} />
      {SubmitComponent() ?? (
        <div className={styles.formButton}>
          <button
            disabled={loading}
            type="submit"
            className={sharedStyles.btn_primary}
            onClick={handleSubmit}
          >
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default TakeAction;


import { useContext, useEffect, useState } from "react";
import { action } from "../../../../constants/enums/actionType";
import { workflow } from "../../../../services/workflow";
import { workflowContext } from "../../../../contexts/workflowContext";
import { subCaseTypes } from "../../../../constants/enums/subCaseTypes";
import { toast } from "react-toastify";

export const useFetchActionBit = (
  status,
  currentNodeDetails,
  workflowId,
  requestInitiatedBy,
  filterNextNodes,
  customActionBit
) => {
  const [nextNodeDetails, setNextNodeDetails] = useState([]);
  const [nextNodeList, setNextNodeList] = useState([]);
  const [listOfBit, setListOfBit] = useState([]);
  const [firstActiveBit, setFirstActiveBit] = useState(-1);
  const [noOfActiveBits, setNoOfActiveBits] = useState(0);
  const { qualifiedFor } = useContext(workflowContext);

  useEffect(() => {
    if (currentNodeDetails != null) {
      if (currentNodeDetails.error) {
        toast.error(currentNodeDetails.errorMessage);
      } else {
        const response = currentNodeDetails.successResponse?.responseData;

        const listOfBit =
          customActionBit?.split("") ?? response.actionBitIndicator?.split("");
        setListOfBit(listOfBit);
        handleFetchNextNodeDetails(listOfBit);
      }
    } else {
      if (customActionBit) {
        const listOfBit = customActionBit?.split("");
        setListOfBit(listOfBit);
        handleFetchNextNodeDetails(listOfBit);
      } else {
        workflow.currentNodeDetails(workflowId).then((currentNodeDetails) => {
          if (currentNodeDetails.error) {
            toast.error(currentNodeDetails.errorMessage);
          } else {
            const response = currentNodeDetails.successResponse?.responseData;
            const listOfBit = response.actionBitIndicator?.split("");
            setListOfBit(listOfBit);
            handleFetchNextNodeDetails(listOfBit);
          }
        });
      }
    }
  }, [currentNodeDetails, customActionBit]);

  useEffect(() => {
    if (nextNodeDetails.length != 0) {
      let nextNodeList = [];
      switch (qualifiedFor) {
        case subCaseTypes.DECEASED:
          switch (status) {
            case action.APPROVE:
            case action.REJECT:
              nextNodeDetails.nextNodes.map((node) => {
                if (
                  !(
                    node.nodeDesc.includes("INTIATOR") &&
                    requestInitiatedBy &&
                    node.nodeRole != requestInitiatedBy
                  )
                )
                  if (
                    !(
                      filterNextNodes &&
                      !filterNextNodes.includes(node.nodeIndex)
                    )
                  )
                    nextNodeList.push({
                      value: node,
                      label: node.nodeDesc,
                    });
              });
              break;
          }
          break;
        default:
          switch (status) {
            case action.APPROVE:
              nextNodeDetails.nextNodes.map((node) => {
                if (
                  !(
                    node.nodeDesc.includes("INTIATOR") &&
                    requestInitiatedBy &&
                    node.nodeRole != requestInitiatedBy
                  )
                )
                  if (
                    !(
                      filterNextNodes &&
                      !filterNextNodes.includes(node.nodeIndex)
                    )
                  )
                    nextNodeList.push({
                      value: node,
                      label: node.nodeDesc,
                    });
              });
              break;
            default:
          }
      }

      setNextNodeList(nextNodeList);
    }
  }, [nextNodeDetails, status, filterNextNodes]);

  const handleFetchNextNodeDetails = async (listOfBit) => {
    if (listOfBit[4] !== "1") {
      const nextNodeDetails = await workflow.nextNodeDetails(workflowId);
      if (nextNodeDetails.error) {
        toast.error(nextNodeDetails.errorMessage);
      } else {
        setNextNodeDetails(nextNodeDetails?.successResponse?.responseData);
      }
    }
  };

  useEffect(() => {
    let activeBits = 0;
    let firstActiveBit = -1;
    for (let i = 0; i < listOfBit.length; i++) {
      if (listOfBit[i] == "1") {
        if (firstActiveBit === -1) firstActiveBit = i;
        activeBits++;
      }
    }
    setNoOfActiveBits(activeBits);
    setFirstActiveBit(firstActiveBit);
  }, [listOfBit]);

  return {
    listOfBit,
    noOfActiveBits,
    nextNodeList,
    firstActiveBit,
  };
};


import { useQuery } from "react-query";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { queryClientConfig } from "../../../../configs/queryClientConfig";
import { userManagementService } from "../../../../services/userManagementService";
import { assigningMode } from "../../../../constants/enums/assigningMode";
import { useEffect, useState } from "react";
import { validate } from "../../../../utils/validate";

export const useFetchNextAssignee = (
  nextAssigningMode,
  nodeRole,
  requestorUserId,
  regionalOfficeId = null
) => {
  const [nextAssigneeList, setNextAssigneeList] = useState([]);
  const userPerm = useSelector((state) => state.userPerm.userPermissionData);
  const { data: assigneeData } = useQuery(
    [
      "findAllAssigneesByRoleAndRequesterId",
      nextAssigningMode,
      userPerm.userId,
      nodeRole,
      regionalOfficeId,
    ],
    async () => {
      if (nextAssigningMode == assigningMode.DEFAULT && nodeRole) {
        const response =
          await userManagementService.findAllAssigneesByRoleAndRequesterId({
            roleId: nodeRole,
            requesterId: requestorUserId ?? userPerm.userId,
            regionalOfficeId: validate.value(regionalOfficeId) && {
              id: regionalOfficeId,
            },
          });
        return response;
      }
      return null;
    },
    queryClientConfig
  );

  useEffect(() => {
    if (assigneeData) {
      if (assigneeData.error) {
        toast.error(assigneeData.errorMessage);
      } else {
        const assigneeList = [];
        assigneeData?.successResponse.map((assignee) => {
          assigneeList.push({
            value: assignee,
            label: `${assignee.name} (${assignee.id})`,
          });
        });
        setNextAssigneeList(assigneeList);
      }
    } else {
      setNextAssigneeList([]);
    }
  }, [assigneeData]);

  return nextAssigneeList;
};


.cardComponents {
  display: flex;
  padding: 0px;
  row-gap: 10px;
  flex-direction: column;
  margin-top: 10px;
}

.formButtonsDiv {
  display: flex;
}
.radioGroup {
  height: 20px;
}
.row {
  margin: 10px 0px;
  display: grid;
  gap: 20px;
  grid-template-columns: 49% 49%;
}

.takeAction {
  display: grid;
  grid-template-columns: 49% 49%;
  gap: 20px;
}
.formButton {
  display: flex;
  justify-content: end;
  align-items: center;
}

.hr {
  border-top: 1px solid #d9d9df;
}

.takeActionButton {
  border-radius: 5px;
  display: flex;
  width: inherit;
  align-items: center;
  justify-content: center;
  border: 1px solid #98a9f8;
  background: #eaeafe;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
}
