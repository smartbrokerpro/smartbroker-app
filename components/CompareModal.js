'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Modal, Box, Table, TableContainer, TableHead, TableBody, TableRow, TableCell, Typography, FormControl, InputLabel, Select, MenuItem, Paper, CircularProgress, Button, ButtonGroup } from '@mui/material';
import { Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculatePriceInfo, calculateDividendo, formatSurface, TableCellContent, TableFooterControls, ActionButtons, OrganizationHeader, ProjectHeader, ComparativaDividendos, calculateComparativaDividendos } from '@/utils/compareUtils';
import { Editor } from '@tinymce/tinymce-react';
import DOMPurify from 'dompurify';


// Main Component
const CompareModal = ({ open, onClose, selectedProjects, session }) => {
  const [state, setState] = useState({
    projectDetails: [],
    projectUnits: {},
    selectedTypology: {},
    selectedUnit: {},
    loading: true,
    ufValue: null,
    tasaAnual: 4.5,
    plazoAnos: 25,
    projectErrors: {},
    errorMessage: '',
    discountType: {},
  });

  const [notesDialogs, setNotesDialogs] = useState({});
  const [projectNotes, setProjectNotes] = useState({});

  const handleNotesDialogToggle = (projectId) => {
      setNotesDialogs(prev => ({
          ...prev,
          [projectId]: !prev[projectId]
      }));
  };

  const handleNotesChange = (projectId, content) => {
      setProjectNotes(prev => ({
          ...prev,
          [projectId]: content
      }));
  };

  const handleSaveNotes = (projectId) => {
      // Aquí podrías sanitizar el contenido si lo necesitas
      const sanitizedContent = DOMPurify.sanitize(projectNotes[projectId]);
      setProjectNotes(prev => ({
          ...prev,
          [projectId]: sanitizedContent
      }));
      handleNotesDialogToggle(projectId);
  };

  const [openDialogs, setOpenDialogs] = useState({});
  const handleDialogToggle = (projectId) => {
    setOpenDialogs(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  }

  const printComponentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: 'Comparador de propiedades',
    pageStyle: `
      @page {
        size: auto;
        margin: 10mm;
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

  const formatSurface = (value) => {
    if (!value) return '0.00';
    // Si el valor es string y usa coma como decimal, reemplazarlo por punto
    const normalizedValue = typeof value === 'string' ? value.replace(',', '.') : value;
    const num = Number(normalizedValue);
    return !isNaN(num) ? num.toFixed(2) : '0.00';
};

  const getSelectedUnit = (projectId) => {
    return state.projectUnits[projectId]?.find(unit => unit._id === state.selectedUnit[projectId]);
  };

  const getProjectDetails = (projectId) => {
    if (state.projectErrors[projectId]) return null;
    return state.projectDetails?.find(detail => detail?._id === projectId);
  };

  const handleTypologyChange = (projectId, value) => {
    setState(prev => {
      const filteredUnits = prev.projectUnits[projectId]?.filter(u => u.typology === value);
      const cheapestUnit = filteredUnits?.sort((a, b) => a.current_list_price - b.current_list_price)[0];
      
      return {
        ...prev,
        selectedTypology: {
          ...prev.selectedTypology,
          [projectId]: value
        },
        selectedUnit: {
          ...prev.selectedUnit,
          [projectId]: cheapestUnit?._id
        }
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!open || selectedProjects.length === 0) return;
      setState(prev => ({ ...prev, loading: true, projectErrors: {}, errorMessage: '' }));

      try {
        const ufResponse = await fetch("/api/getUF");
        const ufData = await ufResponse.json();
        const ufValue = parseFloat(ufData.UFs[0].Valor.replace(".", "").replace(",", "."));

        const units = {};
        const typologies = {};
        const selectedUnits = {};
        const projectErrors = {};
        const projectDetails = [];
        const discountType = {};
        let hasErrors = false;

        for (const project of selectedProjects) {
          try {
            const [detailsResponse, stockResponse] = await Promise.all([
              fetch(`/api/projects/details/${project._id}?organizationId=${session.user.organization._id}`),
              fetch(`/api/projects/${project._id}/stock?organizationId=${session.user.organization._id}`)
            ]);
        
            const detailsData = await detailsResponse.json();
            const stockData = await stockResponse.json();
        
            projectDetails.push(detailsData.data);
            units[project._id] = stockData.data;

            const bonoPiePercentage = detailsData.data?.down_payment_bonus ?? 0;
            const descuentoPercentage = detailsData.data?.discount ?? 0;

            if (descuentoPercentage > 0 && bonoPiePercentage > 0) {
              discountType[project._id] = 'ambos';
            } else if (descuentoPercentage > 0) {
              discountType[project._id] = 'descuento';
            } else if (bonoPiePercentage > 0) {
              discountType[project._id] = 'bonoPie';
            } else {
              discountType[project._id] = '';
            }
        
            if (stockData.data.length > 0) {
              const projectTypologies = [...new Set(stockData.data.map(u => u.typology))].sort();
              typologies[project._id] = projectTypologies[0];
              const unitsOfTypology = stockData.data.filter(u => u.typology === projectTypologies[0]);
              const cheapestUnit = unitsOfTypology.sort((a, b) => a.current_list_price - b.current_list_price)[0];
              selectedUnits[project._id] = cheapestUnit?._id;
            }
          } catch (error) {
            console.error(`Error loading project ${project.name}:`, error);
            projectErrors[project._id] = true;
            projectDetails.push(null);
            hasErrors = true;
          }
        }

        setState(prev => ({
          ...prev,
          projectDetails,
          projectUnits: units,
          selectedTypology: typologies,
          selectedUnit: selectedUnits,
          ufValue,
          projectErrors,
          discountType,
          errorMessage: hasErrors ? 'Algunos proyectos no pudieron ser cargados correctamente' : '',
          loading: false
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
        setState(prev => ({ 
          ...prev, 
          loading: false,
          errorMessage: 'Error al cargar los datos'
        }));
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
              <TableContainer component={Paper}
              sx={{
                '@media print': {
                  '& .MuiTable-root': {
                    fontSize: '80%'  // reduce el tamaño de la fuente al 90%
                  },
                  '& .MuiTableCell-root': {
                    padding: '8px 6px'  // reduce el padding de las celdas
                  }
                }
              }}
              >
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
                                    {unit?.total_surface !== undefined && (
                                        <Typography variant="body2">
                                            Total: {`${formatSurface(unit.total_surface)}m²`}
                                        </Typography>
                                    )}
                                    {unit?.interior_surface !== undefined && (
                                        <Typography variant="body2">
                                            Interior: {`${formatSurface(unit.interior_surface)}m²`}
                                        </Typography>
                                    )}
                                    {unit?.terrace_surface !== undefined && (
                                        <Typography variant="body2">
                                            Terraza: {`${formatSurface(unit.terrace_surface)}m²`}
                                        </Typography>
                                    )}
                                    {(!unit?.total_surface && !unit?.interior_surface && !unit?.terrace_surface) && '-'}
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
                          
                          const piePercentage = unit.downpayment ?? details.downpayment ?? 20;
                          const bonoPiePercentage = unit.down_payment_bonus ?? details.down_payment_bonus ?? 0;
                          const descuentoPercentage = unit.discount ?? details.discount ?? 0;
                          
                          const priceInfo = calculatePriceInfo(
                            unit, 
                            state.ufValue, 
                            Number(unit.downpayment ?? details.downpayment ?? 20),
                            Number(unit.downpayment ?? details.downpayment ?? 20),
                            state.discountType[project._id],
                            Number(unit.down_payment_bonus ?? details.down_payment_bonus ?? 0),
                            Number(unit.discount ?? details.discount ?? 0)
                         );
                          
                          return (
                              <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                                  {`${piePercentage}%`}
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

                          const piePercentage = unit.downpayment ?? details.downpayment ?? 20;
                          const bonoPiePercentage = unit.down_payment_bonus ?? details.down_payment_bonus ?? 0;
                          const descuentoPercentage = unit.discount ?? details.discount ?? 0;
                          
                          const priceInfo = calculatePriceInfo(
                            unit, 
                            state.ufValue, 
                            Number(unit.downpayment ?? details.downpayment ?? 20),
                            Number(unit.downpayment ?? details.downpayment ?? 20),
                            state.discountType[project._id],
                            Number(unit.down_payment_bonus ?? details.down_payment_bonus ?? 0),
                            Number(unit.discount ?? details.discount ?? 0)
                         );

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
                      {selectedProjects.map((project) => {
                          const unit = getSelectedUnit(project._id);
                          const details = getProjectDetails(project._id);
                          if (!unit || !details) return <TableCell key={project._id}>-</TableCell>;
                          
                          const bonoPiePercentage = details.down_payment_bonus || 0;
                          if (bonoPiePercentage === 0) return <TableCell key={project._id} sx={{ textAlign: 'center' }}>-</TableCell>;

                          const piePercentage = unit.downpayment ?? details.downpayment ?? 20;
                          const precioBase = (details.discount && state.discountType[project._id] === 'descuento') 
                              ? unit.current_list_price * (1 - (details.discount/100))
                              : unit.current_list_price;
                          
                          const pieOriginal = precioBase * (piePercentage/100);
                          const bonoPieUF = pieOriginal * (bonoPiePercentage/100);
                          const bonoPieCLP = bonoPieUF * state.ufValue;
                          
                          return (
                              <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                                  {`${bonoPiePercentage}%`}
                                  <Typography variant="body2">
                                      {`${bonoPieUF.toFixed(1)} UF`}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                      {`$${Math.round(bonoPieCLP).toLocaleString('es-CL')}`}
                                  </Typography>
                              </TableCell>
                          );
                      })}
                  </TableRow>
                    <TableRow>
                        <TableCell sx={{ textAlign: 'center' }}>Descuento</TableCell>
                        {selectedProjects.map((project) => {
                            const details = getProjectDetails(project._id);
                            const unit = getSelectedUnit(project._id);
                            if (!unit || !details) return <TableCell key={project._id}>-</TableCell>;
                            
                            const discount = details.discount || 0;
                            if (discount === 0) return <TableCell key={project._id} sx={{ textAlign: 'center' }}>-</TableCell>;

                            const discountUF = (unit.current_list_price * discount) / 100;
                            const discountCLP = discountUF * state.ufValue;
                            
                            return (
                                <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                                    {`${discount}%`}
                                    <Typography variant="body2">
                                        {`${discountUF.toFixed(1)} UF`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {`$${Math.round(discountCLP).toLocaleString('es-CL')}`}
                                    </Typography>
                                </TableCell>
                            );
                        })}
                    </TableRow>
                    {/* <TableRow>
                      <TableCell sx={{ textAlign: 'center' }}>Cuotón</TableCell>
                      {selectedProjects.map((project) => {
                          const unit = getSelectedUnit(project._id);
                          const details = getProjectDetails(project._id);
                          if (!unit || !details) return <TableCell key={project._id}>-</TableCell>;
                          
                          const piePercentage = Number(unit.downpayment ?? details.downpayment ?? 20);
                          const bonoPiePercentage = Number(unit.down_payment_bonus ?? details.down_payment_bonus ?? 0);
                          const descuentoPercentage = Number(unit.discount ?? details.discount ?? 0);
                          
                          const priceInfo = calculatePriceInfo(
                              unit, 
                              state.ufValue, 
                              piePercentage,
                              piePercentage,
                              state.discountType[project._id],
                              bonoPiePercentage,
                              descuentoPercentage
                          );
                          
                          return (
                              <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                                  {`${priceInfo.cuotonUF.toFixed(1)} UF`}
                              </TableCell>
                          );
                      })}
                    </TableRow> */}
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

                    <TableRow>
                      <TableCell sx={{ textAlign: 'center' }}>Precio Base Cálculo</TableCell>
                      {selectedProjects.map((project) => {
                          const unit = getSelectedUnit(project._id);
                          const details = getProjectDetails(project._id);
                          if (!unit || !details) return <TableCell key={project._id}>-</TableCell>;
                          

                          const piePercentage = unit.downpayment ?? details.downpayment ?? 20;
                          const bonoPiePercentage = unit.down_payment_bonus ?? details.down_payment_bonus ?? 0;
                          const descuentoPercentage = unit.discount ?? details.discount ?? 0;
                          
                          const priceInfo = calculatePriceInfo(
                              unit, 
                              state.ufValue, 
                              piePercentage, 
                              0,
                              state.discountType[project._id],
                              bonoPiePercentage,
                              descuentoPercentage
                          );

                          // Preparar texto de condiciones aplicadas solo si hay valores mayores a 0
                          let condicionesAplicadas = '';
                          const tieneDescuento = descuentoPercentage > 0;
                          const tieneBonoPie = bonoPiePercentage > 0;

                          switch(state.discountType[project._id]) {
                              case 'descuento':
                                  if (tieneDescuento) {
                                      condicionesAplicadas = `Aplicando descuento ${(descuentoPercentage).toFixed(0)}%`;
                                  }
                                  break;
                              case 'bonoPie':
                                  if (tieneBonoPie) {
                                      condicionesAplicadas = `Aplicando bono pie ${Number(bonoPiePercentage).toFixed(0)}%`;
                                  }
                                  break;
                              case 'ambos':
                                  if (tieneDescuento && tieneBonoPie) {
                                      condicionesAplicadas = `Aplicando descuento ${(descuentoPercentage).toFixed(0)}% y bono pie ${Number(bonoPiePercentage).toFixed(0)}%`;
                                  } else if (tieneDescuento) {
                                      condicionesAplicadas = `Aplicando descuento ${(descuentoPercentage).toFixed(0)}%`;
                                  } else if (tieneBonoPie) {
                                      condicionesAplicadas = `Aplicando bono pie ${Number(bonoPiePercentage).toFixed(0)}%`;
                                  }
                                  break;
                          }
                          
                          return (
                              <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                                  {`${priceInfo.precioBaseUF.toFixed(1)} UF`}
                                  <Typography variant="caption" color="text.secondary" display="block">
                                      {`$${Math.round(priceInfo.precioBaseCLP).toLocaleString('es-CL')}`}
                                  </Typography>
                                  {condicionesAplicadas && (
                                      <Typography variant="body2" color="text.secondary">
                                          {condicionesAplicadas}
                                      </Typography>
                                  )}
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
                        
                        const piePercentage = unit.downpayment ?? details.downpayment ?? 20;
                        const bonoPiePercentage = unit.down_payment_bonus ?? details.down_payment_bonus ?? 0;
                        const descuentoPercentage = unit.discount ?? details.discount ?? 0;
                        
                        const priceInfo = calculatePriceInfo(
                          unit, 
                          state.ufValue, 
                          Number(unit.downpayment ?? details.downpayment ?? 20),
                          Number(unit.downpayment ?? details.downpayment ?? 20),
                          state.discountType[project._id],
                          Number(unit.down_payment_bonus ?? details.down_payment_bonus ?? 0),
                          Number(unit.discount ?? details.discount ?? 0)
                       );
                        
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
                      
                      const piePercentage = unit.downpayment ?? details.downpayment ?? 20;
                      const bonoPiePercentage = unit.down_payment_bonus ?? details.down_payment_bonus ?? 0;
                      const descuentoPercentage = unit.discount ?? details.discount ?? 0;
                      
                      const priceInfo = calculatePriceInfo(
                        unit, 
                        state.ufValue, 
                        Number(unit.downpayment ?? details.downpayment ?? 20),
                        Number(unit.downpayment ?? details.downpayment ?? 20),
                        state.discountType[project._id],
                        Number(unit.down_payment_bonus ?? details.down_payment_bonus ?? 0),
                        Number(unit.discount ?? details.discount ?? 0)
                     );
                      
                      const dividendoInfo = calculateDividendo(
                          priceInfo.hipotecarioUF, 
                          state.tasaAnual, 
                          state.plazoAnos, 
                          state.ufValue
                      );
                      
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

              

              <TableRow sx={{ '@media print': { display: 'none' } }}>
                <TableCell sx={{ textAlign: 'center' }}>
                    Aplicar condiciones comerciales
                </TableCell>
                {selectedProjects.map((project) => {
                    const details = getProjectDetails(project._id);
                    const bonoPiePercentage = details.down_payment_bonus;
                    const descuentoPercentage = (details?.discount || 0) / 100;
                    
                    return (
                        <TableCell key={project._id} sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <ButtonGroup variant="outlined" size="small">
                                    <Tooltip title="Aplicar solo el descuento al precio total">
                                        <Button
                                            sx={{
                                                bgcolor: state.discountType[project._id] === 'descuento' ? 'primary.main' : 'transparent',
                                                color: state.discountType[project._id] === 'descuento' ? 'white' : 'primary.main',
                                                '&:hover': {
                                                    bgcolor: state.discountType[project._id] === 'descuento' ? 'primary.dark' : 'rgba(25, 118, 210, 0.04)'
                                                },
                                                border: state.discountType[project._id] === 'descuento' ? '1px solid primary.main' : '1px solid rgba(0, 0, 0, 0.23)'
                                            }}
                                            onClick={() => setState(prev => ({
                                                ...prev,
                                                discountType: {
                                                    ...prev.discountType,
                                                    [project._id]: 'descuento'
                                                }
                                            }))}
                                            disabled={!descuentoPercentage}
                                        >
                                            Descuento
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Aplicar solo el bono al pie">
                                        <Button
                                            sx={{
                                                bgcolor: state.discountType[project._id] === 'bonoPie' ? 'primary.main' : 'transparent',
                                                color: state.discountType[project._id] === 'bonoPie' ? 'white' : 'primary.main',
                                                '&:hover': {
                                                    bgcolor: state.discountType[project._id] === 'bonoPie' ? 'primary.dark' : 'rgba(25, 118, 210, 0.04)'
                                                },
                                                border: state.discountType[project._id] === 'bonoPie' ? '1px solid primary.main' : '1px solid rgba(0, 0, 0, 0.23)'
                                            }}
                                            onClick={() => setState(prev => ({
                                                ...prev,
                                                discountType: {
                                                    ...prev.discountType,
                                                    [project._id]: 'bonoPie'
                                                }
                                            }))}
                                            disabled={!bonoPiePercentage}
                                        >
                                            Bono Pie
                                        </Button>
                                    </Tooltip>
                                    <Tooltip 
                                        title={
                                            <div>
                                                Al aplicar ambos:<br/>
                                                1. Se aplica descuento al precio total<br/>
                                                2. Se calcula pie sobre precio con descuento<br/>
                                                3. Se aplica bono al pie calculado
                                            </div>
                                        }
                                    >
                                        <Button
                                            sx={{
                                                bgcolor: state.discountType[project._id] === 'ambos' ? 'primary.main' : 'transparent',
                                                color: state.discountType[project._id] === 'ambos' ? 'white' : 'primary.main',
                                                '&:hover': {
                                                    bgcolor: state.discountType[project._id] === 'ambos' ? 'primary.dark' : 'rgba(25, 118, 210, 0.04)'
                                                },
                                                border: state.discountType[project._id] === 'ambos' ? '1px solid primary.main' : '1px solid rgba(0, 0, 0, 0.23)'
                                            }}
                                            onClick={() => setState(prev => ({
                                                ...prev,
                                                discountType: {
                                                    ...prev.discountType,
                                                    [project._id]: 'ambos'
                                                }
                                            }))}
                                            disabled={!bonoPiePercentage || !descuentoPercentage}
                                        >
                                            Ambos
                                        </Button>
                                    </Tooltip>
                                </ButtonGroup>
                                
                                {details?.commercialConditions && details.commercialConditions.trim() !== '' && (
                                  <Button 
                                      variant="outlined" 
                                      size="small"
                                      onClick={() => handleDialogToggle(project._id)}
                                      sx={{
                                          fontSize: '0.75rem',
                                          padding: '4px 8px',
                                          minWidth: 'unset',
                                          textTransform: 'none',
                                          '&:hover': {
                                              backgroundColor: 'rgba(25, 118, 210, 0.04)'
                                          }
                                      }}
                                  >
                                      Ver condiciones comerciales
                                  </Button>
                              )}
                              
                              <Button 
                                  variant="outlined" 
                                  size="small"
                                  onClick={() => handleNotesDialogToggle(project._id)}
                                  sx={{
                                      fontSize: '0.75rem',
                                      padding: '4px 8px',
                                      minWidth: 'unset',
                                      textTransform: 'none',
                                      '&:hover': {
                                          backgroundColor: 'rgba(25, 118, 210, 0.04)'
                                      }
                                  }}
                              >
                                  Agregar notas
                              </Button>

                              {/* El Dialog también debería estar condicionado */}
                              {details?.commercialConditions && details.commercialConditions.trim() !== '' && (
                                  <Dialog
                                      open={openDialogs[project._id] || false}
                                      onClose={() => handleDialogToggle(project._id)}
                                      maxWidth="md"
                                      fullWidth
                                  >
                                    <DialogTitle>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Condiciones Comerciales - {project.name}</span>
                                            <IconButton
                                                aria-label="close"
                                                onClick={() => handleDialogToggle(project._id)}
                                                sx={{
                                                    position: 'absolute',
                                                    right: 8,
                                                    top: 8,
                                                }}
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        </Box>
                                        {details?.commercialConditionsUpdatedAt && (
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    display: 'block', 
                                                    mt: 1,
                                                    color: 'text.secondary'
                                                }}
                                            >
                                                Última actualización: {format(new Date(details.commercialConditionsUpdatedAt), "d 'de' MMMM yyyy", { locale: es })}
                                            </Typography>
                                        )}
                                        {(details?.parkingValue || details?.storageValue) && (
                                            <Table size="small" sx={{ mt: 2, '& td, & th': { borderBottom: 'none', padding: '4px 8px' }, maxWidth:'400px' }}>
                                                <TableBody>
                                                    {details.parkingValue > 0 && (
                                                        <TableRow>
                                                            <TableCell 
                                                                component="th" 
                                                                sx={{ 
                                                                    color: 'text.secondary',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 'normal'
                                                                }}
                                                            >
                                                                Estacionamiento (valor estimado):
                                                            </TableCell>
                                                            <TableCell 
                                                                align="right"
                                                                sx={{ 
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 'medium'
                                                                }}
                                                            >
                                                                {details.parkingValue.toFixed(1)} UF
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                    {details.storageValue > 0 && (
                                                        <TableRow>
                                                            <TableCell 
                                                                component="th" 
                                                                sx={{ 
                                                                    color: 'text.secondary',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 'normal'
                                                                }}
                                                            >
                                                                Bodega (valor estimado):
                                                            </TableCell>
                                                            <TableCell 
                                                                align="right"
                                                                sx={{ 
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 'medium'
                                                                }}
                                                            >
                                                                {details.storageValue.toFixed(1)} UF
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </DialogTitle>
                                      <DialogContent>
                                          <div 
                                              dangerouslySetInnerHTML={{ 
                                                  __html: details.commercialConditions 
                                              }} 
                                          />
                                      </DialogContent>
                                      <DialogActions>
                                          <Button onClick={() => handleDialogToggle(project._id)}>
                                              Cerrar
                                          </Button>
                                      </DialogActions>
                                  </Dialog>
                              )}

                              {/* Dialog para las notas */}
                              <Dialog
                                  open={notesDialogs[project._id] || false}
                                  onClose={() => handleNotesDialogToggle(project._id)}
                                  maxWidth="md"
                                  fullWidth
                              >
                                  <DialogTitle>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span>Notas del Ejecutivo - {project.name}</span>
                                          <IconButton
                                              aria-label="close"
                                              onClick={() => handleNotesDialogToggle(project._id)}
                                              sx={{ position: 'absolute', right: 8, top: 8 }}
                                          >
                                              <CloseIcon />
                                          </IconButton>
                                      </Box>
                                  </DialogTitle>
                                  <DialogContent>
                                      <Editor
                                          apiKey={process.env.NEXT_PUBLIC_TINY_API_KEY}
                                          init={{
                                              height: 300,
                                              menubar: false,
                                              plugins: [
                                                  'advlist', 
                                                  'lists', 
                                                  'link', 
                                                  'charmap', 
                                                  'preview', 
                                                  'searchreplace', 
                                                  'visualblocks', 
                                                  'fullscreen', 
                                                  'wordcount'
                                              ],
                                              toolbar: 'undo redo | formatselect | ' +
                                                      'bold italic | alignleft aligncenter ' +
                                                      'alignright | bullist numlist | ' +
                                                      'removeformat',
                                              content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px }',
                                              branding: false,
                                              statusbar: false,
                                              resize: false
                                          }}
                                          value={projectNotes[project._id] || ''}
                                          onEditorChange={(content) => handleNotesChange(project._id, content)}
                                      />
                                  </DialogContent>
                                  <DialogActions>
                                      <Button onClick={() => handleNotesDialogToggle(project._id)}>Cancelar</Button>
                                      <Button onClick={() => handleSaveNotes(project._id)} variant="contained" color="primary">
                                          Guardar
                                      </Button>
                                  </DialogActions>
                              </Dialog>
                            </Box>
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

                    <TableRow sx={{ 
                        display: 'none', 
                        '@media print': { 
                            display: 'table-row',
                            bgcolor: '#f5f5f5' 
                        }
                    }}>
                        <TableCell sx={{ 
                            fontWeight: 'bold', 
                            color: 'primary.main', 
                            textAlign: 'center'
                        }}>
                            Dividendo por Plazos
                        </TableCell>
                        {selectedProjects.map((project) => {
                            const unit = getSelectedUnit(project._id);
                            const details = getProjectDetails(project._id);
                            if (!unit || !details) return <TableCell key={project._id}>-</TableCell>;
                            
                            const piePercentage = unit.downpayment ?? details.downpayment ?? 20;
                            const bonoPiePercentage = unit.down_payment_bonus ?? details.down_payment_bonus ?? 0;
                            const descuentoPercentage = unit.discount ?? details.discount ?? 0;
                            
                            const priceInfo = calculatePriceInfo(
                                unit, 
                                state.ufValue, 
                                Number(piePercentage),
                                Number(piePercentage),
                                state.discountType[project._id],
                                Number(bonoPiePercentage),
                                Number(descuentoPercentage)
                            );
                            
                            return (
                                <ComparativaDividendos
                                    key={project._id}
                                    hipotecarioUF={priceInfo.hipotecarioUF}
                                    tasaAnual={state.tasaAnual}
                                    plazoActual={state.plazoAnos}
                                    ufValue={state.ufValue}
                                />
                            );
                        })}
                    </TableRow>
                    {/* FIN Nuevas filas solo para impresión */}

                    
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
              {/* Notas específicas de proyectos */}
              {Object.entries(projectNotes).map(([projectId, notes]) => {
                  if (!notes) return null;
                  const project = selectedProjects.find(p => p._id === projectId);
                  return (
                      <Box key={projectId} sx={{ 
                          display: 'none', 
                          '@media print': { 
                              display: 'block',
                              mb: 3,
                              mt:4,
                              '&:last-of-type': {
                                  mb: 4
                              }
                          } 
                      }}>
                          <Typography 
                              variant="caption" 
                              sx={{ 
                                  display: 'block', 
                                  mb: 1,
                                  color: 'text.secondary'
                              }}
                          >
                              • Notas sobre {project.name}:
                          </Typography>
                          <Typography 
                              variant="caption" 
                              component="div"
                              sx={{ 
                                  color: 'text.secondary',
                                  pl: 2  // Indentación para alinear con el bullet point
                              }}
                              dangerouslySetInnerHTML={{ __html: notes }}
                          />
                      </Box>
                  );
              })}
              <Box sx={{ 
                display: 'none', 
                '@media print': { 
                    display: 'block',
                    mt: 4,
                    pt: 2,
                    borderTop: '1px solid rgba(0, 0, 0, 0.12)'
                } 
            }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    Notas:
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    • Los valores presentados en este comparativo son referenciales y están sujetos a cambios. Esta información es válida por 10 días desde la fecha de emisión y debe utilizarse solo con fines comparativos.
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    • Los cálculos de dividendos son estimativos y pueden variar según las condiciones finales del crédito hipotecario y la evaluación de la entidad financiera.
                </Typography>
                {/* <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    • Para una cotización formal y condiciones definitivas, por favor contacte a su ejecutivo comercial.
                </Typography> */}
            </Box>
            </div>
            
            <ActionButtons handlePrint={handlePrint} onClose={onClose} loading={state.loading} />
          </>
        )}
      </Box>
    </Modal>
  );
};

export default CompareModal;