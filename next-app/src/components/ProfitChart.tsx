import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
        color: 'rgba(255, 255, 255, 0.1)',
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        font: {
          family: "'Inter', sans-serif",
          size: 12,
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        font: {
          family: "'Inter', sans-serif",
          size: 12,
        },
        callback: (value) => `$${value}`,
      },
    },
  },
  elements: {
    line: {
      tension: 0.4,
    },
    point: {
      radius: 0,
    },
  },
};

function ProfitChart({ data }) {
  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.timestamp);
      return date.toLocaleTimeString();
    }),
    datasets: [
      {
        fill: true,
        data: data.map(d => d.profit),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      },
    ],
  };

  return (
    <div className="bg-dark-card rounded-lg border border-dark-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-primary-400">Profit Chart</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-text/60">
            Last 24 Hours
          </span>
        </div>
      </div>
      
      <div className="h-[300px]">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}

export default ProfitChart;
