import React from 'react';
import { PriceChartProps } from '@/types/app';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PriceChart: React.FC<PriceChartProps> = ({ prices, pair }) => {
  if (!pair || prices.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No price data available
      </div>
    );
  }

  const data = {
    labels: prices.map((p) => new Date(p.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: `${pair.fromToken.symbol}/${pair.toToken.symbol} Price`,
        data: prices.map((p) => p.price),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Price History',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
};

export default PriceChart;
