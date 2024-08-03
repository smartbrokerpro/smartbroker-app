import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

const ExcelUploader = () => {
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [modelFields, setModelFields] = useState({ projectFields: [], stockFields: [] });
  const [projectMappings, setProjectMappings] = useState({});
  const [stockMappings, setStockMappings] = useState({});

  useEffect(() => {
    const fetchModelFields = async () => {
      const response = await fetch('/api/getModelFields');
      const fields = await response.json();
      setModelFields(fields);
    };

    fetchModelFields();
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      setColumns(jsonData[0]); // Extraer columnas
      setData(jsonData.slice(1, 6)); // Muestra las primeras 5 filas como ejemplo

      // Asignación automática basada en nombres de columnas
      const autoMappedProjects = {};
      const autoMappedStocks = {};

      jsonData[0].forEach(col => {
        if (modelFields.projectFields.includes(col.toLowerCase())) {
          autoMappedProjects[col] = col.toLowerCase();
        }
        if (modelFields.stockFields.includes(col.toLowerCase())) {
          autoMappedStocks[col] = col.toLowerCase();
        }
      });

      setProjectMappings(autoMappedProjects);
      setStockMappings(autoMappedStocks);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleMappingChange = (e, column, model) => {
    if (model === 'project') {
      setProjectMappings({
        ...projectMappings,
        [column]: e.target.value,
      });
    } else if (model === 'stock') {
      setStockMappings({
        ...stockMappings,
        [column]: e.target.value,
      });
    }
  };

  const handleProcessData = async () => {
    const response = await fetch('/api/importStock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, projectMappings, stockMappings }),
    });

    if (response.ok) {
      alert('Datos importados exitosamente');
    } else {
      alert('Error al importar los datos');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Importar Datos desde Excel
      </Typography>
      <Button variant="contained" component="label">
        Cargar Archivo Excel
        <input type="file" hidden onChange={handleFileUpload} />
      </Button>

      {data.length > 0 && (
        <>
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6">
              Vista Previa de los Datos:
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    {columns.map((col, index) => (
                      <TableCell key={index}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((col, colIndex) => (
                        <TableCell key={colIndex}>{row[col]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6">
              Verifica y Asigna las Columnas:
            </Typography>

            {columns.map((col, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="body1">{col}</Typography>

                <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                  <InputLabel>Campo de Proyecto</InputLabel>
                  <Select
                    value={projectMappings[col] || ''}
                    label="Campo de Proyecto"
                    onChange={(e) => handleMappingChange(e, col, 'project')}
                  >
                    <MenuItem value="">
                      <em>Seleccionar campo...</em>
                    </MenuItem>
                    {modelFields.projectFields.map((field) => (
                      <MenuItem key={field} value={field}>
                        {field}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Campo de Stock</InputLabel>
                  <Select
                    value={stockMappings[col] || ''}
                    label="Campo de Stock"
                    onChange={(e) => handleMappingChange(e, col, 'stock')}
                  >
                    <MenuItem value="">
                      <em>Seleccionar campo...</em>
                    </MenuItem>
                    {modelFields.stockFields.map((field) => (
                      <MenuItem key={field} value={field}>
                        {field}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            ))}

            <Button variant="contained" color="primary" onClick={handleProcessData}>
              Procesar Datos
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ExcelUploader;
