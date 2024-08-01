// /src/components/PromptInput.js
import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/context/NotificationContext';

const PromptInput = ({ modelName, onSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const showNotification = useNotification();

  const handleSubmit = async (e) => {
    console.log("session.user.organization._id", session.user.organization._id)
    e.preventDefault();
    if (!prompt.trim()) {
      showNotification('El prompt no puede estar vacío', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/gpt/${modelName}`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          organizationId: session.user.organization._id,
          userId: session.user._id,
          userEmail: session.user.email,
          modelName
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Operación exitosa', 'success');
        setPrompt('');

        const updatedId = result.data._id || result.deletedProjectId || result.createdProjectId;
        onSuccess(result, updatedId);

        // Actualizar créditos
        const creditUpdateEvent = new CustomEvent('creditUpdate', { detail: { credits: result.credits } });
        window.dispatchEvent(creditUpdateEvent);
        console.log('credits updated:', result.credits)
      } else {
        showNotification(result.error || 'Error en la operación', 'error');
      }
    } catch (error) {
      showNotification('Error en la operación', 'error');
    }
    setIsSubmitting(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <TextField
          aria-label={`Crear, modificar o eliminar ${modelName}`}
          placeholder={`Crear, modificar o eliminar ${modelName}`}
          multiline
          minRows={1}
          maxRows={6}
          variant="outlined"
          fullWidth
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          InputProps={{
            sx: {
              padding: '8px',
              paddingLeft: '1rem',
              borderRadius: '1rem',
              fontSize: '.9rem',
              fontFamily: 'Poppins',
              backgroundColor: '#fff',
              border: '1px solid #fff',
            },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={isSubmitting}
          sx={{ minWidth: 100, ml: '6px', borderRadius: '2rem', pl: 3, pr: 3 }}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Realizar'}
        </Button>
      </Box>
    </Box>
  );
};

export default PromptInput;