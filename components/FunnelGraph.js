import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const BarChart = () => {
  const originalData = [70, 63, 56, 48, 40, 34, 23, 12, 5, 5];
  const positiveData = originalData.map(value => value);
  const negativeData = originalData.map(value => -value);

  const data = {
    labels: ['Asesorías', 'Todos los procesos', 'Cotizando', 'Por pagar', 'Reservados', 'Aprobados', 'Rechazados', 'Promesas Solicitadas', 'Por firmar', 'Promesados'],
    datasets: [
      {
        label: 'Negative',
        data: negativeData,
        backgroundColor: (context) => {
          const value = context.dataset.data[context.dataIndex];
          const maxValue = Math.max(...originalData) + 50;
          const opacity = Math.abs(value) / maxValue;
          return `rgba(88, 167, 25, ${opacity + 0.8})`;
        },
        borderWidth: 0,
        barPercentage: 1,
        categoryPercentage: .8, // Ajusta la separación vertical
        order: 1,
      },
      {
        label: 'Positive',
        data: positiveData,
        backgroundColor: (context) => {
          const value = context.dataset.data[context.dataIndex];
          const maxValue = Math.max(...originalData) + 50;
          const opacity = Math.abs(value) / maxValue;
          return `rgba(88, 167, 25, ${opacity + 0.8})`;
        },
        borderWidth: 0,
        barPercentage: 1,
        categoryPercentage: 0.8, // Ajusta la separación vertical
        order: 2,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    elements: {
      bar: {
        borderWidth: 0,
        borderRadius: 20,
      },
    },
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        },
        stacked: true,
      },
      y: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          display: true,
          callback: (value, index) => `${data.labels[index]}: ${Math.abs(originalData[index])}`,
        },
        stacked: true,
      },
    },
    layout: {
      padding: {
        left: 0, // Ajusta el padding para centrar mejor las barras
        right: 0,
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default BarChart;
