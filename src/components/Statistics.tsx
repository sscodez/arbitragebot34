import React from 'react';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { TrendingUp, SwapHoriz, CheckCircle, Error } from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      backgroundColor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}.main`,
          opacity: 0.1,
          mr: 1,
        }}
      >
        {icon}
      </Box>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      {value}
    </Typography>
  </Box>
);

const Statistics = ({ data }) => {
  const {
    totalTrades,
    successfulTrades,
    failedTrades,
    totalProfit,
    bestTrade,
  } = data;

  const successRate = totalTrades > 0 
    ? ((successfulTrades / totalTrades) * 100).toFixed(1)
    : 0;

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Statistics
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <StatCard
            title="Total Profit"
            value={`$${totalProfit.toFixed(2)}`}
            icon={<TrendingUp sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={6}>
          <StatCard
            title="Total Trades"
            value={totalTrades}
            icon={<SwapHoriz sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        
        <Grid item xs={6}>
          <StatCard
            title="Success Rate"
            value={`${successRate}%`}
            icon={<CheckCircle sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Success Rate
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={parseFloat(successRate)}
                size={80}
                thickness={4}
                sx={{ color: 'success.main' }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {`${successRate}%`}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Statistics;
