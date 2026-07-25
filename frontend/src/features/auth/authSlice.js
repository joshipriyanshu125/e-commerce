import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    loginSuccess: (state, action) => {
      const { user, token } = action.payload;

      state.loading = false;
      state.error = null;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },

    registerSuccess: (state, action) => {
      const { user, token } = action.payload;

      state.loading = false;
      state.error = null;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },

    setLoading: (state) => {
      state.loading = true;
      state.error = null;
    },

    setError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginSuccess,
  registerSuccess,
  logout,
  setLoading,
  setError,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;