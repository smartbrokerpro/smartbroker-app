// lib/auth/permissions/helpers.js
import { ROLES } from './roles';

// Modificar esta función para soportar permisos personalizados
export const hasPermission = (user, module, action) => {
  // Si se pasa solo el rol (compatibilidad con código existente)
  if (typeof user === 'string') {
    const rolePermissions = ROLES[user]?.permissions;
    return !!rolePermissions?.[module]?.[action];
  }

  // Admin siempre tiene acceso
  if (user?.role === 'admin') return true;

  // Verificar permisos personalizados primero
  if (user?.customPermissions?.[module]?.[action] === 1) return true;

  // Verificar permisos del rol base
  return !!ROLES[user?.role]?.permissions?.[module]?.[action];
};

// Mantener el resto de las funciones igual
export const getRolePermissions = (role) => {
  return ROLES[role]?.permissions || null;
};

export const getAllRoles = () => Object.keys(ROLES);

export const getRoleDescription = (role) => ROLES[role]?.description;

export const getModulePermissions = (role, module) => {
  return ROLES[role]?.permissions?.[module] || null;
};