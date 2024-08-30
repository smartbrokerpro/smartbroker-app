import React, { useState, useEffect } from 'react';
import { 
  List, ListItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Card, CardContent, Typography, Box, Chip, CircularProgress, Modal, Alert
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import StarIcon from '@mui/icons-material/Star';
import ErrorIcon from '@mui/icons-material/Error';

const HeaderMapping = ({ headers, examples, onMappingComplete, selectedCompany, file, organizationId }) => {
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [projectFields, setProjectFields] = useState([]);
  const [stockFields, setStockFields] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [missingCounties, setMissingCounties] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const requiredFields = ['apartment', 'name', 'county_name', 'address', 'typology', 'orientation', 'current_list_price'];

  const isFieldRequired = (field) => requiredFields.includes(field);

  const isRequiredFieldsMapped = () => {
    return requiredFields.every(field => {
      if (field === 'county_name') {
        return Object.values(mapping).some(mappedField => 
          mappedField.field === field && mappedField.model === 'project'
        );
      }
      return Object.values(mapping).some(mappedField => 
        mappedField.field === field
      );
    });
  };

  const hiddenInStockFields = ['county_name', 'available', 'real_estate_company_name', 'region_name'];

  const internalFields = [
    "_id", "createdAt", "created_at", "updated_at", "updatedAt", "organization_id", 
    "project_id", "county_id", "region_id", "country_id", "location.lat", 
    "location.lng", "min_price", "max_price", "gallery", "status_id", "__v", 
    "real_estate_company_id", "typologies", "project_name", "delivery_date"
  ];

  const combinedStockFields = stockFields.filter(field => 
    !internalFields.includes(field) && !hiddenInStockFields.includes(field)
  );

  const fieldLabels = {
    "name": "Nombre del Proyecto",
    "address": "Dirección",
    "commercialConditions": "Condiciones Comerciales",
    "delivery_date": "Fecha de Entrega",
    "deliveryDateDescr": "Fecha de Entrega",
    "deliveryType": "Tipo de Entrega",
    "down_payment_method": "Método de Pago Inicial",
    "installments": "Cuotas",
    "promiseSignatureType": "Tipo de Firma de Promesa",
    "reservationInfo": "Información de Reserva",
    "reservationValue": "Valor de Reserva",
    "apartment": "Unidad",
    "model": "Modelo",
    "typology": "Tipología",
    "orientation": "Orientación",
    "interior_surface": "Superficie Interior",
    "terrace_surface": "Superficie Terraza",
    "total_surface": "Superficie Total",
    "current_list_price": "Precio de Lista",
    "down_payment_bonus": "Bono Pie",
    "downPaymentMethod": "Método de Pago Bono Pie",
    "discount": "Descuento",
    "rent": "Valor Arriendo",
    "county_name": "Comuna",
    "real_estate_company_name": "Inmobiliaria",
    "region_name": "Región",
    "available": "Disponibilidad",
    "project_name": "Nombre del Proyecto",
    "reservationInfo.text": "Información de reserva",
    "reservationInfo.hyperlink": "Link de reserva"
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
        const normalizedModel = suggestion.model === 'proyecto' ? 'project' : suggestion.model;
        
        suggestionsWithExamples[header] = {
          ...suggestion,
          modelo: normalizedModel,
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
    if (!isRequiredFieldsMapped()) {
      alert('Por favor, asigne todos los campos requeridos antes de analizar.');
      return;
    }

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
            realEstateCompanyId: selectedCompany._id,
            realEstateCompanyName: selectedCompany.name
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
  
    setIsExecuting(true); // Deshabilitar el botón y mostrar CircularProgress
  
    try {
      const response = await fetch('/api/execute-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...analysisResult.executionData,
          organizationId: organizationId,
          realEstateCompanyId: selectedCompany._id,
          realEstateCompanyName: selectedCompany.name
        })        
      });
  
      if (!response.ok) {
        throw new Error('Failed to execute update');
      }
  
      const result = await response.json();
      console.log('Update execution result:', result);
  
      // Check for missing counties and set the alert message
      if (result.result.missingCounties && result.result.missingCounties.length > 0) {
        const missingDetails = result.result.missingCounties.map(
          (item) => `Comuna: ${item.countyName} en Proyecto: ${item.projectName}`
        ).join('\n');
  
        setAlertMessage(`Actualización completada con éxito.\nProyectos creados: ${result.result.projectsCreated}, Unidades creadas: ${result.result.unitsCreated}.\n\nErrores:\n${missingDetails}`);
      } else {
        setAlertMessage(`Actualización completada con éxito.\nProyectos creados: ${result.result.projectsCreated}, Unidades creadas: ${result.result.unitsCreated}`);
      }
  
      setOpenSummaryDialog(false); // Cerrar el diálogo de resumen
      setShowAlert(true); // Mostrar alerta de éxito
  
      setMapping({});
      setAnalysisResult(null);
    } catch (error) {
      console.error('Error executing update:', error);
      setAlertMessage('Error ejecutando la actualización.');
      setShowAlert(true);
    } finally {
      setIsExecuting(false); // Rehabilitar el botón y ocultar CircularProgress
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
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
                  zIndex:'999'
                }}
              >
                <Typography variant="h6" gutterBottom>Excel Headers</Typography>
                {headers.map((header, index) => (
                  <Draggable key={header} draggableId={header} index={index}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          zIndex: snapshot.isDragging ? 9000 : 'auto'
                        }}
                        sx={{ margin: 1, paddingBottom: 0 }}
                      >
                        <Chip 
                          label={<><b>{header}</b>: <small>Ej:{examples[index]}</small></>} 
                          variant="outlined" 
                          sx={{
                            transition:'.3s all',
                            marginBottom: 0,
                            backgroundColor: mapping[header] ? '#6CD63F' : 'white',
                            color: mapping[header] ? 'black' : 'black',
                            zIndex: snapshot.isDragging ? 9000 : 'auto',
                            boxShadow: snapshot.isDragging ? '0px 15px 5px rgba(0,0,0,0.25)' : '0px 0px 0px rgba(0,0,0,0.25)',
                            transform: snapshot.isDragging ? 'scale(1.25)' : 'scale(1)'
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
                            border: `2px dotted ${mappedHeader ? '#6CD63F' : '#D6993E'}`,
                            borderRadius: 1,
                            backgroundColor: snapshot.isDraggingOver ? '#6CD63F33' : (mappedHeader ? '#6CD63F' : 'transparent'),
                            transition: 'background-color 0.2s ease',
                            minHeight: 60,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}
                        >
                          {isFieldRequired(field) && (
                            <StarIcon 
                              sx={{ 
                                position: 'absolute', 
                                top: 5, 
                                right: 5, 
                                color: mappedHeader ? 'white' : 'orange'
                              }} 
                            />
                          )}
                          <Typography variant="caption" component="div" sx={{ marginBottom: 1 }}>
                            {fieldLabels[field] || field}
                          </Typography>
                          {mappedHeader ? (
                            <>
                              <Chip
                                label={mappedHeader}
                                color="success"
                                onDelete={() => handleRemoveMapping(mappedHeader)}
                                sx={{ 
                                  marginBottom: 1,
                                  backgroundColor: '#6AAC4E',
                                 }}
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
                {combinedStockFields.map((field, index) => {
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
                            border: `2px dotted ${mappedHeader ? '#6CD63F' : '#D6993E'}`,
                            borderRadius: 1,
                            backgroundColor: snapshot.isDraggingOver ? '#6CD63F33' : (mappedHeader ? '#6CD63F' : 'transparent'),
                            transition: 'background-color 0.2s ease',
                            minHeight: 60,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}
                        >
                          {isFieldRequired(field) && (
                            <StarIcon 
                              sx={{ 
                                position: 'absolute', 
                                top: 5, 
                                right: 5, 
                                color: mappedHeader ? 'white' : 'orange'
                              }} 
                            />
                          )}
                          <Typography variant="caption" component="div" sx={{ marginBottom: 1 }}>
                            {fieldLabels[field] || field}
                          </Typography>
                          {mappedHeader ? (
                            <>
                              <Chip
                                label={mappedHeader}
                                color="success"
                                onDelete={() => handleRemoveMapping(mappedHeader)}
                                sx={{ 
                                  marginBottom: 1,
                                  backgroundColor: '#6AAC4E',
                                }}                              />
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
  
      <Button 
        onClick={handleAnalyzeMapping} 
        variant="contained" 
        color="primary" 
        sx={{ mt: 2 }}
        disabled={!isRequiredFieldsMapped()}
      >
        Analyze Mapping
      </Button>
  
      <Dialog open={openSummaryDialog} onClose={() => setOpenSummaryDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#6AAC4E', color: 'white' }}>Resumen del Análisis</DialogTitle>
        <DialogContent sx={{ mt: 4 }}>
          {analysisResult ? (
            <Box sx={{ mb: 4 }}>
              {/* Sección de Proyectos */}
              <Typography variant="h6" gutterBottom>Proyectos</Typography>
              <Grid container spacing={2}>
                {Object.entries(analysisResult.summary || {})
                  .filter(([key]) => key.toLowerCase().includes('project'))
                  .map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Card sx={{ borderLeft: '5px solid #6AAC4E' }}>
                        <CardContent>
                          <Typography variant="subtitle1" color="textSecondary">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Typography>
                          <Typography variant="h5" sx={{ color: '#6AAC4E', fontWeight: 'bold' }}>
                            {value}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                ))}
              </Grid>

              {/* Sección de Unidades */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>Unidades</Typography>
                <Grid container spacing={2}>
                  {Object.entries(analysisResult.summary || {})
                    .filter(([key]) => key.toLowerCase().includes('unit'))
                    .map(([key, value]) => (
                      <Grid item xs={12} sm={6} md={4} key={key}>
                        <Card sx={{ borderLeft: '5px solid #D6993E' }}>
                          <CardContent>
                            <Typography variant="subtitle1" color="textSecondary">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#D6993E', fontWeight: 'bold' }}>
                              {value}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Resumen Detallado por Proyecto */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>Resumen Detallado por Proyecto</Typography>
                <Grid container spacing={2}>
                  {analysisResult.detailedProjectSummary?.map((project, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ position: 'relative', borderLeft: `5px solid ${project.isNewProject ? '#6AAC4E' : '#D6993E'}`, padding: 2 }}>
                        <CardContent>
                          <Typography variant="h6" component="div" sx={{ textAlign: 'center', color: '#6AAC4E', position: 'relative', marginBottom: 2 }}>
                            {project.projectName}
                            <Typography
                              variant="caption"
                              component="sup"
                              sx={{ position: 'absolute', top: -5, right: 0, color: project.isNewProject ? '#6AAC4E' : '#D6993E' }}
                            >
                              {project.isNewProject ? 'NEW' : 'UPDATED'}
                            </Typography>
                          </Typography>
                          
                          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', marginBottom: 2 }}>
                            <Box component="tbody">
                              <Box component="tr">
                                <Box component="th" sx={{ padding: '4px 8px', textAlign: 'right' }}>
                                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    Nuevas
                                  </Box>
                                </Box>
                                <Box component="td" sx={{ padding: '4px 8px', textAlign: 'left', color: '#6AAC4E', fontWeight: 'bold', fontSize: '1.5rem' }}>
                                  {project.newUnits}
                                </Box>
                              </Box>

                              <Box component="tr">
                                <Box component="th" sx={{ padding: '4px 8px', textAlign: 'right' }}>
                                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    Actualizadas
                                  </Box>
                                </Box>
                                <Box component="td" sx={{ padding: '4px 8px', textAlign: 'left', color: '#D6993E', fontWeight: 'bold', fontSize: '1.5rem' }}>
                                  {project.updatedUnits}
                                </Box>
                              </Box>

                              <Box component="tr">
                                <Box component="th" sx={{ padding: '4px 8px', textAlign: 'right' }}>
                                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    No Disponible
                                  </Box>
                                </Box>
                                <Box component="td" sx={{ padding: '4px 8px', textAlign: 'left', color: 'error.main', fontWeight: 'bold', fontSize: '1.5rem' }}>
                                  {project.unavailableUnits}
                                </Box>
                              </Box>

                              <Box component="tr" sx={{ borderTop: '1px solid #ddd', marginTop: 2 }}>
                                <Box component="th" sx={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                                  Total
                                </Box>
                                <Box component="td" sx={{ padding: '4px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '1.5rem' }}>
                                  {project.totalUnits}
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>

                    </Grid>
                  ))}
                </Grid>

              </Box>

              {/* Sección de Errores */}
              {analysisResult.errors && analysisResult.errors.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>Errores</Typography>
                  <Card sx={{ borderLeft: '5px solid #D32F2F' }}>
                    <CardContent>
                      <List>
                        {analysisResult.errors.map((error, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <ErrorIcon sx={{ color: '#D32F2F' }} />
                            </ListItemIcon>
                            <ListItemText primary={error} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body1">No hay resultados de análisis disponibles.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#F5F5F5' }}>
          <Button onClick={() => setOpenSummaryDialog(false)} sx={{ color: '#6AAC4E' }}>Cerrar</Button>
          <Button onClick={handleExecuteUpdate} color="primary" variant="contained" disabled={isExecuting}>
            {isExecuting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Ejecutar Actualización'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Modal for Result Summary */}
      <Modal open={showAlert} onClose={handleCloseAlert}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography variant="h6" component="h2">
            {alertMessage}
          </Typography>
          <Button onClick={handleCloseAlert} variant="contained" color="primary" sx={{ mt: 2 }}>
            Cerrar
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default HeaderMapping;
