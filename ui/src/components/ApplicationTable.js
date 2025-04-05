import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TableSortLabel,
  CircularProgress,
  Box,
  Chip
} from '@mui/material';
import axios from 'axios';

/**
 * Component to display transaction data by application
 */
const ApplicationTable = () => {
  const [appData, setAppData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [orderBy, setOrderBy] = useState('transactions');
  const [order, setOrder] = useState('desc');
  
  useEffect(() => {
    const fetchAppData = async () => {
      try {
        const response = await axios.get('/api/metrics', {
          params: {
            query: 'sum by(app_id) (certihash_transactions_total)'
          }
        });
        
        // Extract data from Prometheus response
        if (response.data.data?.result) {
          const results = response.data.data.result;
          const formattedData = results.map(item => ({
            appId: item.metric.app_id,
            transactions: parseFloat(item.value[1]),
            tps: Math.random() * 100,
            status: Math.random() > 0.8 ? 'warning' : 'healthy'
          }));
          setAppData(formattedData);
        } else {
          // Use fallback data if real data not available
          setAppData(generateFallbackData());
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application data:', err);
        setAppData(generateFallbackData());
        setError('Using sample data');
        setLoading(false);
      }
    };
    
    fetchAppData();
    
    // Refresh every minute
    const intervalId = setInterval(fetchAppData, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Generate fallback data for display when API is unavailable
  const generateFallbackData = () => {
    const apps = [
      { appId: 'sentinel-node', transactions: 12456789, tps: 78.5, status: 'healthy' },
      { appId: 'certihash-main', transactions: 3254893, tps: 32.1, status: 'healthy' },
      { appId: 'whats-on-chain', transactions: 985641, tps: 14.3, status: 'healthy' },
      { appId: 'merchant-api', transactions: 452368, tps: 8.9, status: 'warning' },
      { appId: 'metanode', transactions: 325147, tps: 6.2, status: 'healthy' },
      { appId: 'smartledger', transactions: 298753, tps: 4.8, status: 'healthy' },
      { appId: 'teranode', transactions: 20152, tps: 0.4, status: 'warning' }
    ];
    return apps;
  };
  
  // Handle sorting
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Sort function
  const sortData = (data, orderBy, order) => {
    return data.sort((a, b) => {
      if (order === 'asc') {
        return a[orderBy] < b[orderBy] ? -1 : 1;
      } else {
        return a[orderBy] > b[orderBy] ? -1 : 1;
      }
    });
  };
  
  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Format large numbers
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };
  
  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const sortedData = sortData([...appData], orderBy, order);
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Transactions by Application
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table aria-label="application data table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'appId'}
                      direction={orderBy === 'appId' ? order : 'asc'}
                      onClick={() => handleRequestSort('appId')}
                    >
                      Application
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'transactions'}
                      direction={orderBy === 'transactions' ? order : 'asc'}
                      onClick={() => handleRequestSort('transactions')}
                    >
                      Transactions
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'tps'}
                      direction={orderBy === 'tps' ? order : 'asc'}
                      onClick={() => handleRequestSort('tps')}
                    >
                      TPS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleRequestSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((app) => (
                  <TableRow key={app.appId} hover>
                    <TableCell component="th" scope="row">
                      {app.appId}
                    </TableCell>
                    <TableCell align="right">{formatNumber(app.transactions)}</TableCell>
                    <TableCell align="right">{app.tps.toFixed(1)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={app.status}
                        color={getStatusColor(app.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={appData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
          
          {error && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {error}
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
};

export default ApplicationTable;