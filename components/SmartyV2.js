import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  InputAdornment,
  IconButton,
  Snackbar
} from '@mui/material';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import SendIcon from '@mui/icons-material/Send';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExploreIcon from '@mui/icons-material/Explore';
import PaymentIcon from '@mui/icons-material/Payment';
import SurfaceIcon from '@mui/icons-material/Fullscreen';
import MapIcon from '@mui/icons-material/Map';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import Image from 'next/image';
import smartyImage from '/public/images/smarty.svg';
import LottieLoader from './LottieLoader';

const examples = [
  { icon: <FilterListIcon fontSize="large" />, text: "Muéstrame doce unidades de 2 dormitorios y 2 baños con al menos 10% de descuento" },
  { icon: <ExploreIcon fontSize="large" />, text: "Enséñame 8 unidades con orientación al norte." },
  { icon: <PaymentIcon fontSize="large" />, text: "Encuentra diez unidades con un bono pie del 15%." },
  { icon: <SurfaceIcon fontSize="large" />, text: "Dime las comunas con mayor precio por m2." },
  { icon: <MapIcon fontSize="large" />, text: "Dime los unidades que tiene cada comuna, y el porcentaje correspondiente del total." },
  { icon: <PriceCheckIcon fontSize="large" />, text: "Mostrar 15 unidades de precio cercano a 3000 UF en la comuna de La Florida, con orientación norte." }
];

const processLatexContent = (content) => {
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    return match.replace(/\n/g, ' ');
  });

  content = content.replace(/\$(.*?)\$/g, (match) => {
    return match.replace(/\n/g, ' ');
  });

  content = content.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    return `$$${formula.trim().replace(/\n/g, ' ')}$$`;
  });

  content = content.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
    return `$${formula.trim().replace(/\n/g, ' ')}$`;
  });

  return content;
};

const Message = React.memo(({ message, onFeedback }) => {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  const handleFeedback = (event, feedbackId, isPositive) => {
    event.preventDefault();
    event.stopPropagation();
    onFeedback(feedbackId, isPositive);
    setOpenSnackbar(true);
  };

  const content = message.type === 'user' 
    ? <Typography>{message.content}</Typography>
    : (
      <Box sx={{position:'relative'}}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1: ({node, ...props}) => <Typography variant="h4" sx={{ color: '#4a6b22', mt: 2, mb: 1, fontWeight: 'bold' }} {...props} />,
            h2: ({node, ...props}) => <Typography variant="h5" sx={{ color: '#4a6b22', mt: 2, mb: 1, fontWeight: 'bold' }} {...props} />,
            h3: ({node, ...props}) => <Typography variant="h6" sx={{ color: '#4a6b22', mt: 2, mb: 1, fontWeight: 'bold' }} {...props} />,
            h4: ({node, ...props}) => <Typography variant="h6" sx={{ color: '#4a6b22', mt: 2, mb: 1 }} {...props} />,
            p: ({node, ...props}) => <Typography sx={{ mb: 1 }} {...props} />,
            table: ({node, ...props}) => (
              <TableContainer component={Box} sx={{ my: 2, maxWidth: '100%', overflowX: 'auto' }}>
                <Table size="small" sx={{ border: '1px solid #ccc', width: 'auto', minWidth: '50%', borderRadius:'1rem' }} {...props} />
              </TableContainer>
            ),
            th: ({node, ...props}) => (
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f0f7e6', border: '1px solid #ccc' }} {...props} />
            ),
            td: ({node, ...props}) => (
              <TableCell sx={{ border: '1px solid #ccc' }} {...props} />
            ),
            ul: ({node, ...props}) => <Box component="ul" sx={{ pl: 3, mb: 1 }} {...props} />,
            ol: ({node, ...props}) => <Box component="ol" sx={{ pl: 3, mb: 1 }} {...props} />,
            li: ({node, ...props}) => <Box component="li" sx={{ mb: 0.5 }} {...props} />,
            strong: ({node, ...props}) => <strong style={{ fontWeight: 'bold' }} {...props} />,
          }}
        >
          {processLatexContent(message.content)}
        </ReactMarkdown>
        {message.feedbackId && (
          <Box sx={{ 
            position: 'absolute', 
            bottom: '-45px', 
            right: '10px', 
            display: 'flex', 
            padding: '5px',            
          }}>
            <IconButton 
              onClick={(e) => handleFeedback(e, message.feedbackId, true)}
              sx={{ 
                p: 1,
                mr:1,
                backgroundColor: 'white',
                borderRadius: '3rem',
                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                border:'1px solid #ccc',
                color: message.feedback === true ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  backgroundColor: '#e8f5e9',
                  color: '#4caf50',
                },
              }}
            >
              <ThumbUpIcon fontSize="small" />
            </IconButton>
            <IconButton 
              onClick={(e) => handleFeedback(e, message.feedbackId, false)}
              sx={{
                p: 1,
                backgroundColor: 'white',
                borderRadius: '3rem',
                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                border:'1px solid #ccc',
                color: message.feedback === false ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  backgroundColor: '#ffebee',
                  color: '#f44336',
                },
              }}
            >
              <ThumbDownIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    );

    return (
      <>
        <Paper elevation={1} sx={{ 
          p: 2, 
          bgcolor: message.type === 'user' ? '#d9ecc7' : '#ffffff',
          border: message.type === 'user' ? '1px solid #8DCB42' : 'none'
        }}>
          {content}
        </Paper>
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={() => setOpenSnackbar(false)}
          message="¡Gracias por tu feedback!"
        />
      </>
    );
});

