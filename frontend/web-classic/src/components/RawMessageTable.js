import { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Search, Refresh, PlayArrow, Pause } from '@mui/icons-material';
import { api } from '../services/api';
import wsService from '../services/websocket';

export default function RawMessageTable() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState(5);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
    const interval = autoRefresh ? setInterval(fetchMessages, 2000) : null;
    return () => interval && clearInterval(interval);
  }, [timeRange, autoRefresh]);

  useEffect(() => {
    wsService.connect();
    const unsubscribe = wsService.subscribe((data) => {
      if (data.type === 'raw_message' && autoRefresh) {
        setMessages(prev => [data.data, ...prev].slice(0, 1000));
      }
    });
    return () => unsubscribe();
  }, [autoRefresh]);

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await api.getRawMessages(timeRange);
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterMessages = () => {
    if (!searchTerm) {
      setFilteredMessages(messages);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = messages.filter(msg =>
      msg.can_id.toLowerCase().includes(term) ||
      msg.signal_name.toLowerCase().includes(term) ||
      msg.signal_type.toLowerCase().includes(term) ||
      msg.data_hex.toLowerCase().includes(term)
    );
    setFilteredMessages(filtered);
    setPage(0);
  };

  const parseDataHex = (hex) => {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(hex.substr(i, 2).toUpperCase());
    }
    return bytes;
  };

  const calculateCRC = (data) => {
    let crc = 0;
    for (let i = 0; i < data.length; i += 2) {
      const byte = parseInt(data.substr(i, 2), 16);
      crc ^= byte;
    }
    return crc.toString(16).toUpperCase().padStart(2, '0');
  };

  const getSignalColor = (type) => {
    const colors = {
      ENGINE: '#667eea',
      VEHICLE: '#f093fb',
      FUEL: '#fad0c4',
      ELECTRICAL: '#a1c4fd'
    };
    return colors[type] || '#667eea';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const displayMessages = filteredMessages.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ p: 3, bgcolor: '#1a1f3a', borderRadius: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
          CAN Bus Raw Message Monitor
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by CAN ID, Signal, Type, or Hex Data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#8892b0' }} />
                </InputAdornment>
              ),
              sx: {
                color: '#fff',
                bgcolor: '#0f1729',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2d3748' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
              }
            }}
          />

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: '#8892b0' }}>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{
                color: '#fff',
                bgcolor: '#0f1729',
                '.MuiOutlinedInput-notchedOutline': { borderColor: '#2d3748' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
              }}
            >
              <MenuItem value={1}>Last 1 minute</MenuItem>
              <MenuItem value={5}>Last 5 minutes</MenuItem>
              <MenuItem value={15}>Last 15 minutes</MenuItem>
              <MenuItem value={30}>Last 30 minutes</MenuItem>
              <MenuItem value={60}>Last 1 hour</MenuItem>
            </Select>
          </FormControl>

          <IconButton
            onClick={() => setAutoRefresh(!autoRefresh)}
            sx={{
              bgcolor: autoRefresh ? '#667eea' : '#2d3748',
              color: '#fff',
              '&:hover': { bgcolor: autoRefresh ? '#5568d3' : '#3d4758' }
            }}
          >
            {autoRefresh ? <Pause /> : <PlayArrow />}
          </IconButton>

          <IconButton
            onClick={fetchMessages}
            disabled={loading}
            sx={{
              bgcolor: '#2d3748',
              color: '#fff',
              '&:hover': { bgcolor: '#3d4758' }
            }}
          >
            <Refresh />
          </IconButton>
        </Stack>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#8892b0' }}>
            Total Messages: <strong style={{ color: '#667eea' }}>{filteredMessages.length}</strong>
          </Typography>
          <Chip
            label={autoRefresh ? 'Live' : 'Paused'}
            size="small"
            sx={{
              bgcolor: autoRefresh ? '#10b981' : '#ef4444',
              color: '#fff',
              animation: autoRefresh ? 'pulse 2s infinite' : 'none'
            }}
          />
        </Box>
      </Box>

      <TableContainer sx={{ maxHeight: 600, bgcolor: '#0f1729', borderRadius: 1 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600 }}>
                Timestamp
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600 }}>
                CAN ID
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600 }}>
                Type
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600 }}>
                Signal
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600 }}>
                Raw Value
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600 }}>
                Physical Value
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600 }}>
                Data (8 bytes)
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600 }}>
                CRC
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayMessages.map((msg, idx) => {
              const dataBytes = parseDataHex(msg.data_hex);
              const crc = calculateCRC(msg.data_hex);

              return (
                <TableRow
                  key={idx}
                  sx={{
                    '&:hover': { bgcolor: '#1a1f3a' },
                    bgcolor: idx % 2 === 0 ? '#0f1729' : '#141b2d'
                  }}
                >
                  <TableCell sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {new Date(msg.timestamp * 1000).toLocaleTimeString()}.
                    {String(msg.timestamp).split('.')[1]?.substr(0, 3) || '000'}
                  </TableCell>

                  <TableCell sx={{ color: '#667eea', fontFamily: 'monospace', fontWeight: 600 }}>
                    {msg.can_id}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={msg.signal_type}
                      size="small"
                      sx={{
                        bgcolor: getSignalColor(msg.signal_type) + '20',
                        color: getSignalColor(msg.signal_type),
                        fontWeight: 600,
                        border: `1px solid ${getSignalColor(msg.signal_type)}`
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ color: '#fff', fontWeight: 500 }}>
                    {msg.signal_name}
                  </TableCell>

                  <TableCell sx={{ color: '#f093fb', fontFamily: 'monospace' }}>
                    0x{msg.raw_value.toString(16).toUpperCase().padStart(4, '0')}
                  </TableCell>

                  <TableCell sx={{ color: '#10b981', fontWeight: 600 }}>
                    {msg.physical_value.toFixed(2)} {msg.unit}
                  </TableCell>

                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {dataBytes.map((byte, i) => (
                        <Box
                          key={i}
                          sx={{
                            bgcolor: byte === '00' ? '#2d3748' : '#667eea30',
                            color: byte === '00' ? '#64748b' : '#a1c4fd',
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid #2d3748'
                          }}
                        >
                          {byte}
                        </Box>
                      ))}
                    </Box>
                  </TableCell>

                  <TableCell sx={{ color: '#fad0c4', fontFamily: 'monospace', fontWeight: 600 }}>
                    {crc}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredMessages.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[25, 50, 100, 200]}
        sx={{
          color: '#8892b0',
          '.MuiTablePagination-select': { color: '#fff' },
          '.MuiTablePagination-selectIcon': { color: '#8892b0' }
        }}
      />
    </Paper>
  );
}