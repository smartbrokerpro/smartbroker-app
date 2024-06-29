// components/FunnelChart.js
import React, { useEffect, useRef } from 'react';

const FunnelChart = ({ data }) => {
  const funnelRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('d3-funnel').then(D3Funnel => {
        const funnel = new D3Funnel.default(funnelRef.current);
        const chartData = data.labels.map((label, index) => ({
          label,
          value: data.values[index],
        }));

        const baseColor = 'rgba(73, 154, 21, 1)';
        const colors = Array.from({ length: data.values.length }, (_, index) => {
          const opacity = 1 - index * 0.05;
          return `rgba(73, 154, 21, ${opacity})`;
        });

        const options = {
          chart: {
            width: funnelRef.current.offsetWidth,
            height: 400,
            bottomPinch: 0, // Asegurarse de que no haya "pinch" en la parte inferior
            curve: {
              enabled: false, // Deshabilitar curvas
            },
          },
          block: {
            dynamicHeight: false,
            minHeight: 20,
            fill: {
              scale: colors,
            },
            highlight: true,
            dynamicSlope: false, // Eliminar la pendiente
          },
          label: {
            format: '{l}: {v}', // Formato de la etiqueta
            fontFamily: 'sans-serif',
            fontSize: '14px',
            fill: '#fff', // Color del texto dentro de la barra
          },
        };

        funnel.draw(chartData, options);

        // Ajustar el estilo para redondear las esquinas de las barras
        const blocks = funnelRef.current.querySelectorAll('.block path');
        blocks.forEach((block) => {
          block.setAttribute('rx', '10'); // Ajustar el radio de las esquinas
          block.setAttribute('ry', '10'); // Ajustar el radio de las esquinas
        });
      });
    }
  }, [data]);

  return (
    <div className="funnel-container">
      <div ref={funnelRef} className="funnel-chart"></div>
    </div>
  );
};

export default FunnelChart;
