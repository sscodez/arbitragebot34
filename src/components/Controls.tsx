import React, { useState, useEffect } from 'react';
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
  Paper,
} from '@mui/material';
import { PlayArrow, Stop, Settings } from '@mui/icons-material';
import { CHAINS, DEXES } from '../config/chains';
import { useArbitrage } from '../hooks/useArbitrage';
import { useWallet } from '../hooks/useWallet';

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
  const { isInitialized, error: arbitrageError, arbitrageService } = useArbitrage();
  const { isConnected: walletConnected } = useWallet();
  const [logs, setLogs] = useState<Log[]>([]);
  const isRunning = botStatus === 'running';

  useEffect(() => {
    if (arbitrageService) {
      arbitrageService.setLogCallback((log: Log) => {
        setLogs(prevLogs => [...prevLogs, log]);
      });
    }
  }, [arbitrageService]);

  const handleChainChange = (event) => {
    const chain = event.target.value;
    onChainSelect(chain);
    onDexesSelect([]); // Reset DEX selection when chain changes
    setLogs([]); // Clear logs when chain changes
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

  const handleStart = async () => {
    setLogs([]); // Clear logs when starting
    onStart();
  };

  const canStart = isConnected && selectedChain && selectedDexes.length > 0 && isInitialized;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Bot Controls
      </Typography>

      {arbitrageError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {arbitrageError}
        </Alert>
      )}

      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel>Select Chain</InputLabel>
          <Select
            value={selectedChain || ''}
            onChange={handleChainChange}
            disabled={isRunning}
          >
            {Object.entries(CHAINS).map(([key, chain]) => (
              <MenuItem key={key} value={key}>
                {chain.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedChain && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Select DEXes
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {Object.entries(DEXES[selectedChain] || {}).map(([key, dex]) => (
                <Chip
                  key={key}
                  label={dex.name}
                  onClick={() => handleDexToggle(key)}
                  color={selectedDexes.includes(key) ? 'primary' : 'default'}
                  disabled={isRunning}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStart}
            disabled={!canStart || isRunning}
            startIcon={<PlayArrow />}
          >
            Start Bot
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onStop}
            disabled={!isRunning}
            startIcon={<Stop />}
          >
            Stop Bot
          </Button>
        </Stack>

        {/* Bot Logs */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Bot Logs
          </Typography>
          <Paper
            sx={{
              height: '400px',
              overflow: 'auto',
              p: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {logs.length === 0 ? (
              <Typography color="text.secondary" align="center">
                No logs yet. Start the bot to see activity.
              </Typography>
            ) : (
              logs.map((log, index) => (
                <Box
                  key={index}
                  sx={{
                    py: 1,
                    borderBottom: index < logs.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="body2"
                      color={
                        log.type === 'error' ? 'error' :
                        log.type === 'success' ? 'success.main' :
                        'text.secondary'
                      }
                      sx={{ fontWeight: 'medium' }}
                    >
                      {log.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                  {log.metadata && (
                    <Box sx={{ mt: 1, pl: 2 }}>
                      {Object.entries(log.metadata).map(([key, value]) => (
                        <Typography key={key} variant="caption" display="block" color="text.secondary">
                          {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              ))
            )}
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
};

export default Controls;
