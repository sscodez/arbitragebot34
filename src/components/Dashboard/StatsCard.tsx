import React from 'react';
import { Box, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, useColorModeValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const StatsCard = ({ title, value, change, type }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <MotionBox
      bg={cardBg}
      p={6}
      borderRadius="lg"
      boxShadow="lg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Stat>
        <StatLabel color={textColor}>{title}</StatLabel>
        <StatNumber fontSize="2xl" fontWeight="bold">
          {value}
        </StatNumber>
        <StatHelpText>
          <StatArrow type={type} />
          {change}
        </StatHelpText>
      </Stat>
    </MotionBox>
  );
};

export default StatsCard;
