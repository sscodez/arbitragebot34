import React from 'react';
import { Box, Grid, useColorModeValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MotionBox = motion(Box);

const TradingView = ({ tradingData }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  const chartData = tradingData || [
    { time: '00:00', profit: 0 },
    { time: '04:00', profit: 0.5 },
    { time: '08:00', profit: 0.3 },
    { time: '12:00', profit: 0.8 },
    { time: '16:00', profit: 1.2 },
    { time: '20:00', profit: 1.5 },
  ];

  return (
    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
      <MotionBox
        bg={cardBg}
        p={6}
        borderRadius="xl"
        boxShadow="xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box h="300px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </MotionBox>

      <MotionBox
        bg={cardBg}
        p={6}
        borderRadius="xl"
        boxShadow="xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Trading pair cards will go here */}
      </MotionBox>
    </Grid>
  );
};

export default TradingView;
