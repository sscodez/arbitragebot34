import React from 'react';
import {
  Box,
  Button,
  HStack,
  useColorModeValue,
  Text,
  Badge,
} from '@chakra-ui/react';

const Controls = ({ isRunning, onStart, onStop, profit }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
    >
      <HStack spacing={4} justify="space-between">
        <HStack spacing={4}>
          <Button
            colorScheme={isRunning ? 'red' : 'green'}
            onClick={isRunning ? onStop : onStart}
            size="lg"
          >
            {isRunning ? 'Stop Bot' : 'Start Bot'}
          </Button>
          <Badge
            colorScheme={isRunning ? 'green' : 'gray'}
            fontSize="md"
            px={3}
            py={1}
            borderRadius="full"
          >
            {isRunning ? 'Running' : 'Stopped'}
          </Badge>
        </HStack>
        <HStack>
          <Text fontSize="lg" fontWeight="medium">
            Total Profit:
          </Text>
          <Text
            fontSize="lg"
            fontWeight="bold"
            color={profit >= 0 ? 'green.500' : 'red.500'}
          >
            {profit >= 0 ? '+' : ''}{profit.toFixed(4)} ETH
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
};

export default Controls;
