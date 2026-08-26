import { configureStore } from '@reduxjs/toolkit';
import projectReducer from './slices/projectsSlice';
import conversionsReducer from './slices/conversionsSlice';
import plotsReducer from './slices/plotsSlice';
import amenitiesReducer from './slices/amenitiesSlice';
import plotStatusesReducer from './slices/plotStatusesSlice';
import appearanceReducer from './slices/appearanceSlice';
import projectGalleryReducer from './slices/projectGallerySlice';
import projectDetailsReducer from './slices/projectDetailsSlice';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import subscriptionsReducer from './slices/subscriptionsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    projects: projectReducer,
    conversions: conversionsReducer,
    plots: plotsReducer,
    amenities: amenitiesReducer,
    plotStatuses: plotStatusesReducer,
    appearance: appearanceReducer,
    projectGallery: projectGalleryReducer,
    projectDetails: projectDetailsReducer,
    subscriptions: subscriptionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Useful for large nested JSON or file data sometimes
    }),
});
