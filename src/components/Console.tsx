import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Divider,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  InputBase,
  alpha,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material';

const LOG_TYPES = {
  success: { icon: CheckIcon, color: 'success.main', label: 'Success' },
  error: { icon: ErrorIcon, color: 'error.main', label: 'Error' },
  info: { icon: InfoIcon, color: 'info.main', label: 'Info' },
  warning: { icon: WarningIcon, color: 'warning.main', label: 'Warning' },
  action: { icon: AutoFixHighIcon, color: 'secondary.main', label: 'Action' },
};

const Console = ({ logs = [], onClear }) => {
  const [filters, setFilters] = useState(Object.keys(LOG_TYPES));
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const consoleRef = useRef(null);
  const [selectedLogs, setSelectedLogs] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  // Filter and search logs
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filters.includes(log.type);
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleFilterClick = (type) => {
    setFilters(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = () => {
    const content = filteredLogs
      .map(log => `[${new Date(log.timestamp).toLocaleString()}] [${log.type.toUpperCase()}] ${log.message}`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogClick = (timestamp) => {
    if (!isSelecting) return;
    
    setSelectedLogs(prev => {
      const next = new Set(prev);
      if (next.has(timestamp)) {
        next.delete(timestamp);
      } else {
        next.add(timestamp);
      }
      return next;
    });
  };

  const handleCopySelected = () => {
    const selectedContent = filteredLogs
      .filter(log => selectedLogs.has(log.timestamp))
      .map(log => `[${new Date(log.timestamp).toLocaleString()}] [${log.type.toUpperCase()}] ${log.message}`)
      .join('\n');
    
    navigator.clipboard.writeText(selectedContent);
    setIsSelecting(false);
    setSelectedLogs(new Set());
  };

  return (
    <Paper 
      sx={{ 
        height: '400px', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Console
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          {/* Search */}
          <Paper
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              width: 200,
              bgcolor: theme => alpha(theme.palette.common.black, 0.05),
            }}
          >
            <SearchIcon sx={{ p: '4px', color: 'text.secondary' }} />
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Paper>

          {/* Type Filters */}
          <Stack direction="row" spacing={0.5}>
            {Object.entries(LOG_TYPES).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Tooltip key={type} title={config.label}>
                  <IconButton
                    size="small"
                    color={filters.includes(type) ? 'primary' : 'default'}
                    onClick={() => handleFilterClick(type)}
                  >
                    <Icon fontSize="small" />
                  </IconButton>
                </Tooltip>
              );
            })}
          </Stack>

          <Divider orientation="vertical" flexItem />

          {/* Actions */}
          <Tooltip title="Download Logs">
            <IconButton size="small" onClick={handleDownload}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Clear Console">
            <IconButton size="small" onClick={onClear} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
              }
              label="Auto-scroll"
            />
          </MenuItem>
          <MenuItem onClick={() => setIsSelecting(!isSelecting)}>
            {isSelecting ? 'Cancel Selection' : 'Select Logs'}
          </MenuItem>
          {isSelecting && selectedLogs.size > 0 && (
            <MenuItem onClick={handleCopySelected}>
              Copy Selected ({selectedLogs.size})
            </MenuItem>
          )}
        </Menu>
      </Box>

      {/* Logs */}
      <Box
        ref={consoleRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
          '& > div:hover': {
            bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        {filteredLogs.map((log) => {
          const { icon: Icon, color } = LOG_TYPES[log.type];
          const isSelected = selectedLogs.has(log.timestamp);
          
          return (
            <Box
              key={log.timestamp}
              onClick={() => handleLogClick(log.timestamp)}
              sx={{
                py: 0.5,
                px: 1,
                borderRadius: 1,
                cursor: isSelecting ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                bgcolor: isSelected ? theme => alpha(theme.palette.primary.main, 0.15) : 'transparent',
              }}
            >
              <Icon sx={{ color, mt: 0.5, fontSize: '1rem' }} />
              
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {log.message}
                </Typography>
                
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                >
                  {new Date(log.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Status Bar */}
      <Box
        sx={{
          p: 0.5,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {filteredLogs.length} logs
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
            icon={autoScroll ? <PlayIcon fontSize="small" /> : <StopIcon fontSize="small" />}
            color={autoScroll ? 'success' : 'default'}
            variant="outlined"
          />
        </Stack>
      </Box>
    </Paper>
  );
};

export default Console;
