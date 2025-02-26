import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { 
  Star, 
  StarBorder, 
  Search as SearchIcon,
  SwapHoriz as SwapIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

const TokenPairs = ({ selectedDexes = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set());

  // Sample data - replace with real data from your API
  const pairs = [
    { 
      id: 1,
      pair: 'ETH/USDT',
      dex: 'PancakeSwap',
      price: '1850.45',
      change24h: '+2.5',
      volume24h: '1.2M',
      liquidity: '2.5M',
    },
    { 
      id: 2,
      pair: 'BNB/USDT',
      dex: 'Biswap',
      price: '245.32',
      change24h: '-1.2',
      volume24h: '850K',
      liquidity: '1.8M',
    },
    { 
      id: 3,
      pair: 'CAKE/USDT',
      dex: 'PancakeSwap',
      price: '1.85',
      change24h: '+5.7',
      volume24h: '500K',
      liquidity: '750K',
    },
  ];

  const toggleFavorite = (pairId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(pairId)) {
        newFavorites.delete(pairId);
      } else {
        newFavorites.add(pairId);
      }
      return newFavorites;
    });
  };

  const filteredPairs = pairs.filter(pair => {
    const matchesSearch = pair.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        pair.dex.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const sortedPairs = [...filteredPairs].sort((a, b) => {
    // Show favorites first
    const aFav = favorites.has(a.id);
    const bFav = favorites.has(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Trading Pairs
        </Typography>
        <TextField
          size="small"
          placeholder="Search pairs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 200 }}
        />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell>Pair</TableCell>
              <TableCell>DEX</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">24h Change</TableCell>
              <TableCell align="right">24h Volume</TableCell>
              <TableCell align="right">Liquidity</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPairs.map((pair) => (
              <TableRow 
                key={pair.id}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'background.paper',
                    cursor: 'pointer'
                  }
                }}
              >
                <TableCell padding="checkbox">
                  <IconButton 
                    size="small" 
                    onClick={() => toggleFavorite(pair.id)}
                    color={favorites.has(pair.id) ? 'primary' : 'default'}
                  >
                    {favorites.has(pair.id) ? <Star /> : <StarBorder />}
                  </IconButton>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SwapIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {pair.pair}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={pair.dex}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    ${pair.price}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    {pair.change24h.startsWith('+') ? (
                      <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
                    )}
                    <Typography 
                      variant="body2"
                      color={pair.change24h.startsWith('+') ? 'success.main' : 'error.main'}
                    >
                      {pair.change24h}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    ${pair.volume24h}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    ${pair.liquidity}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Start trading">
                    <IconButton size="small" color="primary">
                      <TrendingUpIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TokenPairs;
