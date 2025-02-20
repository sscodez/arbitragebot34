import React from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
} from '@mui/material';
import { PlayArrow, Stop, Settings } from '@mui/icons-material';
import { CHAINS, DEXES } from '../config/chains';

const Controls = ({ 
  isConnected, 
  botStatus, 
  onStart, 
  onStop,
  onChainSelect,
  onDexesSelect,
  selectedChain,
  selectedDexes,
}) => {
  const isRunning = botStatus === 'running';

  const handleChainChange = (event) => {
    const chain = event.target.value;
    onChainSelect(chain);
    onDexesSelect([]); // Reset DEX selection when chain changes
  };

  const handleDexToggle = (dexKey) => {
    onDexesSelect(prev => {
      if (prev.includes(dexKey)) {
        return prev.filter(key => key !== dexKey);
      } else {
        return [...prev, dexKey];
      }
    });
  };

  const canStart = isConnected && selectedChain && selectedDexes.length > 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Bot Controls
      </Typography>

      {!isConnected ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Please connect your wallet to start trading
        </Alert>
      ) : (
        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* Chain Selection */}
          <FormControl fullWidth>
            <InputLabel>Select Chain</InputLabel>
            <Select
              value={selectedChain}
              label="Select Chain"
              onChange={handleChainChange}
              disabled={isRunning}
            >
              {Object.entries(CHAINS).map(([key, chain]) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{chain.icon}</span>
                    {chain.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* DEX Selection */}
          {selectedChain && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Select DEXes to monitor
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(DEXES[selectedChain] || {}).map(([key, dex]) => (
                  <Chip
                    key={key}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>{dex.icon}</span>
                        {dex.name}
                      </Box>
                    }
                    onClick={() => handleDexToggle(key)}
                    color={selectedDexes.includes(key) ? 'primary' : 'default'}
                    variant={selectedDexes.includes(key) ? 'filled' : 'outlined'}
                    disabled={isRunning}
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Control Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color={isRunning ? 'error' : 'success'}
              onClick={isRunning ? onStop : onStart}
              startIcon={isRunning ? <Stop /> : <PlayArrow />}
              disabled={!canStart}
            >
              {isRunning ? 'Stop Bot' : 'Start Bot'}
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              sx={{ minWidth: 'auto' }}
              disabled={isRunning}
            >
              <Settings />
            </Button>
          </Box>

          {isRunning && (
            <Alert 
              severity="info"
              icon={<CircularProgress size={20} color="inherit" />}
              sx={{ 
                '& .MuiAlert-icon': { 
                  alignItems: 'center',
                  padding: '4px 0'
                }
              }}
            >
              Bot is running and searching for opportunities on {selectedDexes.length} DEXes...
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default Controls;
