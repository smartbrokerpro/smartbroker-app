import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, CircularProgress, Snackbar, Alert } from '@mui/material';

const ImageUploader = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadImage(file);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const uploadImage = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/uploadS3', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({ open: true, message: 'Image uploaded successfully', severity: 'success' });
        onUpload(data.url); // Pass the uploaded image URL to the parent component
      } else {
        setNotification({ open: true, message: data.error || 'Error uploading image', severity: 'error' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setNotification({ open: true, message: 'Error uploading image', severity: 'error' });
    }

    setUploading(false);
  };

  return (
    <Box>
      <Box {...getRootProps({ className: 'dropzone' })} sx={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
        <input {...getInputProps()} />
        {uploading ? <CircularProgress /> : <p>Drag 'n' drop an image here, or click to select one</p>}
      </Box>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ImageUploader;
