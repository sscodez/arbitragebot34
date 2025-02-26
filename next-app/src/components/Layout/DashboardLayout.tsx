import React from 'react';
import { Box, Flex, useColorModeValue, Icon, Text } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChartLine, FaWallet, FaCog, FaExchangeAlt } from 'react-icons/fa';

const MotionBox = motion(Box);

const DashboardLayout = ({ children }) => {
  const bg = useColorModeValue('gray.50', 'gray.900');
  const sidebarBg = useColorModeValue('white', 'gray.800');

  const menuItems = [
    { icon: FaChartLine, label: 'Dashboard', path: '/' },
    { icon: FaWallet, label: 'Wallet', path: '/wallet' },
    { icon: FaExchangeAlt, label: 'Trades', path: '/trades' },
    { icon: FaCog, label: 'Settings', path: '/settings' },
  ];

  return (
    <Flex h="100vh" overflow="hidden">
      <MotionBox
        as="nav"
        w="64"
        bg={sidebarBg}
        boxShadow="lg"
        initial={{ x: -200 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Flex direction="column" h="full" py="6">
          <Box px="4" mb="8">
            <Text fontSize="2xl" fontWeight="bold">
              Arbitrage Bot
            </Text>
          </Box>
          {menuItems.map((item, index) => (
            <MotionBox
              key={item.label}
              whileHover={{ scale: 1.05, backgroundColor: useColorModeValue('gray.100', 'gray.700') }}
              whileTap={{ scale: 0.95 }}
              px="4"
              py="3"
              cursor="pointer"
              display="flex"
              alignItems="center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Icon as={item.icon} mr="3" />
              <Text>{item.label}</Text>
            </MotionBox>
          ))}
        </Flex>
      </MotionBox>

      <MotionBox
        flex="1"
        bg={bg}
        p="6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        overflow="auto"
      >
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </MotionBox>
    </Flex>
  );
};

export default DashboardLayout;
