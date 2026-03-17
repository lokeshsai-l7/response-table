import React, { useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";

const s = {
  section: {
    marginTop: 32,
    fontFamily: "'Segoe UI', sans-serif",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  // Workflow metadata bar
  metaBar: {
    display: "flex",
    gap: 48,
    padding: "16px 0",
    borderBottom: "1px solid #e8e8f0",
    marginBottom: 24,
  },
  metaItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: 400,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  statusBadge: (color) => ({
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    background:
      color === "amber" ? "#fff3e0" : color === "green" ? "#e8f5e9" : "#f3f0ff",
    color:
      color === "amber" ? "#e65100" : color === "green" ? "#2e7d32" : "#4a3fcc",
    border: `1px solid ${color === "amber" ? "#ffcc80" : color === "green" ? "#a5d6a7" : "#c5b8f8"}`,
  }),
  // Timeline
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  timelineRow: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },
  avatarCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: 40,
    flexShrink: 0,
  },
  avatar: (color) => ({
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  }),
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    background: "#e0e0e0",
    margin: "4px 0",
  },
  card: {
    flex: 1,
    border: "1px solid #e8e8f0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  cardHeader: {
    display: "flex",
    gap: 40,
    padding: "12px 20px",
    background: "#eeeef7",
    borderBottom: "1px solid #ddddf0",
  },
  cardHeaderItem: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  cardHeaderLabel: {
    fontSize: 11,
    color: "#888",
  },
  cardHeaderValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  cardHeaderSub: {
    fontSize: 12,
    color: "#888",
    fontWeight: 400,
  },
  cardBody: {
    padding: 20,
    background: "#fff",
    display: "flex",
    gap: 24,
  },
  // Fields
  fieldGroup: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "#333",
    marginBottom: 4,
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    border: "1px solid #d0d0e0",
    borderRadius: 6,
    padding: "10px 14px",
    fontSize: 13,
    color: "#333",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    border: "1px solid #d0d0e0",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 13,
    color: "#333",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  // File upload
  uploadBox: {
    flex: 1,
    border: "1px solid #d0d0e0",
    borderRadius: 8,
    padding: "24px 16px",
    textAlign: "center",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
  },
  uploadOr: {
    fontSize: 12,
    color: "#999",
  },
  browseBtn: {
    background: "#2d2d6b",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "8px 24px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  uploadHint: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 4,
  },
  // Action buttons
  actionRow: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: (active) => ({
    padding: "8px 20px",
    borderRadius: 6,
    border: active ? "2px solid #3f3fcc" : "1px solid #d0d0d0",
    background: active ? "#f0f0ff" : "#fff",
    color: active ? "#3f3fcc" : "#555",
    fontWeight: active ? 600 : 400,
    fontSize: 13,
    cursor: "pointer",
    textTransform: "capitalize",
    transition: "all 0.15s",
  }),
  // Bottom buttons
  bottomBar: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 32,
    paddingTop: 20,
    borderTop: "1px solid #e8e8f0",
  },
  cancelBtn: {
    padding: "10px 32px",
    border: "1px solid #d0d0d0",
    borderRadius: 8,
    background: "#fff",
    color: "#333",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  submitBtn: {
    padding: "10px 32px",
    border: "none",
    borderRadius: 8,
    background: "#1a1a4e",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

// Mock workflow history data (in real app this comes from props/API)
const workflowHistory = [
  {
    initials: "PH",
    avatarColor: "#e8a87c",
    role: "Verified by (RO-SO)",
    name: "Prasanna Hiremanth",
    id: "45646180",
    receivedOn: "04/01/2026 | 20:25:24",
    completedOn: "-",
    status: "Pending",
    statusColor: "amber",
    isActive: true, // show fields inside this card
  },
  {
    initials: "SS",
    avatarColor: "#81c784",
    role: "Created by (RO-SO)",
    name: "Sudhakar S",
    id: "12345678",
    createdOn: "03/01/2026 | 17:05:24",
    status: "Initiated",
    statusColor: "green",
    isActive: false,
  },
];

const FileUpload = () => {
  const fileRef = useRef();
  return (
    <div style={s.uploadBox}>
      <div style={s.uploadTitle}>Drag and Drop files here</div>
      <div style={s.uploadOr}>or</div>
      <button
        type="button"
        style={s.browseBtn}
        onClick={() => fileRef.current?.click()}
      >
        Browse files
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        style={{ display: "none" }}
      />
      <div style={s.uploadHint}>
        Supported file format: JPEG, PNG and PDF &nbsp;&nbsp; Maximum file size
        is 5 MB.
      </div>
    </div>
  );
};

const WorkflowActions = ({ config }) => {
  const { register, setValue, control } = useFormContext();

  const selectedAction = useWatch({ control, name: "workflow.action" });
  const fields = config.fieldsByAction[selectedAction] || [];

  return (
    <div style={s.section}>
      {/* Section title */}
      <div style={s.sectionTitle}>
        <span style={{ fontSize: 18 }}>↗</span> Workflow details
      </div>

      {/* Workflow metadata */}
      <div style={s.metaBar}>
        <div style={s.metaItem}>
          <span style={s.metaLabel}>Workflow ID</span>
          <span style={s.metaValue}>MIS-1234567890-1-1</span>
        </div>
        <div style={s.metaItem}>
          <span style={s.metaLabel}>Created on</span>
          <span style={s.metaValue}>03/01/2026 | 17:05:24</span>
        </div>
        <div style={s.metaItem}>
          <span style={s.metaLabel}>Completed on</span>
          <span style={s.metaValue}>-</span>
        </div>
        <div style={s.metaItem}>
          <span style={s.metaLabel}>Elapsed time</span>
          <span style={s.metaValue}>5 days 3 hrs 20 min</span>
        </div>
        <div style={s.metaItem}>
          <span style={s.metaLabel}>Status</span>
          <span style={s.statusBadge("amber")}>Pending</span>
        </div>
      </div>

      {/* Action selector */}
      <div style={s.actionRow}>
        {config.actions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => setValue("workflow.action", action)}
            style={s.actionBtn(selectedAction === action)}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={s.timeline}>
        {workflowHistory.map((entry, i) => (
          <div key={i} style={s.timelineRow}>
            {/* Avatar + line */}
            <div style={s.avatarCol}>
              <div style={s.avatar(entry.avatarColor)}>{entry.initials}</div>
              {i < workflowHistory.length - 1 && <div style={s.timelineLine} />}
            </div>

            {/* Card */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <div style={s.cardHeaderItem}>
                  <span style={s.cardHeaderLabel}>{entry.role}</span>
                  <span style={s.cardHeaderValue}>
                    {entry.name}{" "}
                    <span style={s.cardHeaderSub}>({entry.id})</span>
                  </span>
                </div>
                <div style={s.cardHeaderItem}>
                  <span style={s.cardHeaderLabel}>
                    {entry.createdOn ? "Created on" : "Received on"}
                  </span>
                  <span style={s.cardHeaderValue}>
                    {entry.receivedOn || entry.createdOn}
                  </span>
                </div>
                {!entry.createdOn && (
                  <div style={s.cardHeaderItem}>
                    <span style={s.cardHeaderLabel}>Completed on</span>
                    <span style={s.cardHeaderValue}>{entry.completedOn}</span>
                  </div>
                )}
                <div style={{ ...s.cardHeaderItem, marginLeft: "auto" }}>
                  <span style={s.cardHeaderLabel}>Status</span>
                  <span style={s.statusBadge(entry.statusColor)}>
                    {entry.status}
                  </span>
                </div>
              </div>

              {/* Active card: show dynamic fields + file upload */}
              {entry.isActive && selectedAction && (
                <div style={s.cardBody}>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    {fields.map((field) => {
                      const name = `workflow.${field.name}`;
                      return (
                        <div key={field.name} style={s.fieldGroup}>
                          <label style={s.fieldLabel}>{field.label}</label>
                          {field.type === "textarea" ? (
                            <textarea
                              {...register(name)}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              style={s.textarea}
                            />
                          ) : (
                            <textarea
                              {...register(name)}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              style={s.textarea}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <FileUpload />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div style={s.bottomBar}>
        <button type="button" style={s.cancelBtn}>
          Cancel
        </button>
        <button type="submit" style={s.submitBtn}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default WorkflowActions;
