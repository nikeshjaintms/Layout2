import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authFetch } from '@/lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const fetchProjectDetails = createAsyncThunk(
  'projectDetails/fetchProjectDetails',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await authFetch(`/cad-projects/${projectId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch project details');
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProjectDetails = createAsyncThunk(
  'projectDetails/updateProjectDetails',
  async ({ projectId, formData }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`/cad-projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update project details');
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadProjectLogo = createAsyncThunk(
  'projectDetails/uploadProjectLogo',
  async ({ projectId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await authFetch(`/cad-projects/${projectId}/logo`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to upload logo');
      return data.logoUrl;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteProjectDetails = createAsyncThunk(
  'projectDetails/deleteProjectDetails',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await authFetch(`/cad-projects/${projectId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete project');
      return projectId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const projectDetailsSlice = createSlice({
  name: 'projectDetails',
  initialState: {
    data: null,
    loading: false,
    error: null,
    saving: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProjectDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProjectDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateProjectDetails.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateProjectDetails.fulfilled, (state, action) => {
        state.saving = false;
        state.data = action.payload;
      })
      .addCase(updateProjectDetails.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      // Upload Logo
      .addCase(uploadProjectLogo.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(uploadProjectLogo.fulfilled, (state, action) => {
        state.saving = false;
        if (state.data) {
          state.data.logoUrl = action.payload;
        }
      })
      .addCase(uploadProjectLogo.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      // Delete Project
      .addCase(deleteProjectDetails.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteProjectDetails.fulfilled, (state) => {
        state.saving = false;
        state.data = null;
      })
      .addCase(deleteProjectDetails.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export default projectDetailsSlice.reducer;
