import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: sessionStorage.getItem("studystudent_token"),
    ready: false,
  },
  reducers: {
    setSession(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.ready = true;
      sessionStorage.setItem("studystudent_token", action.payload.token);
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    finishAuthCheck(state) {
      state.ready = true;
    },
    clearSession(state) {
      state.user = null;
      state.token = null;
      state.ready = true;
      sessionStorage.removeItem("studystudent_token");
    },
  },
});

export const { setSession, setUser, finishAuthCheck, clearSession } = authSlice.actions;
export default authSlice.reducer;
