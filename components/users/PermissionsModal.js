// components/users/PermissionsModal.js
import { useState } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  Divider,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ResetIcon from '@mui/icons-material/RestartAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { MODULE_NAMES, ACTION_NAMES } from '@/lib/auth/permissions/constants';

export default function PermissionsModal({ 
  open, 
  onClose, 
  user, 
  roles, 
  onSave 
}) {
  const [permissions, setPermissions] = useState(user?.customPermissions || {});
  
  // Obtener permisos base del rol
  const basePermissions = roles[user?.role]?.permissions || {};

  const handlePermissionChange = (module, action, checked) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...(prev[module] || {}),
        [action]: checked ? 1 : 0
      }
    }));
  };

  const resetModulePermissions = (module) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      delete newPermissions[module];
      return newPermissions;
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Permisos de {user?.name}
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Los permisos personalizados sobreescriben los permisos del rol base ({roles[user?.role]?.description})
        </Alert>

        {Object.entries(MODULE_NAMES).map(([moduleKey, moduleName]) => {
          const modulePermissions = basePermissions[moduleKey];
          
          if (!modulePermissions) {
            return (
              <Box 
                key={moduleKey} 
                sx={{ 
                  mb: 3,
                  p: 2,
                  bgcolor: '#fff3e0',
                  borderRadius: 1,
                  border: '1px solid #ffb74d'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningAmberIcon sx={{ color: '#f57c00' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                    {moduleName}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#f57c00', mt: 1 }}>
                  Este rol no tiene acceso a este módulo
                </Typography>
              </Box>
            );
          }

          return (
            <Box key={moduleKey} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {moduleName}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => resetModulePermissions(moduleKey)}
                  sx={{ ml: 1 }}
                >
                  <Tooltip title="Resetear a permisos del rol">
                    <ResetIcon fontSize="small" />
                  </Tooltip>
                </IconButton>
              </Box>

              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 2 
              }}>
                {Object.entries(modulePermissions).map(([action, baseValue]) => {
                  const hasCustom = permissions[moduleKey]?.[action] !== undefined;
                  const isEnabled = hasCustom 
                    ? permissions[moduleKey][action]
                    : baseValue;

                  return (
                    <Box 
                      key={action}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        p: 1,
                        border: '1px solid',
                        borderColor: hasCustom ? 'warning.light' : 'divider',
                        borderRadius: 1,
                        bgcolor: hasCustom ? 'warning.lighter' : 'transparent'
                      }}
                    >
                      <Checkbox
                        checked={!!isEnabled}
                        onChange={(e) => handlePermissionChange(moduleKey, action, e.target.checked)}
                      />
                      <Typography variant="body2">
                        {ACTION_NAMES[action]}
                      </Typography>
                      {hasCustom && (
                        <Tooltip title="Permiso personalizado">
                          <InfoIcon 
                            fontSize="small" 
                            color="warning"
                            sx={{ ml: 'auto' }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  );
                })}
              </Box>
              
              <Divider sx={{ mt: 2 }} />
            </Box>
          );
        })}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={() => {
            onSave({ customPermissions: permissions });
            onClose();
          }}
          variant="contained"
        >
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
}