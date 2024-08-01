import { getSession } from "next-auth/react";

export async function fetchWithOrganization(url, options = {}) {
  const session = await getSession();
  if (!session) {
    throw new Error("No session found");
  }
  console.log(session)
  if (!session?.user?.organization?._id) {
    throw new Error("No organization ID found in session");
  }

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': session.user.organization._id,
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  const response = await fetch(url, mergedOptions);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export function handleApiError(error) {
  console.error('API Error:', error);
  // Aquí puedes agregar lógica para manejar errores de API de manera centralizada
}

export function buildQueryString(params) {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}