import { auth } from './firebaseConfig';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const request = async (method, path, payload = null) => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(payload ? { 'Content-Type': 'application/json' } : {}),
      },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.message || data.error || 'Request failed';
      throw new Error(message);
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
};

const get = (path) => request('GET', path);
const post = (path, payload) => request('POST', path, payload);
const patch = (path, payload) => request('PATCH', path, payload);
const del = (path) => request('DELETE', path);

export const getHostels = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  const { hostels } = await get(`/api/hostels${query ? `?${query}` : ''}`);
  return hostels || [];
};

export const getHostel = async (hostelId) => {
  const { hostel } = await get(`/api/hostels/${encodeURIComponent(hostelId)}`);
  return hostel;
};

export const createHostel = async (hostelData) => {
  const { hostel } = await post('/api/hostels', hostelData);
  return { hostel };
};

export const updateHostel = async (hostelId, hostelData) => {
  const { hostel } = await patch(`/api/hostels/${encodeURIComponent(hostelId)}`, hostelData);
  return { hostel };
};

export const deleteHostel = async (hostelId) => {
  await del(`/api/hostels/${encodeURIComponent(hostelId)}`);
  return { ok: true };
};

export const assignStudents = async (hostelId, studentIds) => {
  const { hostel } = await patch(`/api/hostels/${encodeURIComponent(hostelId)}`, {
    students: studentIds,
  });
  return { hostel };
};

export const assignWardens = async (hostelId, wardenIds) => {
  const { hostel } = await patch(`/api/hostels/${encodeURIComponent(hostelId)}`, {
    wardens: wardenIds,
  });
  return { hostel };
};