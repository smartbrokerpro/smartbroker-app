'use client';

import React from 'react';
import { Box, Table, TableCell, Typography, FormControl, InputLabel, Select, MenuItem, Button, ButtonGroup, TableContainer, TableBody, TableRow, Paper, TextField } from '@mui/material';
import { Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Cálculos
export const calculatePriceInfo = (unit, ufValue, piePercentage, cuotonPercentage, discountType, bonoPiePercentage, descuentoPercentage) => {
    const precioListaUF = unit.current_list_price;
    
    // 1. Precio Base: Aplicar descuento si corresponde
    const precioBaseUF = (discountType === 'descuento' || discountType === 'ambos')
      ? precioListaUF * (1 - (descuentoPercentage/100))
      : precioListaUF;
    
    // 2. Calcular Pie: Primero calculo el pie original sobre el precio base
    const pieOriginalUF = precioBaseUF * (piePercentage/100);
    
    // 3. Aplicar Bono Pie: Si hay bono pie, se reduce el monto del pie
    const pieUF = (discountType === 'bonoPie' || discountType === 'ambos')
      ? pieOriginalUF * (1 - (bonoPiePercentage/100))
      : pieOriginalUF;
    
    // 4. Cuotón: Se calcula sobre el precio base (pero no afecta al hipotecario)
    const cuotonUF = precioBaseUF * (cuotonPercentage/100);
    
    // 5. Hipotecario: Es el precio base menos el pie
    const hipotecarioUF = precioBaseUF - pieUF;
    
    // Conversiones a CLP
    const precioListaCLP = precioListaUF * ufValue;
    const precioBaseCLP = precioBaseUF * ufValue;
    const pieCLP = pieUF * ufValue;
    const cuotonCLP = cuotonUF * ufValue;
    const hipotecarioCLP = hipotecarioUF * ufValue;
   
    return {
      precioListaUF,
      precioBaseUF,
      precioBaseCLP,
      pieUF,
      pieCLP,
      cuotonUF,
      cuotonCLP,
      hipotecarioUF,
      hipotecarioCLP
    };
  };

export const calculateDividendo = (hipotecarioUF, tasaAnual, plazoAnos, ufValue) => {
  const tasaMensual = (tasaAnual / 100) / 12;
  const plazoMeses = plazoAnos * 12;
  const dividendoUF = hipotecarioUF * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / (Math.pow(1 + tasaMensual, plazoMeses) - 1);
  return {
    dividendoUF,
    dividendoCLP: dividendoUF * ufValue
  };
};

export const formatSurface = (value) => {
  if (!value) return '0.00';
  const normalizedValue = typeof value === 'string' ? value.replace(',', '.') : value;
  const num = Number(normalizedValue);
  return !isNaN(num) ? num.toFixed(2) : '0.00';
};

// Componentes
export const TableCellContent = ({ ufValue, value, secondaryValue }) => (
  <TableCell sx={{ textAlign: 'center' }}>
    {value}
    {secondaryValue && (
      <Typography variant="caption" color="text.secondary" display="block">
        {secondaryValue}
      </Typography>
    )}
  </TableCell>
);

// Header Components
export const ProjectHeader = ({ project, state, setState, getSelectedUnit, handleTypologyChange, totalProjects }) => (
  <TableCell 
    width={`${100/totalProjects}%`}
    sx={{ bgcolor: 'background.default', textAlign: 'center' }}
  >
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {project.name}
      </Typography>
      {state.projectErrors[project._id] ? (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          Error al cargar datos
        </Typography>
      ) : (
        <>
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
        </>
      )}
    </Box>
  </TableCell>
);

export const PrintableProjectInfo = ({ selectedUnit, selectedTypology }) => (
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

export const ProjectSelectors = ({ project, state, setState, handleTypologyChange }) => {
  if (state.projectErrors[project._id]) return null;
  
  return (
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
          {(state.projectUnits[project._id] || [])
            ?.filter(u => u.typology === state.selectedTypology[project._id])
            .sort((a, b) => a.current_list_price - b.current_list_price)
            .map((unit) => (
              <MenuItem key={unit._id} value={unit._id}>
                {unit.apartment} <Typography sx={{pl:1, fontSize: '0.8rem'}} component="span" variant="caption" color="text.secondary">
                  (<b>{unit.current_list_price.toFixed(0)} UF</b> - {unit.orientation})
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
          {[...new Set((state.projectUnits[project._id] || [])?.map(u => u.typology))]
            .sort()
            .map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export const OrganizationHeader = ({ session, state }) => (
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

export const TableFooterControls = ({ state, setState }) => (
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

export const ActionButtons = ({ handlePrint, onClose, loading }) => (
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

export const calculateComparativaDividendos = (hipotecarioUF, tasaAnual, plazoActual, ufValue) => {
    const getPlazosToShow = (plazo) => {
      // Si es 5 años o menos
      if (plazo <= 5) return [5, 10, 15];
      // Si es 30 años
      if (plazo >= 30) return [20, 25, 30];
      // Caso normal: plazo anterior, actual y siguiente
      return [plazo - 5, plazo, plazo + 5];
    };
  
    const plazos = getPlazosToShow(plazoActual);
    
    return plazos.map(plazo => {
      const dividendo = calculateDividendo(hipotecarioUF, tasaAnual, plazo, ufValue);
      return {
        plazo,
        dividendoUF: dividendo.dividendoUF,
        dividendoCLP: dividendo.dividendoCLP,
        isSelected: plazo === plazoActual
      };
    });
  };

  export const ComparativaDividendos = ({ hipotecarioUF, tasaAnual, plazoActual, ufValue }) => {
    const comparativa = calculateComparativaDividendos(hipotecarioUF, tasaAnual, plazoActual, ufValue);
  
    return (
      <TableCell sx={{ textAlign: 'center' }}>
        <Table size="small" sx={{ 
          display: 'none',
          '@media print': { 
            display: 'table',
            margin: '0 auto',
            width: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderCollapse: 'separate',
            borderSpacing: '0',
            borderRadius: '4px',
            overflow: 'hidden'
          }
        }}>
          <TableBody>
            {comparativa.map(({ plazo, dividendoUF, dividendoCLP, isSelected }, index) => (
              <TableRow key={plazo} sx={{
                backgroundColor: isSelected ? 'white' : 'transparent',
                '&:first-of-type td:first-of-type': {
                  borderTopLeftRadius: '4px',
                },
                '&:first-of-type td:last-child': {
                  borderTopRightRadius: '4px',
                },
                '&:last-child td:first-of-type': {
                  borderBottomLeftRadius: '4px',
                },
                '&:last-child td:last-child': {
                  borderBottomRightRadius: '4px',
                }
              }}>
                <TableCell sx={{ 
                  py: 0.5,
                  px: 1,
                  textAlign: 'right',
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                  borderBottom: index < 2 ? '1px solid rgba(224, 224, 224, 0.4)' : 'none',
                  borderRight: '1px solid rgba(224, 224, 224, 0.4)',
                  fontWeight: isSelected ? 'bold' : 'normal'
                }}>
                  <Typography sx={{ 
                    fontSize: '0.75rem',
                    fontWeight: 'inherit',
                    display: 'block',
                    lineHeight: 1.2
                  }}>
                    {dividendoUF.toFixed(1)} UF
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '0.65rem',
                    color: 'text.secondary',
                    display: 'block',
                    lineHeight: 1.2,
                    fontWeight: 'normal'
                  }}>
                    ${Math.round(dividendoCLP).toLocaleString('es-CL')}
                  </Typography>
                </TableCell>
                <TableCell sx={{ 
                  py: 0.5,
                  px: 1,
                  textAlign: 'left',
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  width: '1%',
                  borderBottom: index < 2 ? '1px solid rgba(224, 224, 224, 0.4)' : 'none',
                  fontWeight: isSelected ? 'bold' : 'normal'
                }}>
                  {plazo} años
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCell>
    );
  };