import { createTheme } from "@mui/material/styles";

const lightTheme = createTheme({
  typography: {
    fontFamily: ['"Product Sans"', 'sans-serif'].join(','),
  },

  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-input": {
            color: "#1e293b",
          },

          "& .MuiInputLabel-root": {
            color: "#64748b",
          },

          "& .MuiInputLabel-root.Mui-focused": {
            color: "#0b5299",
          },

          "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            background: "#f8fafc",

            "& fieldset": {
              borderColor: "#e2e8f0",
            },

            "&:hover fieldset": {
              borderColor: "#0b5299",
            },

            "&.Mui-focused fieldset": {
              borderColor: "#0b5299",
            },
          },
        },
      },
    },

    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#94a3b8",
          "&.Mui-checked": {
            color: "#0b5299",
          },
        },
      },
    },

    MuiTypography: {
      styleOverrides: {
        root: {
          color: "#1e293b",
        },
      },
    },
    "& .MuiOutlinedInput-root": {
  background: "#ffffff",
  borderRadius: "10px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",

  "&.Mui-focused": {
    boxShadow: "0 0 0 2px rgba(11,82,153,0.15)",
  },
}
  },
});

export default lightTheme;