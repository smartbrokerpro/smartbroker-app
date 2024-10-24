import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Button,
  Chip,
  Box
} from '@mui/material';
import { Close, GetApp, Description, PictureAsPdf, TableChart } from '@mui/icons-material';

const DocumentsModal = ({ open, onClose, documents = [], realEstateCompanyName }) => {
  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return <PictureAsPdf fontSize="small" />;
    if (type?.includes('excel') || type?.includes('spreadsheet')) return <TableChart fontSize="small" />;
    return <Description fontSize="small" />;
  };

  const getFileTypeLabel = (type) => {
    if (type?.includes('pdf')) return 'PDF';
    if (type?.includes('excel') || type?.includes('spreadsheet')) return 'Excel';
    if (type?.includes('word') || type?.includes('document')) return 'Word';
    return 'Documento';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleDownload = (documentUrl) => {
    if (!documentUrl) return;
    window.open(documentUrl, '_blank');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 1
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Typography variant="h6">Documentos</Typography>
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </Box>
        {realEstateCompanyName && (
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
            {realEstateCompanyName}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {documents && documents.length > 0 ? (
          <List>
            {documents.map((doc, index) => (
              <ListItem 
                key={index}
                sx={{ 
                  '&:hover': { bgcolor: 'action.hover' },
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getFileIcon(doc.type)}
                      <Typography variant="body1">{doc.name}</Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(doc.uploadedAt)}
                      </Typography>
                      <Chip 
                        label={getFileTypeLabel(doc.type)}
                        size="small"
                        sx={{ height: 20 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(doc.size)}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    startIcon={<GetApp />}
                    onClick={() => handleDownload(doc.url)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    Descargar
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography 
            sx={{ 
              textAlign: 'center', 
              py: 4, 
              color: 'text.secondary' 
            }}
          >
            No hay documentos disponibles
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentsModal;