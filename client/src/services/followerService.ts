import {
  FollowActionResponse,
  FollowStatusResponse,
  FollowCountsResponse,
  PaginatedUsersResponse,
  PendingRequestsResponse,
  PrivacyUpdateResponse,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL;

// 1. SEGUIR A UN USUARIO (POST)
export const follow = async (userId: string, token: string): Promise<FollowActionResponse | null> => {
  try {
    const response = await fetch(`${API_URL}/followers/${userId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as FollowActionResponse;
  } catch (error) {
    console.error('Error al seguir usuario:', error);
    return null;
  }
};

// 2. DEJAR DE SEGUIR (DELETE)
export const unfollow = async (userId: string, token: string): Promise<{ ok: boolean } | null> => {
  try {
    const response = await fetch(`${API_URL}/followers/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as { ok: boolean };
  } catch (error) {
    console.error('Error al dejar de seguir:', error);
    return null;
  }
};

// 3. ACEPTAR SOLICITUD (POST)
export const acceptRequest = async (userId: string, token: string): Promise<{ ok: boolean } | null> => {
  try {
    const response = await fetch(`${API_URL}/followers/${userId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as { ok: boolean };
  } catch (error) {
    console.error('Error al aceptar solicitud:', error);
    return null;
  }
};

// 4. RECHAZAR SOLICITUD (POST)
export const rejectRequest = async (userId: string, token: string): Promise<{ ok: boolean } | null> => {
  try {
    const response = await fetch(`${API_URL}/followers/${userId}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as { ok: boolean };
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    return null;
  }
};

// 5. OBTENER SEGUIDORES DE UN USUARIO (GET)
export const getFollowers = async (userId: string, token: string, page = 1): Promise<PaginatedUsersResponse | null> => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/followers?page=${page}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as PaginatedUsersResponse;
  } catch (error) {
    console.error('Error al obtener seguidores:', error);
    return null;
  }
};

// 6. OBTENER A QUIÉN SIGUE UN USUARIO (GET)
export const getFollowing = async (userId: string, token: string, page = 1): Promise<PaginatedUsersResponse | null> => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/following?page=${page}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as PaginatedUsersResponse;
  } catch (error) {
    console.error('Error al obtener seguidos:', error);
    return null;
  }
};

// 7. OBTENER SOLICITUDES PENDIENTES RECIBIDAS (GET)
export const getPending = async (token: string, page = 1): Promise<PendingRequestsResponse | null> => {
  try {
    const response = await fetch(`${API_URL}/followers/pending?page=${page}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as PendingRequestsResponse;
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    return null;
  }
};

// 8. ESTADO DE SEGUIMIENTO ENTRE DOS USUARIOS (GET)
export const getStatus = async (userId: string, token: string): Promise<FollowStatusResponse | null> => {
  try {
    const response = await fetch(`${API_URL}/followers/status/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as FollowStatusResponse;
  } catch (error) {
    console.error('Error al obtener estado de seguimiento:', error);
    return null;
  }
};

// 9. CONTADORES DE SEGUIDORES/SEGUIDOS (GET, público)
export const getFollowCounts = async (userId: string): Promise<FollowCountsResponse | null> => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/follow-counts`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as FollowCountsResponse;
  } catch (error) {
    console.error('Error al obtener contadores:', error);
    return null;
  }
};

// 10. ACTUALIZAR PRIVACIDAD DEL PERFIL (PATCH)
export const updatePrivacy = async (isPrivate: boolean, token: string): Promise<PrivacyUpdateResponse | null> => {
  try {
    const response = await fetch(`${API_URL}/users/me/privacy`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ isPrivate }),
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as PrivacyUpdateResponse;
  } catch (error) {
    console.error('Error al actualizar privacidad:', error);
    return null;
  }
};
