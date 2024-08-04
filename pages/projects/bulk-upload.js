import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Button, 
  Select, 
  MenuItem, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  Typography,
  Box,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import ExcelJS from 'exceljs';

export default function BulkUpload() {
  const { data: session } = useSession();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mappings, setMappings] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setFile(file);
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        
        const worksheet = workbook.getWorksheet(1);
        let headers = [];
        const jsonData = [];
        
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) {
            headers = row.values.slice(1);
            setHeaders(headers);
          } else {
            const rowData = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              rowData[headers[colNumber - 1]] = cell.value;
            });
            jsonData.push(rowData);
          }
        });
        
        setPreviewData(jsonData.slice(0, 5));
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Error al procesar el archivo Excel',
          severity: 'error'
        });
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMappingChange = (header, value) => {
    setMappings(prev => ({ ...prev, [header]: value }));
  };

  const handleUpload = () => {
    setOpenConfirmDialog(true);
  };

  const confirmUpload = async () => {
    if (!session?.user?.organization?._id) {
      setSnackbar({
        open: true,
        message: 'No se encontró ID de organización',
        severity: 'error'
      });
      return;
    }
  
    setLoading(true);
  
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mappings));
      formData.append('organizationId', session.user.organization._id);
  
      const response = await fetch('/api/projects/bulk-upload', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la carga masiva');
      }
  
      const result = await response.json();
  
      if (result.success) {
        console.log('Carga masiva exitosa:', result);
        setSnackbar({
          open: true,
          message: `Carga exitosa: ${result.insertedCount} proyectos fueron cargados.`,
          severity: 'success'
        });
        setOpenConfirmDialog(false);
        setTimeout(() => {
          router.push('/projects');
        }, 2000); // Redirige después de 2 segundos
      } else {
        throw new Error(result.error || 'Error en la carga masiva');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error al procesar los datos: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Carga masiva de proyectos</Typography>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        id="raised-button-file"
      />
      <label htmlFor="raised-button-file">
        <Button variant="contained" component="span" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Seleccionar archivo Excel'}
        </Button>
      </label>
      
      {headers.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>Mapeo de columnas</Typography>
          {headers.map(header => (
            <Box key={header} sx={{ mb: 2 }}>
              <Typography variant="subtitle1">{header}</Typography>
              <Select
                fullWidth
                value={mappings[header] || ''}
                onChange={(e) => handleMappingChange(header, e.target.value)}
              >
                <MenuItem value="">No mapear</MenuItem>
                <MenuItem value="name">Nombre</MenuItem>
                <MenuItem value="address">Dirección</MenuItem>
                <MenuItem value="county">Comuna</MenuItem>
                <MenuItem value="real_estate_company">Inmobiliaria</MenuItem>
                <MenuItem value="min_price">Precio mínimo</MenuItem>
                <MenuItem value="max_price">Precio máximo</MenuItem>
                <MenuItem value="typologies">Tipologías</MenuItem>
                <MenuItem value="commercialConditions">Condiciones comerciales</MenuItem>
                <MenuItem value="location.lat">Latitud</MenuItem>
                <MenuItem value="location.lng">Longitud</MenuItem>
                <MenuItem value="delivery_date">Fecha de entrega</MenuItem>
              </Select>
            </Box>
          ))}
        </Box>
      )}

      {previewData.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>Vista previa</Typography>
          <Table>
            <TableHead>
              <TableRow>
                {headers.map((header, index) => (
                  <TableCell key={index}>{header}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header, cellIndex) => (
                    <TableCell key={cellIndex}>{row[header]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        <Button onClick={handleUpload} variant="contained" color="primary" disabled={loading || previewData.length === 0}>
          Subir datos
        </Button>
      </Box>

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmar carga</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea cargar estos datos a la base de datos?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={confirmUpload} autoFocus disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}