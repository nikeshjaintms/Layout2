export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function authFetch(path, options = {}) {
  const isFormData = typeof window !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    cache: 'no-store',
    credentials: 'include', // Automatically send cookies
    ...options,
    headers,
  });

  if (!res.ok) {
    let body;
    let message = `Request failed: ${res.status}`;
    try {
      body = await res.json();
      message = body?.message || message;
    } catch {
      // ignore JSON parse errors
    }

    const err = new Error(message);
    err.response = body;
    err.status = res.status;
    throw err;
  }


  return res;
}

export async function apiCall(path, options = {}) {
  const res = await authFetch(path, options);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function request(path, options = {}) {
  return apiCall(path, options);
}

// ─── Authentication ─────────────────────────────────────────────────────────────

export async function loginUser(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutUser() {
  return request('/auth/logout', { method: 'POST' });
}

export async function getProfile() {
  return request('/auth/me');
}

export async function changePassword(currentPassword, newPassword) {
  return request('/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export async function getAdminUsers(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);

  const queryString = query.toString();
  return request(`/admin/users${queryString ? `?${queryString}` : ''}`);
}

export async function getAdminUser(id) {
  return request(`/admin/users/${id}`);
}

export async function createAdminUser(data) {
  return request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminUser(id, data) {
  return request(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminUser(id) {
  return request(`/admin/users/${id}`, { method: 'DELETE' });
}

// ─── CAD Projects ─────────────────────────────────────────────────────────────

export async function getCadProjects() {
  return request('/cad-projects');
}

export async function getPublicProjects() {
  return request('/cad-projects/public');
}

export async function getCadProject(id) {
  return request(`/cad-projects/${id}`);
}

export async function getPublicProject(id) {
  return request(`/cad-projects/public/${id}`);
}

export async function createCadProject(body) {
  return request('/cad-projects', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCadProject(id, body) {
  return request(`/cad-projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function updateProjectStatus(id, active) {
  return request(`/cad-projects/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}

export async function deleteCadProject(id) {
  return request(`/cad-projects/${id}`, { method: 'DELETE' });
}

// ─── CAD Conversions ────────────────────────────────────────────────────────
export async function getCadConversions(projectId) {
  const query = projectId ? `?projectId=${projectId}` : '';
  return request(`/api/cad-conversion${query}`);
}

export async function getPublicCadConversions(projectId) {
  const query = projectId ? `?projectId=${projectId}` : '';
  return request(`/api/cad-conversion/public${query}`);
}

export async function deleteCadConversion(id) {
  return request(`/api/cad-conversion/${id}`, { method: 'DELETE' });
}

export async function renameCadConversion(id, newName) {
  return request(`/api/cad-conversion/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ originalFileName: newName })
  });
}

export async function updateCadConversion(id, data) {
  return request(`/api/cad-conversion/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function activateCadConversion(id) {
  return request(`/api/cad-conversion/${id}/activate`, {
    method: 'PATCH'
  });
}

export async function uploadCadConversion(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true; // Automatically send cookies
    xhr.open('POST', `${BASE_URL}/api/cad-conversion/upload`);
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded * 100) / e.total);
          onProgress(percent);
        }
      });
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (err) {
          resolve(xhr.responseText);
        }
      } else {
        let msg = `Upload failed: ${xhr.status}`;
        try { msg = JSON.parse(xhr.responseText).message || msg; } catch (e) { }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

export async function getCadConversion(id) {
  return request(`/api/cad-conversion/${id}`);
}

export async function getPublicCadConversion(id) {
  return request(`/api/cad-conversion/public/${id}`);
}

export async function getCadConversionSvg(id) {
  const res = await authFetch(`/api/cad-conversion/${id}/svg`);
  return res.text();
}

export async function getPublicCadConversionSvg(id) {
  const res = await authFetch(`/api/cad-conversion/public/${id}/svg`);
  return res.text();
}

export async function saveCadConversionSvg(id, formData) {
  const res = await authFetch(`/api/cad-conversion/${id}`, {
    method: 'PATCH',
    body: formData,
  });
  return res.json();
}

// ─── Plot Statuses (DEPRECATED: see Project Plot Statuses below) ─────────────


// ─── Project Plots ────────────────────────────────────────────────────────
export async function getProjectPlots(projectId, options = {}) {
  const params = new URLSearchParams();
  if (options.pagination === false) {
    params.append('pagination', 'false');
  } else {
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
  }
  if (options.search) params.append('search', options.search);
  if (options.statusId) params.append('statusId', options.statusId);
  if (options.assignment) params.append('assignment', options.assignment);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);
  if (options.conversionId) params.append('conversionId', options.conversionId);

  const queryString = params.toString();
  const url = `/api/projects/${projectId}/plots${queryString ? `?${queryString}` : ''}`;
  return request(url).then(res => options.pagination === false && res.data ? res.data : res);
}

export async function getPublicProjectPlots(projectId, options = {}) {
  const params = new URLSearchParams();
  if (options.pagination === false) {
    params.append('pagination', 'false');
  } else {
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
  }
  if (options.search) params.append('search', options.search);
  if (options.statusId) params.append('statusId', options.statusId);
  if (options.assignment) params.append('assignment', options.assignment);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);
  if (options.conversionId) params.append('conversionId', options.conversionId);

  const queryString = params.toString();
  const url = `/api/projects/${projectId}/plots/public${queryString ? `?${queryString}` : ''}`;
  return request(url).then(res => options.pagination === false && res.data ? res.data : res);
}

export async function getProjectPlot(projectId, plotId) {
  return request(`/api/projects/${projectId}/plots/${plotId}`);
}

export async function createProjectPlot(projectId, body) {
  return request(`/api/projects/${projectId}/plots`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function createProjectPlotsBulk(projectId, body) {
  return request(`/api/projects/${projectId}/plots/bulk`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProjectPlot(projectId, plotId, body) {
  return request(`/api/projects/${projectId}/plots/${plotId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function updateProjectPlotAssignment(projectId, plotId, assignmentData) {
  return request(`/api/projects/${projectId}/plots/${plotId}/assignment`, {
    method: 'PATCH',
    body: JSON.stringify(assignmentData),
  });
}

export async function deleteProjectPlot(projectId, plotId) {
  return request(`/api/projects/${projectId}/plots/${plotId}`, { method: 'DELETE' });
}

// ─── Amenities ────────────────────────────────────────────────────────────
export async function getAmenities(options = {}) {
  const query = new URLSearchParams();
  if (options.pagination === false) {
    query.append('pagination', 'false');
  } else {
    if (options.page) query.append('page', options.page.toString());
    if (options.limit) query.append('limit', options.limit.toString());
  }
  if (options.search) query.append('search', options.search);

  const queryString = query.toString();
  return request(`/api/amenities${queryString ? `?${queryString}` : ''}`).then(res => options.pagination === false && res.data ? res.data : res);
}

export async function getAmenity(id) {
  return request(`/api/amenities/${id}`);
}

export async function createAmenity(body) {
  return request('/api/amenities', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAmenity(id, body) {
  return request(`/api/amenities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteAmenity(id) {
  return request(`/api/amenities/${id}`, { method: 'DELETE' });
}

export async function uploadAmenityIcon(file) {
  const formData = new FormData();
  formData.append('icon', file);

  const res = await authFetch(`/api/amenities/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

// ─── Amenity Placements ───────────────────────────────────────────────────
export async function getAmenityPlacements(conversionId) {
  let url = '/api/amenity-placement';
  if (conversionId) url += `?conversionId=${conversionId}`;
  return request(url);
}

export async function getPublicAmenityPlacements(conversionId) {
  let url = '/api/amenity-placement/public';
  if (conversionId) url += `?conversionId=${conversionId}`;
  return request(url).then(res => res.data || res);
}

export async function createAmenityPlacement(body) {
  return request('/api/amenity-placement', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAmenityPlacement(id, body) {
  return request(`/api/amenity-placement/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteAmenityPlacement(id) {
  return request(`/api/amenity-placement/${id}`, { method: 'DELETE' });
}

// ==========================================
// SUBSCRIPTIONS
// ==========================================

export async function getSubscriptions() {
  return request('/subscriptions');
}

export async function getMySubscription() {
  return request('/subscriptions/me');
}

export async function updateSubscriptionStatus(id, status) {
  return request(`/subscriptions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function extendSubscription(id, durationType, durationValue) {
  return request(`/subscriptions/${id}/extend`, {
    method: 'POST',
    body: JSON.stringify({ durationType, durationValue })
  });
}

// ─── Project Plot Statuses ──────────────────────────────────────────────────────────
export async function getProjectPlotStatuses(projectId, params = {}) {
  const query = new URLSearchParams();
  if (params.pagination === false) {
    query.append('pagination', 'false');
  } else {
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
  }
  if (params.search) query.append('search', params.search);
  const queryString = query.toString();

  const url = `/api/plot-statuses/project/${projectId}${queryString ? `?${queryString}` : ''}`;
  return request(url).then(res => params.pagination === false && res.data ? res.data : res);
}

export async function getPublicProjectPlotStatuses(projectId, params = {}) {
  const query = new URLSearchParams();
  if (params.pagination === false) {
    query.append('pagination', 'false');
  } else {
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
  }
  if (params.search) query.append('search', params.search);
  const queryString = query.toString();

  const url = `/api/plot-statuses/public/project/${projectId}${queryString ? `?${queryString}` : ''}`;
  return request(url).then(res => params.pagination === false && res.data ? res.data : res);
}

export async function getPlotStatus(id) {
  return request(`/api/plot-statuses/${id}`);
}

export async function createProjectPlotStatus(projectId, body) {
  return request(`/api/plot-statuses/project/${projectId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}



export async function updateProjectPlotStatus(projectId, id, body) {
  return request(`/api/plot-statuses/project/${projectId}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteProjectPlotStatus(projectId, id) {
  return request(`/api/plot-statuses/project/${projectId}/${id}`, { method: 'DELETE' });
}

// --- Project Boundaries ---

export async function getProjectBoundaries(projectId) {
  return request(`/api/projects/${projectId}/boundaries`);
}

export async function getPublicProjectBoundaries(projectId) {
  return request(`/api/projects/public/${projectId}/boundaries`);
}

export async function createProjectBoundary(projectId, data) {
  return request(`/api/projects/${projectId}/boundaries`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProjectBoundary(id, data) {
  return request(`/api/boundary/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProjectBoundary(id) {
  return request(`/api/boundary/${id}`, { method: 'DELETE' });
}

// ─── Project Appearance Settings ──────────────────────────────────────────────

export async function getProjectAppearanceSettings(projectId) {
  return request(`/cad-projects/${projectId}/appearance-settings`);
}

export async function getPublicProjectAppearanceSettings(projectId) {
  return request(`/cad-projects/${projectId}/appearance-settings/public`);
}

export async function createProjectAppearanceSettings(projectId, data) {
  return request(`/cad-projects/${projectId}/appearance-settings`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProjectAppearanceSettings(projectId, data) {
  return request(`/cad-projects/${projectId}/appearance-settings`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
