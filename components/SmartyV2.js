import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';  // Importa el plugin para soporte de tablas
import SendIcon from '@mui/icons-material/Send';

export default function SmartyV2() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const chatContainerRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      alert('No hay sesión activa');
      return;
    }
    if (!query.trim()) return;

    setLoading(true);
    const userMessage = { type: 'user', content: query };
    setChatHistory(prev => [...prev, userMessage]);
    setQuery('');

    try {
      const res = await fetch('/api/smartyv2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          organizationId: session.user.organization._id,
          userId: session.user.id
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const assistantMessage = { 
          type: 'assistant', 
          content: data.analysis
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <Box sx={{ 
      height: 'calc(100vh - 16px)', 
      margin: 0,
      padding: '1rem',
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f0f7e6'  // Lighter shade of #8DCB42
    }}>
      <Box ref={chatContainerRef} sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column-reverse',
        gap: 2,
        mb: 2  // Margen inferior agregado para las cajas flotantes
      }}>
        {chatHistory.slice().reverse().map((message, index) => (
          <Box key={index} sx={{
            alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '70%',
            mb: 2  // Margen inferior agregado para cada mensaje
          }}>
            <Paper elevation={1} sx={{ 
              p: 2, 
              bgcolor: message.type === 'user' ? '#d9ecc7' : '#ffffff',  // Lighter and darker shades of #8DCB42
              border: message.type === 'user' ? '1px solid #8DCB42' : 'none'
            }}>
              {message.type === 'user' ? (
                <Typography>{message.content}</Typography>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}  // Añade el plugin para tablas
                  components={{
                    h1: ({ node, ...props }) => <Typography variant="h4" sx={{ color: '#4a6b22', mt: 2, mb: 1, fontWeight: 'bold' }} {...props} />,
                    h2: ({ node, ...props }) => <Typography variant="h5" sx={{ color: '#4a6b22', mt: 2, mb: 1, fontWeight: 'bold' }} {...props} />,
                    h3: ({ node, ...props }) => <Typography variant="h6" sx={{ color: '#4a6b22', mt: 2, mb: 1, fontWeight: 'bold' }} {...props} />,
                    p: ({ node, ...props }) => <Typography sx={{ mb: 1 }} {...props} />,
                    table: ({ node, ...props }) => (
                      <TableContainer component={Paper} sx={{ my: 2 }}>
                        <Table size="small" sx={{ border: '1px solid #ccc' }} {...props}>  {/* Borde de la tabla */}
                          {props.children}
                        </Table>
                      </TableContainer>
                    ),
                    th: ({ node, ...props }) => (
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f0f7e6', border: '1px solid #ccc' }} {...props}>  {/* Encabezado con borde */}
                        {props.children}
                      </TableCell>
                    ),
                    td: ({ node, ...props }) => (
                      <TableCell sx={{ border: '1px solid #ccc' }} {...props}>  {/* Celdas con borde */}
                        {props.children}
                      </TableCell>
                    ),
                    ul: ({ node, ...props }) => <Box component="ul" sx={{ pl: 2, mb: 1 }} {...props} />,
                    ol: ({ node, ...props }) => <Box component="ol" sx={{ pl: 2, mb: 1 }} {...props} />,
                    li: ({ node, ...props }) => <Box component="li" sx={{ mb: 0.5 }} {...props} />,
                    strong: ({ node, ...props }) => <strong style={{ fontWeight: 'bold' }} {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </Paper>
          </Box>
        ))}
      </Box>
      <Paper 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          bgcolor: '#ffffff',
          borderTop: '1px solid #8DCB42'
        }}
      >
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ingrese su consulta"
          variant="outlined"
          size="small"
          sx={{ 
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#8DCB42',
              },
              '&:hover fieldset': {
                borderColor: '#4a6b22',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4a6b22',
              },
            },
          }}
        />
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          disabled={loading || !session}
          sx={{ 
            minWidth: 'auto', 
            px: 2, 
            py: 1,
            bgcolor: '#8DCB42',
            '&:hover': {
              bgcolor: '#4a6b22',
            },
          }}
        >
          {loading ? <CircularProgress size={24} /> : <SendIcon />}
        </Button>
      </Paper>
    </Box>
  );
}
