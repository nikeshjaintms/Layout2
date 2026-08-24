import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authFetch } from '@/lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const fetchGallery = createAsyncThunk(
  'projectGallery/fetchGallery',
  async ({ projectId, page = 1, limit = 10, search = '', pagination = true }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        pagination: pagination.toString()
      });
      if (search) queryParams.append('search', search);

      const response = await authFetch(`/api/projects/${projectId}/gallery?${queryParams.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch gallery');
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createGalleryItem = createAsyncThunk(
  'projectGallery/createGalleryItem',
  async ({ projectId, formData }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`/api/projects/${projectId}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create gallery item');
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateGalleryItem = createAsyncThunk(
  'projectGallery/updateGalleryItem',
  async ({ projectId, id, formData }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`/api/projects/${projectId}/gallery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update gallery item');
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteGalleryItem = createAsyncThunk(
  'projectGallery/deleteGalleryItem',
  async ({ projectId, id }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`/api/projects/${projectId}/gallery/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete gallery item');
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadGalleryImage = createAsyncThunk(
  'projectGallery/uploadImage',
  async ({ projectId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await authFetch(`/api/projects/${projectId}/gallery/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to upload image');
      return data.imageUrl;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const projectGallerySlice = createSlice({
  name: 'projectGallery',
  initialState: {
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Gallery
      .addCase(fetchGallery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGallery.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 10;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchGallery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Gallery Item
      .addCase(createGalleryItem.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      // Update Gallery Item
      .addCase(updateGalleryItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete Gallery Item
      .addCase(deleteGalleryItem.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
        state.total -= 1;
      });
  },
});

export default projectGallerySlice.reducer;
