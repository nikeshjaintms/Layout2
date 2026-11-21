import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getSubscriptions,
  getSubscription,
  getSubscriptionUsers,
  createSubscription as apiCreateSubscription,
  assignOfflineSubscription as apiAssignOfflineSubscription,
  updateSubscription as apiUpdateSubscription,
  deleteSubscription as apiDeleteSubscription,
  getMySubscription,
  updateSubscriptionStatus,
  extendSubscription,
  getSubscriptionPackages,
  createSubscriptionPackage as apiCreateSubscriptionPackage,
  updateSubscriptionPackage as apiUpdateSubscriptionPackage,
  deleteSubscriptionPackage as apiDeleteSubscriptionPackage,
} from '@/lib/api';

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

export const fetchSubscriptionById = createAsyncThunk(
  'subscriptions/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await getSubscription(id);
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const fetchSubscriptionUsers = createAsyncThunk(
  'subscriptions/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await getSubscriptionUsers();
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const createSubscription = createAsyncThunk(
  'subscriptions/create',
  async (data, { rejectWithValue }) => {
    try {
      return await apiCreateSubscription(data);
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const assignOfflineSubscription = createAsyncThunk(
  'subscriptions/assignOffline',
  async (data, { rejectWithValue }) => {
    try {
      return await apiAssignOfflineSubscription(data);
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const updateSubscription = createAsyncThunk(
  'subscriptions/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await apiUpdateSubscription(id, data);
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const deleteSubscription = createAsyncThunk(
  'subscriptions/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiDeleteSubscription(id);
      return id;
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

export const fetchSubscriptionPackages = createAsyncThunk(
  'subscriptions/fetchPackages',
  async (_, { rejectWithValue }) => {
    try {
      return await getSubscriptionPackages();
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const createPackage = createAsyncThunk(
  'subscriptions/createPackage',
  async (data, { rejectWithValue }) => {
    try {
      return await apiCreateSubscriptionPackage(data);
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const updatePackage = createAsyncThunk(
  'subscriptions/updatePackage',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await apiUpdateSubscriptionPackage(id, data);
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const deletePackage = createAsyncThunk(
  'subscriptions/deletePackage',
  async (id, { rejectWithValue }) => {
    try {
      await apiDeleteSubscriptionPackage(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

const initialState = {
  items: [],
  selectedSubscription: null,
  users: [],
  packages: [],
  packagesLoading: false,
  loading: false,
  actionLoading: false,
  error: null,
  mySubscription: null,
};

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    clearSelectedSubscription: (state) => {
      state.selectedSubscription = null;
    },
    clearSubscriptionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
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

      // fetchById (SHOW)
      .addCase(fetchSubscriptionById.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionById.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedSubscription = action.payload;
      })
      .addCase(fetchSubscriptionById.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // fetchUsers
      .addCase(fetchSubscriptionUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })

      // create
      .addCase(createSubscription.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.items.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // assignOfflineSubscription
      .addCase(assignOfflineSubscription.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(assignOfflineSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.items.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(assignOfflineSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // update
      .addCase(updateSubscription.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.items.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
        if (state.selectedSubscription?.id === action.payload.id) {
          state.selectedSubscription = { ...state.selectedSubscription, ...action.payload };
        }
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // delete
      .addCase(deleteSubscription.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload);
        if (state.selectedSubscription?.id === action.payload) {
          state.selectedSubscription = null;
        }
      })

      // mySubscription
      .addCase(fetchMySubscription.fulfilled, (state, action) => {
        state.mySubscription = action.payload;
      })

      // modifyStatus
      .addCase(modifySubscriptionStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
        if (state.selectedSubscription?.id === action.payload.id) {
          state.selectedSubscription = { ...state.selectedSubscription, ...action.payload };
        }
      })

      // prolong
      .addCase(prolongSubscription.fulfilled, (state, action) => {
        const index = state.items.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
        if (state.selectedSubscription?.id === action.payload.id) {
          state.selectedSubscription = { ...state.selectedSubscription, ...action.payload };
        }
      })

      // Packages
      .addCase(fetchSubscriptionPackages.pending, (state) => {
        state.packagesLoading = true;
      })
      .addCase(fetchSubscriptionPackages.fulfilled, (state, action) => {
        state.packagesLoading = false;
        state.packages = action.payload;
      })
      .addCase(fetchSubscriptionPackages.rejected, (state, action) => {
        state.packagesLoading = false;
        state.error = action.payload;
      })
      .addCase(createPackage.fulfilled, (state, action) => {
        state.packages.push(action.payload);
      })
      .addCase(updatePackage.fulfilled, (state, action) => {
        const index = state.packages.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.packages[index] = action.payload;
        }
      })
      .addCase(deletePackage.fulfilled, (state, action) => {
        state.packages = state.packages.filter((p) => p.id !== action.payload);
      });
  },
});

export const { clearSelectedSubscription, clearSubscriptionError } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;
