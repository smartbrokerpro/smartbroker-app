// components/HeaderMapping.js

import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Card, CardContent, Typography, Box, Chip, CircularProgress
} from '@mui/material';import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';


const HeaderMapping = ({ headers, examples, onMappingComplete, selectedCompany, file, organizationId }) => {
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [projectFields, setProjectFields] = useState([]);
  const [stockFields, setStockFields] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);

  const internalFields = [
    "_id", "createdAt", "created_at", "updated_at", "updatedAt", "organization_id", 
    "project_id", "county_id", "region_id", "country_id", "location.lat", 
    "location.lng", "min_price", "max_price", "gallery", "status_id", "__v", 
    "real_estate_company_id", "typologies"
  ];

  const fieldLabels = {
    "name": "Nombre del Proyecto",
    "address": "Dirección",
    "commercialConditions": "Condiciones Comerciales",
    "delivery_date": "Fecha de Entrega",
    "deliveryDateDescr": "Descripción de Fecha de Entrega",
    "deliveryType": "Tipo de Entrega",
    "down_payment_method": "Método de Pago Inicial",
    "installments": "Cuotas",
    "promiseSignatureType": "Tipo de Firma de Promesa",
    "reservationInfo": "Información de Reserva",
    "reservationValue": "Valor de Reserva",
    "apartment": "Apartamento",
    "model": "Modelo",
    "typology": "Tipología",
    "orientation": "Orientación",
    "interior_surface": "Superficie Interior",
    "terrace_surface": "Superficie Terraza",
    "total_surface": "Superficie Total",
    "current_list_price": "Precio de Lista Actual",
    "down_payment_bonus": "Bono de Pago Inicial",
    "discount": "Descuento",
    "rent": "Renta",
    "county_name": "Nombre de la Comuna",
    "real_estate_company_name": "Nombre de la Empresa Inmobiliaria",
    "region_name": "Nombre de la Región",
    "available": "Disponibilidad",
    "project_name": "Nombre del Proyecto",
  };

  useEffect(() => {
    const fetchModelFields = async () => {
      try {
        const response = await fetch('/api/model-fields');
        const data = await response.json();

        const filteredProjectFields = data.projectFields.filter(field => !internalFields.includes(field));
        const filteredStockFields = data.stockFields.filter(field => !internalFields.includes(field));

        setProjectFields(filteredProjectFields);
        setStockFields(filteredStockFields);

        await getAISuggestions(filteredProjectFields, filteredStockFields);
      } catch (error) {
        console.error('Error fetching model fields:', error);
      }
    };

    fetchModelFields();
  }, [headers]);

  const getAISuggestions = async (projectFields, stockFields) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-mapping-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers, projectFields, stockFields }),
      });
      const suggestions = await response.json();

      const suggestionsWithExamples = {};
      for (let [header, suggestion] of Object.entries(suggestions)) {
        const index = headers.indexOf(header);
        const example = examples[index];
        suggestionsWithExamples[header] = {
          ...suggestion,
          example,
        };
      }

      setMapping(suggestionsWithExamples);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
  
    if (!destination) return;
  
    const draggedHeader = headers[source.index];
    const draggedExample = examples[source.index];
  
    const newMapping = { ...mapping };
  
    if (destination.droppableId.startsWith('project')) {
      const fieldIndex = parseInt(destination.droppableId.split('-')[1], 10);
      const fieldName = projectFields[fieldIndex];
      const previousMappedHeader = Object.keys(newMapping).find(
        (header) => newMapping[header].field === fieldName && newMapping[header].model === 'project'
      );
      if (previousMappedHeader) {
        delete newMapping[previousMappedHeader];
      }
      newMapping[draggedHeader] = { model: 'project', field: fieldName, example: draggedExample };
    } else if (destination.droppableId.startsWith('stock')) {
      const fieldIndex = parseInt(destination.droppableId.split('-')[1], 10);
      const fieldName = stockFields[fieldIndex];
      const previousMappedHeader = Object.keys(newMapping).find(
        (header) => newMapping[header].field === fieldName && newMapping[header].model === 'stock'
      );
      if (previousMappedHeader) {
        delete newMapping[previousMappedHeader];
      }
      newMapping[draggedHeader] = { model: 'stock', field: fieldName, example: draggedExample };
    }
  
    setMapping(newMapping);
    console.log('Updated mapping:', newMapping);
  };

  const handleRemoveMapping = (header) => {
    const newMapping = { ...mapping };
    delete newMapping[header];
    setMapping(newMapping);
  };

  const handleAnalyzeMapping = async () => {
    setLoading(true);
    try {
      const finalMapping = {};
      Object.keys(mapping).forEach((header) => {
        finalMapping[header] = {
          ...mapping[header],
          index: headers.indexOf(header)
        };
      });
  
      console.log("Mapping enviado al backend:", finalMapping);
  
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = event.target.result.split(',')[1];
  
        console.log('Sending data to backend:', {
          fileSize: fileContent.length,
          mappingKeys: Object.keys(finalMapping),
          selectedCompany: selectedCompany,
          organizationId: organizationId
        });
  
        const response = await fetch('/api/analyze-mapping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: fileContent,
            mapping: finalMapping,
            companyId: selectedCompany._id,
            organizationId: organizationId,
            realEstateCompanyId: selectedCompany._id
          }),
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response from server:', errorText);
          throw new Error(`Error analyzing mapping: ${errorText}`);
        }
  
        const result = await response.json();
        console.log('Analysis result from server:', result);
        setAnalysisResult(result);
        setOpenSummaryDialog(true);
      };
  
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error during analysis:', error);
      // Aquí puedes manejar el error, por ejemplo, mostrando un mensaje al usuario
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteUpdate = async () => {
    if (!analysisResult || !analysisResult.executionData) {
      console.error('No execution data available');
      return;
    }
  
    try {
      const response = await fetch('/api/execute-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...analysisResult.executionData,
          organizationId: organizationId,
          realEstateCompanyId: selectedCompany._id
        })        
      });
  
      if (!response.ok) {
        throw new Error('Failed to execute update');
      }
  
      const result = await response.json();
      console.log('Update execution simulation result:', result);
      // Aquí puedes manejar la respuesta, por ejemplo, mostrar un mensaje de éxito
    } catch (error) {
      console.error('Error executing update:', error);
      // Aquí puedes manejar el error, por ejemplo, mostrar un mensaje de error
    }
  };

  const handleComplete = () => {
    const finalMapping = {};
    Object.keys(mapping).forEach((header) => {
      finalMapping[header] = {
        ...mapping[header],
        index: headers.indexOf(header)
      };
    });
    onMappingComplete(finalMapping);
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box display="flex" justifyContent="space-between">
          <Droppable droppableId="headers">
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                width="30%"
                sx={{
                  position: 'sticky',
                  top: 0,
                  alignSelf: 'flex-start',
                  height: '100vh',
                  overflowY: 'auto',
                  paddingRight: 2,
                  borderRight: '1px solid #ccc',
                }}
              >
                <Typography variant="h6" gutterBottom>Excel Headers</Typography>
                {headers.map((header, index) => (
                  <Draggable key={header} draggableId={header} index={index}>
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{ margin: 1, paddingBottom: 0 }}
                      >
                        <Chip 
                          label={<><b>{header}</b>: <small>Ej:{examples[index]}</small></>} 
                          variant="outlined" 
                          sx={{
                            marginBottom: 0,
                            backgroundColor: mapping[header] ? '#2e7d32' : 'white',
                            color: mapping[header] ? 'white' : 'black'
                          }} 
                        />
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>

          <Box width="65%">
            <Box display="flex" width="100%">
              <Box width="50%">
                <Typography variant="h6">Project</Typography>
                {projectFields.map((field, index) => {
                  const mappedHeader = Object.keys(mapping).find(
                    (header) => mapping[header].field === field && mapping[header].model === 'project'
                  );
                  const example = mappedHeader ? mapping[mappedHeader].example : null;

                  return (
                    <Droppable key={field} droppableId={`project-${index}`}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            margin: 1,
                            padding: 1,
                            border: `2px dotted ${mappedHeader ? '#4caf50' : '#f44336'}`,
                            borderRadius: 1,
                            backgroundColor: snapshot.isDraggingOver ? '#e0f7e0' : (mappedHeader ? '#4caf50' : 'transparent'),
                            transition: 'background-color 0.2s ease',
                            minHeight: 60,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="caption" component="div" sx={{ marginBottom: 1 }}>
                            {fieldLabels[field] || field}
                          </Typography>
                          {mappedHeader ? (
                            <>
                              <Chip
                                label={mappedHeader}
                                color="success"
                                onDelete={() => handleRemoveMapping(mappedHeader)}
                                sx={{ marginBottom: 1 }}
                              />
                              {example && (
                                <small style={{ marginTop: '1rem' }}>
                                  Ejemplo: {example}
                                </small>
                              )}
                            </>
                          ) : (
                            <></>
                          )}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  );
                })}
              </Box>

              <Box width="50%">
                <Typography variant="h6">Stock</Typography>
                {stockFields.map((field, index) => {
                  const mappedHeader = Object.keys(mapping).find(
                    (header) => mapping[header].field === field && mapping[header].model === 'stock'
                  );
                  const example = mappedHeader ? mapping[mappedHeader].example : null;

                  return (
                    <Droppable key={field} droppableId={`stock-${index}`}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            margin: 1,
                            padding: 1,
                            border: `2px dotted ${mappedHeader ? '#4caf50' : '#f44336'}`,
                            borderRadius: 1,
                            backgroundColor: snapshot.isDraggingOver ? '#e0f7e0' : (mappedHeader ? '#4caf50' : 'transparent'),
                            transition: 'background-color 0.2s ease',
                            minHeight: 60,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="caption" component="div" sx={{ marginBottom: 1 }}>
                            {fieldLabels[field] || field}
                          </Typography>
                          {mappedHeader ? (
                            <>
                              <Chip
                                label={mappedHeader}
                                color="success"
                                onDelete={() => handleRemoveMapping(mappedHeader)}
                                sx={{ marginBottom: 1 }}
                              />
                              {example && (
                                <small style={{ marginTop: "1rem", textAlign:'center' }}>
                                  Ejemplo: {example}
                                </small>
                              )}
                            </>
                          ) : (
                            <></>
                          )}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      </DragDropContext>

      <Button onClick={handleAnalyzeMapping} variant="contained" color="primary" sx={{ mt: 2 }}>
        Analyze Mapping
      </Button>

      <Dialog open={openSummaryDialog} onClose={() => setOpenSummaryDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Summary of Analysis</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Overall Summary</Typography>
            <Grid container spacing={2}>
              {Object.entries(analysisResult?.summary || {}).map(([key, value]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Typography>
                      <Typography variant="h4">{value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>Detailed Project Summary</Typography>
            <Grid container spacing={2}>
              {analysisResult?.detailedProjectSummary?.map((project, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {project.projectName} {project.isNewProject ? "(New Project)" : "(Existing Project)"}
                      </Typography>
                      <Typography>New Units: {project.newUnits}</Typography>
                      <Typography>Updated Units: {project.updatedUnits}</Typography>
                      <Typography>Units to Mark Unavailable: {project.unavailableUnits}</Typography>
                      <Typography>Total Affected Units: {project.totalUnits}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {analysisResult?.errors && analysisResult.errors.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Errors</Typography>
              <Card>
                <CardContent>
                  <Typography component="ul">
                    {analysisResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSummaryDialog(false)}>Close</Button>
          <Button onClick={handleExecuteUpdate} color="primary" variant="contained">
            Execute Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HeaderMapping;