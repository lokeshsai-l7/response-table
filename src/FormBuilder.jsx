import React, { useReducer } from "react";
import {
  Box,
  Stack,
  TextField,
  IconButton,
  Button,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultSection = () => ({
  id: generateId(),
  title: "",
  parameters: [{ id: generateId(), value: "" }],
});

// ---------------- INITIALIZER ----------------

const initializer = (initialData, mode) => {
  if (mode === "edit" && initialData && initialData.length) {
    return initialData.map((section) => ({
      id: generateId(),
      title: section.title,
      parameters: section.parameters.map((p) => ({
        id: generateId(),
        value: p,
      })),
    }));
  }

  return [createDefaultSection()];
};

// ---------------- REDUCER ----------------

const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TITLE":
      return [...state, createDefaultSection()];

    case "DELETE_TITLE":
      if (state.length === 1) return state;
      return state.filter((s) => s.id !== action.id);

    case "UPDATE_TITLE":
      return state.map((s) =>
        s.id === action.id ? { ...s, title: action.value } : s,
      );

    case "ADD_PARAMETER":
      return state.map((s) =>
        s.id === action.sectionId
          ? {
              ...s,
              parameters: [...s.parameters, { id: generateId(), value: "" }],
            }
          : s,
      );

    case "DELETE_PARAMETER":
      return state.map((s) => {
        if (s.id !== action.sectionId) return s;
        if (s.parameters.length === 1) return s;
        return {
          ...s,
          parameters: s.parameters.filter((p) => p.id !== action.paramId),
        };
      });

    case "UPDATE_PARAMETER":
      return state.map((s) =>
        s.id === action.sectionId
          ? {
              ...s,
              parameters: s.parameters.map((p) =>
                p.id === action.paramId ? { ...p, value: action.value } : p,
              ),
            }
          : s,
      );

    default:
      return state;
  }
};

// ---------------- COMPONENT ----------------

const FormBuilder = ({ mode = "create", initialData = [], onSubmit }) => {
  const [state, dispatch] = useReducer(reducer, initializer(initialData, mode));

  const handleSubmit = () => {
    const output = state.map((section) => ({
      title: section.title.trim(),
      parameters: section.parameters.map((p) => p.value.trim()),
    }));

    console.log(output);
    onSubmit && onSubmit(output);
  };

  return (
    <>
      {" "}
      <Box width={700} mx="auto" mt={4}>
        <Stack spacing={6}>
          {state.map(
            (section) =>
              section.parameters.length > 0 && (
                <Box key={section.id} position="relative">
                  {/* TITLE ROW */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box position="relative" sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          position: "absolute",
                          left: "-30px",
                          top: "50%",
                          width: "30px",
                          height: "1.5px",
                          bgcolor: "grey.400",
                        }}
                      />
                      <TextField
                        label="Title"
                        fullWidth
                        value={section.title}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_TITLE",
                            id: section.id,
                            value: e.target.value,
                          })
                        }
                      />
                      {/*
               VERTICAL LINE:
               Starts at top: 50% (middle of Title input)
               Ends at bottom: 0 (bottom of this container)
            */}
                      <Box
                        sx={{
                          position: "absolute",
                          left: "-30px",
                          top: "50%",
                          bottom: "-52px", // Pushes the line down to the parameter area
                          width: "1.5px",
                          bgcolor: "grey.400",
                          zIndex: 0,
                        }}
                      />
                    </Box>

                    <IconButton onClick={() => dispatch({ type: "ADD_TITLE" })}>
                      <AddIcon />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        dispatch({ type: "DELETE_TITLE", id: section.id })
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>

                  {/* PARAMETERS SECTION */}
                  <Box ml={4} mt={3}>
                    {section.parameters.map((param, index) => (
                      <Stack
                        key={param.id}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mb={3}
                        sx={{ position: "relative" }}
                      >
                        {/*
                 HORIZONTAL CONNECTOR:
                 Anchored to the center-left of the parameter field
              */}
                        <Box
                          sx={{
                            position: "absolute",
                            left: "-62px",
                            top: "50%",
                            width: "70px",
                            height: "1.5px",
                            bgcolor: "grey.400",
                          }}
                        />

                        <TextField
                          label="Parameter"
                          sx={{ flexGrow: 1 }}
                          value={param.value}
                          onChange={(e) =>
                            dispatch({
                              type: "UPDATE_PARAMETER",
                              sectionId: section.id,
                              paramId: param.id,
                              value: e.target.value,
                            })
                          }
                        />

                        <TextField
                          select
                          SelectProps={{ native: true }}
                          sx={{ width: 80 }}
                        >
                          <option value="v">v</option>
                        </TextField>

                        <IconButton
                          onClick={() =>
                            dispatch({
                              type: "ADD_PARAMETER",
                              sectionId: section.id,
                            })
                          }
                        >
                          <AddIcon />
                        </IconButton>
                        <IconButton
                          onClick={() =>
                            dispatch({
                              type: "DELETE_PARAMETER",
                              sectionId: section.id,
                              paramId: param.id,
                            })
                          }
                        >
                          <DeleteIcon />
                        </IconButton>

                        {/*
                 VERTICAL EXTENSION:
                 If there's another parameter below, continue the line from the
                 center of current row to the center of the next.
              */}
                        {index < section.parameters.length - 1 && (
                          <Box
                            sx={{
                              position: "absolute",
                              left: "-70px",
                              top: "50%",
                              bottom: "-52px", // Adjust based on your 'mb' spacing
                              width: "1.5px",
                              bgcolor: "grey.400",
                            }}
                          />
                        )}
                      </Stack>
                    ))}
                  </Box>
                </Box>
              ),
          )}

          <Button variant="contained" onClick={handleSubmit}>
            Submit
          </Button>
        </Stack>
      </Box>
    </>
  );
};

export default FormBuilder;