export default function SmartyV2() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const chatContainerRef = useRef(null);
  const lastMessageRef = useRef(null);
  const [showExamples, setShowExamples] = useState(true);

  const scrollToNewMessage = () => {
    if (lastMessageRef.current && chatContainerRef.current) {
      const containerHeight = chatContainerRef.current.clientHeight;
      const messageTop = lastMessageRef.current.offsetTop;
      const messageHeight = lastMessageRef.current.clientHeight;
      
      let scrollPosition;
      if (messageHeight > containerHeight) {
        scrollPosition = messageTop;
      } else {
        scrollPosition = Math.max(0, messageTop + messageHeight - containerHeight + 32);
      }

      chatContainerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleSubmit = async (e, exampleQuery = null) => {
    e.preventDefault();
    const queryToSend = exampleQuery || query;
    if (!session || !queryToSend.trim()) return;

    setIsLoading(true);
    setChatHistory(prev => [...prev, { type: 'user', content: queryToSend }, { type: 'loading' }]);
    setQuery('');
    setShowExamples(false);
    
    setTimeout(scrollToNewMessage, 0);

    try {
      const res = await fetch('/api/smartyv2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToSend,
          organizationId: session.user.organization._id,
          userId: session.user.id
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev.slice(0, -1), { 
          type: 'assistant', 
          content: data.analysis,
          feedbackId: data.feedbackId,
          feedback: null
        }]);
      } else {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      setChatHistory(prev => [...prev.slice(0, -1), { type: 'assistant', content: 'Lo siento, hubo un error al procesar tu consulta. Por favor, intenta nuevamente.' }]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (chatHistory.length > 0) {
      scrollToNewMessage();
    }
  }, [chatHistory]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExampleClick = (text) => {
    handleSubmit({ preventDefault: () => {} }, text);
  };

  const handleFeedback = async (feedbackId, isPositive) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          feedbackId, 
          feedback: isPositive,
          userId: session.user.id,
          organizationId: session.user.organization._id
        }),
      });
  
      if (response.ok) {
        setChatHistory(prev => 
          prev.map(msg => 
            msg.feedbackId === feedbackId 
              ? { ...msg, feedback: isPositive } 
              : msg
          )
        );
      } else {
        console.error('Error al enviar feedback');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Box sx={{ 
      height: '98vh',
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f0f7e6',
      position: 'relative',
      width: '100%',
      overflowY: 'hidden'
    }}>
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'hidden'
      }}>
        <Box ref={chatContainerRef} sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column',
          p: 2
        }}>
          {showExamples && (
            <Box sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
              <Image src={smartyImage} alt="Smarty" width={100} height={100} />
              <Typography variant="h6" sx={{ m: 3 }} gutterBottom>Puedes pedirme cosas como: </Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 2,
                justifyContent: 'center',
              }}>
                {examples.map((example, index) => (
                  <Box
                    key={index}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: '#fff',
                      p: 2,
                      borderRadius: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      textAlign: 'left',
                      '&:hover': {
                        backgroundColor: '#50A930',
                      },
                      transition: 'background-color 0.3s ease',
                    }}
                    onClick={() => handleExampleClick(example.text)}
                  >
                    <Box sx={{ mr: 2 }}>{example.icon}</Box>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{example.text}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          {chatHistory.map((message, index) => (
            <Box 
              key={index}
              ref={index === chatHistory.length - 1 ? lastMessageRef : null}
              sx={{
                alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                m: 2,
              }}
            >
              {message.type === 'loading' ? (
                <LottieLoader message="Buscando..." />
              ) : (
                <Message message={message} onFeedback={handleFeedback} />
              )}
            </Box>
          ))}
        </Box>
      </Box>
      
      <Box sx={{ 
        width: '100%', 
        padding: '10px',
        backgroundColor: '#f0f7e6',
      }}>
        <Paper 
          component="form" 
          onSubmit={handleSubmit}
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',  
            borderRadius: '25px',
            p: 1,
            width: '100%',  
            maxWidth: '800px',
            bgcolor: '#fff',
            margin: '0 auto'
          }}
        >
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ingrese su consulta"
            variant="outlined"
            size="small"
            multiline
            minRows={1}
            maxRows={4}
            onKeyPress={handleKeyPress}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    disabled={isLoading || !session}
                    sx={{ 
                      bgcolor: '#8DCB42',
                      width: '34px',
                      minWidth:'34px',
                      maxWidth:'34px',
                      height: '34px',
                      borderRadius: '50%',
                      marginRight: '-10px',
                      '&:hover': {
                        bgcolor: '#4a6b22',
                      },
                      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                  {isLoading ? <CircularProgress size={24} /> : <SendIcon sx={{ fontSize: '16px' }} />}
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{ 
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#8DCB42',
                  borderRadius: '25px',
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
        </Paper>
      </Box>
    </Box>
  );
}