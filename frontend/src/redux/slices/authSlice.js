import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '@/lib/api';

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.loginUser(email, password);
      // Backend now returns { user } and sets HttpOnly cookie
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Invalid email or password.');
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getProfile();
      return response;
    } catch (error) {
      return rejectWithValue('No session found');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch }) => {
    try {
      await api.logoutUser();
    } catch (e) {
      // ignore
    }
    dispatch(logout());
  }
);

const initialState = {
  user: null,
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload;
      })
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.status = 'unauthenticated';
      });
  }
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;
