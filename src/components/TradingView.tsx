import React from 'react';
import { Box, Typography, Tab, Tabs } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TradingView = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  // Sample data - replace with real data
  const data = [
    { time: '00:00', price: 1800 },
    { time: '04:00', price: 1820 },
    { time: '08:00', price: 1790 },
    { time: '12:00', price: 1850 },
    { time: '16:00', price: 1830 },
    { time: '20:00', price: 1860 },
    { time: '24:00', price: 1880 },
  ];

  return (
  <></>
  );
};

export default TradingView;
