import React from 'react';
import { Box, VStack, Text, Badge, useColorModeValue } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const TradingPairs = ({ pairs }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <VStack spacing={4} align="stretch">
      <AnimatePresence>
        {pairs?.map((pair, index) => (
          <MotionBox
            key={pair.id}
            bg={cardBg}
            p={4}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Text fontWeight="bold">{pair.name}</Text>
              <Badge
                colorScheme={pair.profit >= 0 ? 'green' : 'red'}
                variant="subtle"
                px={2}
                py={1}
                borderRadius="md"
              >
                {pair.profit >= 0 ? '+' : ''}{pair.profit}%
              </Badge>
            </Box>
            <Box mt={2} display="flex" justifyContent="space-between">
              <Text fontSize="sm" color="gray.500">
                Volume: ${pair.volume}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Last Trade: {pair.lastTrade}
              </Text>
            </Box>
          </MotionBox>
        ))}
      </AnimatePresence>
    </VStack>
  );
};

export default TradingPairs;
