import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSubscriptions, getMySubscription, updateSubscriptionStatus, extendSubscription } from '@/lib/api';

export const fetchSubscriptions = createAsyncThunk(
  'subscriptions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await getSubscriptions();
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const fetchMySubscription = createAsyncThunk(
  'subscriptions/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      return await getMySubscription();
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const modifySubscriptionStatus = createAsyncThunk(
  'subscriptions/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await updateSubscriptionStatus(id, status);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const prolongSubscription = createAsyncThunk(
  'subscriptions/extend',
  async ({ id, durationType, durationValue }, { rejectWithValue }) => {
    try {
      const response = await extendSubscription(id, durationType, durationValue);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

const initialState = {
  items: [],
  mySubscription: null,
  loading: false,
  error: null,
};

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMySubscription.fulfilled, (state, action) => {
        state.mySubscription = action.payload;
      })
      .addCase(modifySubscriptionStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(prolongSubscription.fulfilled, (state, action) => {
        const index = state.items.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      });
  },
});

export default subscriptionsSlice.reducer;
