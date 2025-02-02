'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Modal, Box, Table, TableContainer, TableHead, TableBody, TableRow, TableCell, Typography, FormControl, InputLabel, Select, MenuItem, Paper, CircularProgress, Button, TextField } from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Utility Components
const TableCellContent = ({ ufValue, value, secondaryValue }) => (
  <TableCell sx={{ textAlign: 'center' }}>
    {value}
    {secondaryValue && (
      <Typography variant="caption" color="text.secondary" display="block">
        {secondaryValue}
      </Typography>
    )}
  </TableCell>
);

// Extracted Header Component
const ProjectHeader = ({ project, state, setState, getSelectedUnit, handleTypologyChange, totalProjects }) => (
  <TableCell 
    width={`${100/totalProjects}%`}
    sx={{ bgcolor: 'background.default', textAlign: 'center' }}
  >
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {project.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {getSelectedUnit(project._id)?.county_name || '-'}
      </Typography>
      
      <PrintableProjectInfo 
        selectedUnit={getSelectedUnit(project._id)}
        selectedTypology={state.selectedTypology[project._id]}
      />

      <ProjectSelectors 
        project={project}
        state={state}
        setState={setState}
        handleTypologyChange={handleTypologyChange}
      />
    </Box>
  </TableCell>
);

// Print-only Project Info
const PrintableProjectInfo = ({ selectedUnit, selectedTypology }) => (
  <Box sx={{ display: 'none', '@media print': { display: 'block' } }}>
    <Typography variant="body2" sx={{ mb: 1 }}>
      Unidad: <Typography component="span" sx={{ fontWeight: 'bold' }}>
        {selectedUnit?.apartment || '-'}
      </Typography>
    </Typography>
    <Typography variant="body2">
      Tipología: <Typography component="span" sx={{ fontWeight: 'bold' }}>
        {selectedTypology || '-'}
      </Typography>
    </Typography>
  </Box>
);

// Project Selection Controls
const ProjectSelectors = ({ project, state, setState, handleTypologyChange }) => (
  <Box sx={{ '@media print': { display: 'none' } }}>
    <FormControl fullWidth size="small">
      <InputLabel shrink sx={{ bgcolor: 'background.default', px: 1 }}>
        Unidad
      </InputLabel>
      <Select
        displayEmpty
        notched
        value={state.selectedUnit[project._id] || ''}
        onChange={(e) => setState(prev => ({
          ...prev,
          selectedUnit: { ...prev.selectedUnit, [project._id]: e.target.value }
        }))}
        disabled={!state.selectedTypology[project._id]}
      >
        {state.projectUnits[project._id]
          ?.filter(u => u.typology === state.selectedTypology[project._id])
          .sort((a, b) => a.apartment - b.apartment)
          .map((unit) => (
            <MenuItem key={unit._id} value={unit._id}>
              {`${unit.apartment}`} <Typography sx={{pl:1}} component="span" variant="caption" color="text.secondary">
                {`(${unit.total_surface}m² - ${unit.orientation})`}
              </Typography>
            </MenuItem>
          ))}
      </Select>
    </FormControl>

    <FormControl fullWidth size="small" sx={{ mt: 2 }}>
      <InputLabel shrink sx={{ bgcolor: 'background.default', px: 1 }}>
        Tipología
      </InputLabel>
      <Select
        displayEmpty
        notched
        value={state.selectedTypology[project._id] || ''}
        onChange={(e) => handleTypologyChange(project._id, e.target.value)}
      >
        {[...new Set(state.projectUnits[project._id]?.map(u => u.typology))]
          .sort()
          .map((type) => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
      </Select>
    </FormControl>
  </Box>
);

// Organization Header for Print
const OrganizationHeader = ({ session, state }) => (
  <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 4 } }}>
    <TableContainer component={Paper} sx={{ mb: 4 }}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell sx={{ borderBottom: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <img src={session.user.organization.logo} alt="Logo" style={{ height: '50px' }} />
                <Box>
                  <Typography variant="h6">{session.user.organization.name}</Typography>
                  <Typography variant="body2">{session.user.organization.address}</Typography>
                </Box>
              </Box>
            </TableCell>
            <TableCell sx={{ borderBottom: 'none', textAlign: 'right' }}>
              <Typography variant="body2">Ejecutivo: {session.user.name}</Typography>
              <Typography variant="body2">Valor UF: ${state.ufValue?.toLocaleString('es-CL')}</Typography>
              <Typography variant="body2">
                Fecha: {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

// Table Footer Controls
const TableFooterControls = ({ state, setState }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        label="Tasa Anual (%)"
        type="number"
        value={state.tasaAnual}
        onChange={(e) => setState(prev => ({
          ...prev,
          tasaAnual: Math.min(7.0, Math.max(1.0, parseFloat(e.target.value)))
        }))}
        inputProps={{
          step: 0.1,
          min: 1.0,
          max: 7.0
        }}
        size="small"
        sx={{ width: 150 }}
      />
      <FormControl size="small" sx={{ width: 150 }}>
        <InputLabel>Plazo (años)</InputLabel>
        <Select
          value={state.plazoAnos}
          onChange={(e) => setState(prev => ({
            ...prev,
            plazoAnos: e.target.value
          }))}
          label="Plazo (años)"
        >
          {[5, 10, 15, 20, 25, 30].map(years => (
            <MenuItem key={years} value={years}>{years}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
    <Typography variant="caption" color="text.secondary">
      Valor UF: ${state.ufValue?.toLocaleString('es-CL')} al {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
    </Typography>
  </Box>
);

// Action Buttons
const ActionButtons = ({ handlePrint, onClose, loading }) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    mt: 3,
    borderTop: 1,
    borderColor: 'divider',
    pt: 2,
    '@media print': { display: 'none' }
  }}>
    <Button
      variant="contained"
      onClick={handlePrint}
      startIcon={<PrintIcon />}
      disabled={loading}
    >
      Imprimir
    </Button>
    <Button
      variant="outlined"
      onClick={onClose}
      startIcon={<CloseIcon />}
    >
      Cerrar
    </Button>
  </Box>
);

const extractPercentage = (conditions, type, defaultValue) => {
  const match = conditions?.match(new RegExp(`${type} (\\d+)%`));
  return match ? parseInt(match[1]) / 100 : defaultValue;
};

const calculatePriceInfo = (unit, ufValue, piePercentage, cuotonPercentage) => {
  const precioFinalUF = unit.current_list_price;
  const precioFinalCLP = precioFinalUF * ufValue;
  const pieUF = precioFinalUF * piePercentage;
  const cuotonUF = precioFinalUF * cuotonPercentage;
  const hipotecarioUF = precioFinalUF - pieUF - cuotonUF;
  const pieCLP = pieUF * ufValue;
  const cuotonCLP = cuotonUF * ufValue;
  const hipotecarioCLP = hipotecarioUF * ufValue;

  return {
    precioFinalUF,
    precioFinalCLP,
    pieUF,
    pieCLP,
    cuotonUF,
    cuotonCLP,
    hipotecarioUF,
    hipotecarioCLP
  };
};

const calculateDividendo = (hipotecarioUF, tasaAnual, plazoAnos, ufValue) => {
  const tasaMensual = (tasaAnual / 100) / 12;
  const plazoMeses = plazoAnos * 12;
  const dividendoUF = hipotecarioUF * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / (Math.pow(1 + tasaMensual, plazoMeses) - 1);
  return {
    dividendoUF,
    dividendoCLP: dividendoUF * ufValue
  };
};

// Main Component
const CompareModal = ({ open, onClose, selectedProjects, session }) => {
  const [state, setState] = useState({
    projectDetails: [],
    projectUnits: {},
    selectedTypology: {},
    selectedUnit: {},
    loading: true,
    ufValue: null,
    tasaAnual: 4.0,
    plazoAnos: 25
  });

  const printComponentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: 'Comparador de propiedades',
    pageStyle: `
      @page {
        size: auto;
        margin: 20mm;
      }
      @media print {
        html, body {
          height: initial !important;
          overflow: initial !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background-color: white !important;
        }
        table {
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
      }
    `
  });

  const getSelectedUnit = (projectId) => {
    return state.projectUnits[projectId]?.find(unit => unit._id === state.selectedUnit[projectId]);
  };

  const getProjectDetails = (projectId) => {
    return state.projectDetails.find(detail => detail._id === projectId);
  };

  const handleTypologyChange = (projectId, value) => {
    setState(prev => {
      const filteredUnits = prev.projectUnits[projectId]?.filter(u => u.typology === value);
      return {
        ...prev,
        selectedTypology: {
          ...prev.selectedTypology,
          [projectId]: value
        },
        selectedUnit: {
          ...prev.selectedUnit,
          [projectId]: filteredUnits?.[0]?._id
        }
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!open || selectedProjects.length === 0) return;
      setState(prev => ({ ...prev, loading: true }));

      try {
        const [ufResponse, ...projectResponses] = await Promise.all([
          fetch("/api/getUF"),
          ...selectedProjects.map(project => 
            fetch(`/api/projects/details/${project._id}?organizationId=${session.user.organization._id}`)
          )
        ]);

        const ufData = await ufResponse.json();
        const ufValue = parseFloat(ufData.UFs[0].Valor.replace(".", "").replace(",", "."));

        const projectDetailsData = await Promise.all(
          projectResponses.map(async response => {
            const data = await response.json();
            return data.data;
          })
        );

        const units = {};
        const typologies = {};
        const selectedUnits = {};

        for (const project of selectedProjects) {
          const response = await fetch(`/api/projects/${project._id}/stock?organizationId=${session.user.organization._id}`);
          const data = await response.json();
          units[project._id] = data.data;

          if (data.data.length > 0) {
            const projectTypologies = [...new Set(data.data.map(u => u.typology))].sort();
            typologies[project._id] = projectTypologies[0];
            const firstUnitOfTypology = data.data.find(u => u.typology === projectTypologies[0]);
            selectedUnits[project._id] = firstUnitOfTypology?._id;
          }
        }

        setState(prev => ({
          ...prev,
          projectDetails: projectDetailsData,
          projectUnits: units,
          selectedTypology: typologies,
          selectedUnit: selectedUnits,
          ufValue,
          loading: false
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [open, selectedProjects]);


  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        overflowY: 'auto',
        borderRadius: 1
      }}>
        {state.loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            <div ref={printComponentRef}>
              <OrganizationHeader session={session} state={state} />
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width="140px" sx={{ bgcolor: 'background.default', textAlign: 'center' }}></TableCell>
                      {selectedProjects.map((project) => (
                        <ProjectHeader 
                          key={project._id}
                          project={project}
                          state={state}
                          setState={setState}
                          getSelectedUnit={getSelectedUnit}
                          handleTypologyChange={handleTypologyChange}
                          totalProjects={selectedProjects.length}
                        />
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>

                  <TableRow sx={{ display: 'none', '@media print': { display: 'table-row' } }}>
                        <TableCell sx={{ textAlign: 'center' }}>Orientación</TableCell>
                        {selectedProjects.map((project) => {
                            const unit = getSelectedUnit(project._id);
                            return (
                                <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                                    {unit ? unit.orientation : '-'}
                                </TableCell>
                            );
                        })}
                    </TableRow>


                    {/* <TableRow>
                      <TableCell sx={{ textAlign: 'center' }}>Comuna</TableCell>
                      {selectedProjects.map((project) => (
                        <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                          {getSelectedUnit(project._id)?.county_name || '-'}
                        </TableCell>
                      ))}
                    </TableRow> */}

                    <TableRow>
                      <TableCell sx={{ textAlign: 'center' }}>Superficie</TableCell>
                      {selectedProjects.map((project) => {
                        const unit = getSelectedUnit(project._id);
                        return (
                          <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                            <Typography variant="body2">
                              Total: {unit ? `${unit.total_surface}m²` : '-'}
                            </Typography>
                            <Typography variant="body2">
                              Interior: {unit ? `${unit.interior_surface}m²` : '-'}
                            </Typography>
                            <Typography variant="body2">
                              Terraza: {unit ? `${unit.terrace_surface}m²` : '-'}
                            </Typography>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    
                    <TableRow>
                      <TableCell sx={{ textAlign: 'center' }}>Valor Reserva</TableCell>
                      {selectedProjects.map((project) => (
                        <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                          {getProjectDetails(project._id)?.reservationValue ? 
                            `$${getProjectDetails(project._id).reservationValue.toLocaleString('es-CL')}` : 
                            '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ textAlign: 'center' }}>Pie</TableCell>
                        {selectedProjects.map((project) => {
                            const unit = getSelectedUnit(project._id);
                            const details = getProjectDetails(project._id);
                            if (!unit || !details) return <TableCell key={project._id}>-</TableCell>;
                            
                            const piePercentage = extractPercentage(details.commercialConditions, 'Pie', 0.03);
                            const priceInfo = calculatePriceInfo(unit, state.ufValue, piePercentage, 0);
                            
                            return (
                            <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                                {`${(piePercentage * 100).toFixed(1)}%`}
                                <Typography variant="body2">
                                {`${priceInfo.pieUF.toFixed(1)} UF`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                {`$${Math.round(priceInfo.pieCLP).toLocaleString('es-CL')}`}
                                </Typography>
                            </TableCell>
                            );
                        })}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ textAlign: 'center' }}>Cuotas Pie</TableCell>
                      {selectedProjects.map((project) => (
                        <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                          {getProjectDetails(project._id)?.downPaymentMethod === 'Forpay' ? '12' : '1'}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ textAlign: 'center' }}>Valor Cuota Pie</TableCell>
                        {selectedProjects.map((project) => {
                            const unit = getSelectedUnit(project._id);
                            const details = getProjectDetails(project._id);
                            if (!unit || !details) return <TableCell key={project._id}>-</TableCell>;

                            const piePercentage = extractPercentage(details.commercialConditions, 'Pie', 0.03);
                            const priceInfo = calculatePriceInfo(unit, state.ufValue, piePercentage, 0);
                            const cuotas = details.downPaymentMethod === 'Forpay' ? 12 : 1;
                            const valorCuotaUF = priceInfo.pieUF / cuotas;
                            const valorCuotaCLP = priceInfo.pieCLP / cuotas;

                            return (
                            <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                                {`${valorCuotaUF.toFixed(1)} UF`}
                                <Typography variant="caption" color="text.secondary" display="block">
                                {`$${Math.round(valorCuotaCLP).toLocaleString('es-CL')}`}
                                </Typography>
                            </TableCell>
                            );
                        })}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ textAlign: 'center' }}>Bono Pie</TableCell>
                      {selectedProjects.map((project) => (
                        <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                          {`${(extractPercentage(getProjectDetails(project._id)?.commercialConditions, 'Bono Pie', 0) * 100).toFixed(1)}%`}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ textAlign: 'center' }}>Cuotón</TableCell>
                        {selectedProjects.map((project) => {
                        const unit = getSelectedUnit(project._id);
                        const details = getProjectDetails(project._id);
                        if (!unit || !details) return <TableCell key={project._id}>-</TableCell>;
                        
                        const cuotonPercentage = extractPercentage(details.commercialConditions, 'Cuotón', 0.02);
                        const priceInfo = calculatePriceInfo(unit, state.ufValue, 0, cuotonPercentage);
                        
                        return (
                            <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                            {`${(cuotonPercentage * 100).toFixed(1)}%`}
                            <Typography variant="body2">
                                {`${priceInfo.cuotonUF.toFixed(1)} UF`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {`$${Math.round(priceInfo.cuotonCLP).toLocaleString('es-CL')}`}
                            </Typography>
                            </TableCell>
                        );
                        })}
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ textAlign: 'center' }}>Precio Lista</TableCell>
                        {selectedProjects.map((project) => {
                        const unit = getSelectedUnit(project._id);
                        if (!unit) return <TableCell key={project._id}>-</TableCell>;
                        const precioListaCLP = unit.current_list_price * state.ufValue;
                        return (
                            <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                            {`${unit.current_list_price.toFixed(1)} UF`}
                            <Typography variant="caption" color="text.secondary" display="block">
                                {`$${Math.round(precioListaCLP).toLocaleString('es-CL')}`}
                            </Typography>
                            </TableCell>
                        );
                        })}
                    </TableRow>

                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
                        Valor Hipotecario
                        </TableCell>
                        {selectedProjects.map((project) => {
                        const unit = getSelectedUnit(project._id);
                        const details = getProjectDetails(project._id);
                        if (!unit || !details) return <TableCell key={project._id}>-</TableCell>;
                        
                        const piePercentage = extractPercentage(details.commercialConditions, 'Pie', 0.03);
                        const cuotonPercentage = extractPercentage(details.commercialConditions, 'Cuotón', 0.02);
                        const priceInfo = calculatePriceInfo(unit, state.ufValue, piePercentage, cuotonPercentage);
                        
                        return (
                            <TableCell key={project._id} sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
                            {`${priceInfo.hipotecarioUF.toFixed(1)} UF`}
                            <Typography variant="caption" color="text.secondary" display="block">
                                {`$${Math.round(priceInfo.hipotecarioCLP).toLocaleString('es-CL')}`}
                            </Typography>
                            </TableCell>
                        );
                        })}
                    </TableRow>

                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
                            Dividendo Estimado
                        </TableCell>
                        {selectedProjects.map((project) => {
                            const unit = getSelectedUnit(project._id);
                            const details = getProjectDetails(project._id);
                            if (!unit || !details) return <TableCell key={project._id}>-</TableCell>;
                            
                            const piePercentage = extractPercentage(details.commercialConditions, 'Pie', 0.03);
                            const cuotonPercentage = extractPercentage(details.commercialConditions, 'Cuotón', 0.02);
                            const priceInfo = calculatePriceInfo(unit, state.ufValue, piePercentage, cuotonPercentage);
                            const dividendoInfo = calculateDividendo(priceInfo.hipotecarioUF, state.tasaAnual, state.plazoAnos, state.ufValue);
                            
                            return (
                                <TableCell key={project._id} sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
                                    {`${dividendoInfo.dividendoUF.toFixed(1)} UF`}
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {`$${Math.round(dividendoInfo.dividendoCLP).toLocaleString('es-CL')}`}
                                    </Typography>
                                </TableCell>
                            );
                        })}
                    </TableRow>

                    {/* Nuevas filas solo para impresión */}
                    <TableRow sx={{ display: 'none', '@media print': { display: 'table-row' } }}>
                        <TableCell sx={{ textAlign: 'center' }}>Tasa Anual</TableCell>
                        {selectedProjects.map((project) => (
                            <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                                {state.tasaAnual}%
                            </TableCell>
                        ))}
                    </TableRow>
                    <TableRow sx={{ display: 'none', '@media print': { display: 'table-row' } }}>
                        <TableCell sx={{ textAlign: 'center' }}>Plazo Crédito</TableCell>
                        {selectedProjects.map((project) => (
                            <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                                {state.plazoAnos} años
                            </TableCell>
                        ))}
                    </TableRow>
                    </TableBody>

                    <tfoot>
                        <TableRow sx={{ '@media print': { display: 'none !important' } }}>
                            <TableCell colSpan={selectedProjects.length + 1}>
                                <TableFooterControls state={state} setState={setState} />
                            </TableCell>
                        </TableRow>
                    </tfoot>
                </Table>
              </TableContainer>
            </div>
            <ActionButtons handlePrint={handlePrint} onClose={onClose} loading={state.loading} />
          </>
        )}
      </Box>
    </Modal>
  );
};

export default CompareModal;