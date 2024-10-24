// components/DocumentsSection.js
import React, { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Link
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { useDropzone } from 'react-dropzone';
import slugify from 'slugify';

const ALLOWED_DOCUMENT_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
};

const DocumentsSection = ({ company, showSnackbar }) => {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (company?.documents) {
      console.log('Documentos en company:', company.documents);
      setDocuments(company.documents);
    }
  }, [company?.documents]);

  const onDropRejected = useCallback((rejectedFiles) => {
    rejectedFiles.forEach((rejection) => {
      let errorMessage = 'Archivo rechazado: ';
      
      if (rejection.errors.some(error => error.code === 'file-invalid-type')) {
        errorMessage += `${rejection.file.name} - Tipo de archivo no permitido. Solo se permiten documentos PDF, DOC, DOCX, XLS y XLSX.`;
      } else if (rejection.errors.some(error => error.code === 'file-too-large')) {
        errorMessage += `${rejection.file.name} - El archivo excede el límite de 5MB.`;
      } else {
        errorMessage += `${rejection.file.name} - ${rejection.errors[0]?.message || 'Error desconocido'}`;
      }
      
      showSnackbar(errorMessage, 'error');
    });
  }, [showSnackbar]);

  const onDropDocument = useCallback(async (acceptedFiles) => {
    if (!company?.name || !company?._id) {
      showSnackbar('Error: Información de la inmobiliaria no disponible', 'error');
      return;
    }

    if (!session?.user?.organization?._id) {
      showSnackbar('Error: No hay una organización autorizada', 'error');
      return;
    }

    setUploadingDoc(true);
    
    try {
      const organizationName = session.user.organization.name;
      const organizationId = session.user.organization._id;
      const companySlug = slugify(company.name, { lower: true, strict: true });
      
      const uploadPromises = acceptedFiles.map(file => {
        const formData = new FormData();
        formData.append('file', file);

        return fetch(`/api/uploadS3?organizationName=${encodeURIComponent(organizationName)}&organizationId=${encodeURIComponent(organizationId)}&companyName=${encodeURIComponent(companySlug)}&companyId=${encodeURIComponent(company._id)}&type=documents`, {
          method: 'POST',
          headers: {
            'x-organization-id': organizationId
          },
          body: formData,
        })
          .then(response => {
            if (!response.ok) {
              return response.json().then(err => Promise.reject(err));
            }
            return response.json();
          })
          .then(data => {
            if (!data.success) {
              throw new Error(data.error || 'Error al subir archivo');
            }
            return {
              url: data.url,
              name: data.filename || file.name,
              type: file.type,
              size: file.size,
              uploadedAt: new Date().toISOString()
            };
          });
      });

      console.log('Iniciando carga de documentos...');
      const uploadedDocs = await Promise.all(uploadPromises);
      console.log('Documentos cargados:', uploadedDocs);

      console.log('Actualizando inmobiliaria...');
      const response = await fetch(`/api/real_estate_companies?id=${company._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': organizationId
        },
        body: JSON.stringify({
          action: 'addDocuments',
          documents: uploadedDocs
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar documentos');
      }
      
      console.log('Respuesta de actualización:', data);
      
      if (data.data?.documents) {
        setDocuments(data.data.documents);
        showSnackbar('Documentos subidos con éxito', 'success');
      } else {
        console.warn('No se encontraron documentos en la respuesta:', data);
        showSnackbar('Los documentos se subieron pero no se pudieron actualizar correctamente', 'warning');
      }
    } catch (error) {
      console.error('Error al subir documentos:', error);
      showSnackbar(
        `Error al subir documentos: ${error.message || 'Error desconocido'}`, 
        'error'
      );
    } finally {
      setUploadingDoc(false);
    }
  }, [company, session, showSnackbar]);

  const handleDeleteDocument = async (documentUrl) => {
    if (!company?._id || !session?.user?.organization?._id) return;

    try {
      const response = await fetch(`/api/real_estate_companies?id=${company._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': session.user.organization._id
        },
        body: JSON.stringify({
          action: 'deleteDocument',
          documents: { url: documentUrl }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar documento');
      }
      
      if (data.data?.documents) {
        setDocuments(data.data.documents);
        showSnackbar('Documento eliminado con éxito', 'success');
      }
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      showSnackbar('Error al eliminar documento: ' + error.message, 'error');
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({ 
    onDrop: onDropDocument,
    onDropRejected,
    accept: ALLOWED_DOCUMENT_TYPES,
    maxSize: 5 * 1024 * 1024, // 5MB
    validator: (file) => {
      // Validación adicional para asegurarnos de que no son imágenes
      if (file.type.startsWith('image/')) {
        return {
          code: 'file-invalid-type',
          message: 'No se permiten imágenes, solo documentos'
        };
      }
      return null;
    }
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Documentos
      </Typography>
      
      <Box 
        {...getRootProps()} 
        sx={{
          border: '2px dashed',
          borderColor: isDragReject ? 'error.main' : isDragActive ? 'success.main' : 'grey.300',
          p: 2,
          mt: 2,
          mb: 3,
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: 1,
          backgroundColor: isDragActive 
            ? 'action.hover' 
            : isDragReject 
              ? 'error.lighter' 
              : 'background.paper',
          '&:hover': {
            backgroundColor: 'action.hover'
          },
          transition: 'all 0.2s ease'
        }}
      >
        <input {...getInputProps()} />
        {isDragReject ? (
          <Typography color="error">
            Archivo no permitido
          </Typography>
        ) : isDragActive ? (
          <Typography color="primary">
            Suelta los documentos aquí...
          </Typography>
        ) : (
          <>
            <Typography>
              Arrastra y suelta documentos aquí, o haz clic para seleccionar archivos
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1 }}>
              Formatos aceptados: PDF, DOC, DOCX, XLS, XLSX
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              Tamaño máximo: 5MB
            </Typography>
          </>
        )}
      </Box>

      <List>
        {documents && documents.length > 0 ? (
          documents.map((doc, index) => (
            <ListItem 
              key={index} 
              divider
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ListItemText
                primary={doc.name}
                secondary={`${formatFileSize(doc.size)} - ${new Date(doc.uploadedAt).toLocaleDateString()}`}
              />
              <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  edge="end"
                  aria-label="download"
                  component={Link}
                  href={doc.url}
                  target="_blank"
                  disabled={uploadingDoc}
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteDocument(doc.url)}
                  disabled={uploadingDoc}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        ) : (
          <Typography 
            variant="body2" 
            color="textSecondary" 
            sx={{ textAlign: 'center', mt: 2 }}
          >
            No hay documentos cargados
          </Typography>
        )}
      </List>

      {uploadingDoc && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          mt: 2,
          gap: 2
        }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="textSecondary">
            Subiendo documentos...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DocumentsSection;