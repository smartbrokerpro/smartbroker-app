import { useState } from 'react';
import { Box, TextField, Button, Typography, Card, CardContent, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function Tests() {
  const [results, setResults] = useState([]);
  const [orgId, setOrgId] = useState('66ac50b7eb540f8940c4cb5a'); // Inicializar con valor predeterminado
  const [projId, setProjId] = useState('66b01766bd7e27c70e300dbc');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const examples = [
    {"prompt": "Encuentra unidades con precios entre 2500 y 3500 UF.", "completion": "{\"action\": \"filter\", \"command\": { \"current_list_price\": { \"$gte\": 2500, \"$lte\": 3500 } }}"},
    {"prompt": "Muestra todas las unidades con una superficie total mayor a 60 m².", "completion": "{\"action\": \"filter\", \"command\": { \"total_surface\": { \"$gt\": 60 } }}"},
    {"prompt": "Busca unidades con orientación sur y superficie mayor a 70 m².", "completion": "{\"action\": \"filter\", \"command\": { \"orientation\": \"Sur\", \"total_surface\": { \"$gt\": 70 } }}"},
    {"prompt": "Filtra las unidades disponibles con estado 'activo'.", "completion": "{\"action\": \"filter\", \"command\": { \"status\": \"activo\", \"available\": { \"$gt\": 0 } }}"},
    {"prompt": "Encuentra proyectos con fecha de entrega estimada en 2024.", "completion": "{\"action\": \"filter\", \"command\": { \"delivery_date\": { \"$gte\": \"2024-01-01\", \"$lte\": \"2024-12-31\" } }}"},
    {"prompt": "Muestra todas las unidades del proyecto 'Parque Arauco'.", "completion": "{\"action\": \"filter\", \"command\": { \"project_name\": \"Parque Arauco\" }}"},
    {"prompt": "Filtra unidades en la comuna de Vitacura con precios entre 4000 y 5000 UF.", "completion": "{\"action\": \"filter\", \"command\": { \"county_name\": \"Vitacura\", \"current_list_price\": { \"$gte\": 4000, \"$lte\": 5000 } }}"},
    {"prompt": "Encuentra unidades con orientación norte, en la comuna de Ñuñoa, y con estado 'activo'.", "completion": "{\"action\": \"filter\", \"command\": { \"orientation\": \"Norte\", \"county_name\": \"Ñuñoa\", \"status\": \"activo\" }}"},
    {"prompt": "Muestra las unidades en proyectos con fecha de entrega en el primer trimestre de 2025.", "completion": "{\"action\": \"filter\", \"command\": { \"delivery_date\": { \"$gte\": \"2025-01-01\", \"$lte\": \"2025-03-31\" } }}"},
    {"prompt": "Encuentra unidades con orientación norte, superficie mayor a 80 m², y precio entre 3000 y 4000 UF.", "completion": "{\"action\": \"filter\", \"command\": { \"orientation\": \"Norte\", \"total_surface\": { \"$gt\": 80 }, \"current_list_price\": { \"$gte\": 3000, \"$lte\": 4000 } }}"},
    {"prompt": "Calcula el precio promedio de las unidades en la comuna de Las Condes.", "completion": "{\"action\": \"aggregate\", \"command\": [{ \"$match\": { \"county_name\": \"Las Condes\" }}, { \"$group\": { \"_id\": null, \"avg_price\": { \"$avg\": \"$current_list_price\" }}}]}"},
    {"prompt": "Encuentra unidades con precios por debajo del promedio del mercado en Providencia.", "completion": "{\"action\": \"aggregate\", \"command\": [{ \"$match\": { \"county_name\": \"Providencia\" }}, { \"$group\": { \"_id\": null, \"avg_price\": { \"$avg\": \"$current_list_price\" }}}, { \"$match\": { \"current_list_price\": { \"$lt\": \"$avg_price\" }}}]}"},
    {"prompt": "Agrupa las unidades por estado y muestra la cantidad de unidades en cada grupo.", "completion": "{\"action\": \"aggregate\", \"command\": [{ \"$group\": { \"_id\": \"$status\", \"count\": { \"$sum\": 1 } }}]}"},
    {"prompt": "Muestra proyectos que tienen al menos 20 unidades disponibles.", "completion": "{\"action\": \"aggregate\", \"command\": [{ \"$match\": { \"organization_id\": \"ObjectId\" }}, { \"$lookup\": { \"from\": \"units\", \"localField\": \"_id\", \"foreignField\": \"project_id\", \"as\": \"units\" }}, { \"$match\": { \"units\": { \"$size\": { \"$gte\": 20 }}}]}]}"},
    {"prompt": "Calcula la superficie promedio de las unidades por orientación.", "completion": "{\"action\": \"aggregate\", \"command\": [{ \"$group\": { \"_id\": \"$orientation\", \"avg_surface\": { \"$avg\": \"$total_surface\" } }}]}"},
    {"prompt": "Calcula el precio promedio de todas las unidades.", "completion": "{\"action\": \"aggregate\", \"command\": [{ \"$group\": { \"_id\": null, \"avg_price\": { \"$avg\": \"$current_list_price\" } }}]}"},
    {"prompt": "Calcula el precio promedio por orientación de las unidades.", "completion": "{\"action\": \"aggregate\", \"command\": [{ \"$group\": { \"_id\": \"$orientation\", \"avg_price\": { \"$avg\": \"$current_list_price\" } }}]}"},
    {"prompt": "Agrupa las unidades por orientación y calcula el precio promedio de cada grupo.", "completion": "{\"action\": \"aggregate\", \"command\": [{ \"$group\": { \"_id\": \"$orientation\", \"avg_price\": { \"$avg\": \"$current_list_price\" } }}]}"},
    {"prompt": "Agrupa los proyectos por comuna y muestra el precio mínimo y máximo de cada grupo.", "completion": "{\"action\": \"aggregate\", \"command\": [{ \"$group\": { \"_id\": \"$county_name\", \"min_price\": { \"$min\": \"$min_price\" }, \"max_price\": { \"$max\": \"$max_price\" } }}]}"},
    {"prompt": "Encuentra todas las unidades cuyo precio sea menor que el precio promedio de su proyecto.", "completion": "{\"action\": \"aggregate\", \"command\": [{ \"$lookup\": { \"from\": \"projects\", \"localField\": \"project_id\", \"foreignField\": \"_id\", \"as\": \"project\" }}, { \"$match\": { \"current_list_price\": { \"$lt\": { \"$avg\": \"$project.min_price\" }} }}]}"},
    {"prompt": "Muestra los proyectos donde la unidad más barata tiene un precio mayor a 2500 UF.", "completion": "{\"action\": \"aggregate\", \"command\": [{ \"$lookup\": { \"from\": \"stock\", \"localField\": \"_id\", \"foreignField\": \"project_id\", \"as\": \"units\" }}, { \"$match\": { \"units\": { \"$min\": \"$current_list_price\", \"$gt\": 2500 } }}]}"}
  ];

  const runTests = async () => {
    try {
      const response = await fetch('/api/run-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orgId, projId, examples }),
      });

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Error ejecutando las pruebas:', error);
    }
  };

  const handleExpandClick = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <Box sx={{ p: 5, m: 5 }}>
      <Typography variant="h4" gutterBottom>
        Pruebas de Consultas MongoDB
      </Typography>
  
      <TextField
        label="Organization ID"
        variant="outlined"
        fullWidth
        margin="normal"
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
      />
  
      <TextField
        label="Project ID (opcional)"
        variant="outlined"
        fullWidth
        margin="normal"
        value={projId}
        onChange={(e) => setProjId(e.target.value)}
      />
  
      <Button
        variant="contained"
        color="primary"
        onClick={runTests}
        sx={{ mt: 2 }}
      >
        Ejecutar Pruebas
      </Button>
  
      <Box sx={{ mt: 4 }}>
        {results && results.length > 0 ? (
          results.map((res, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>{res.prompt}</Typography>
                  <IconButton
                    onClick={() => handleExpandClick(index)}
                    aria-expanded={expandedIndex === index}
                    aria-label="show more"
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </Box>
                <Collapse in={expandedIndex === index} timeout="auto" unmountOnExit>
                  <pre>{JSON.stringify(res.result, null, 2)}</pre>
                </Collapse>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography variant="h6">No hay resultados para mostrar.</Typography>
        )}
      </Box>
    </Box>
  );
}

