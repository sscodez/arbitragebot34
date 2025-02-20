import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useColorModeValue,
  useToast as useChakraToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const WalletSetup = ({ onConnect }) => {
  const [privateKey, setPrivateKey] = useState('');
  const toast = useChakraToast();
  const bgColor = useColorModeValue('white', 'gray.800');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!privateKey) {
      toast({
        title: 'Error',
        description: 'Please enter your private key',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      onConnect(privateKey);
      
      toast({
        title: 'Success',
        description: 'Wallet connected successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect wallet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      maxW="md"
      mx="auto"
      mt={20}
    >
      <Box
        bg={bgColor}
        p={8}
        borderRadius="xl"
        boxShadow="xl"
        border="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <VStack spacing={6}>
          <Text fontSize="2xl" fontWeight="bold">
            Connect Your Wallet
          </Text>
          <Text color="gray.500">
            Enter your private key to start using the arbitrage bot
          </Text>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Private Key</FormLabel>
                <Input
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Enter your private key"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                isDisabled={!privateKey}
              >
                Connect Wallet
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </MotionBox>
  );
};

export default WalletSetup;
