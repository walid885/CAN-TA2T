import { useState, useEffect } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, Box, Typography, Chip, IconButton, InputAdornment,
  Stack, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText,
  OutlinedInput, Accordion, AccordionSummary, AccordionDetails, Divider, Tooltip
} from '@mui/material';
import { 
  Search, Refresh, PlayArrow, Pause, FilterList, ExpandMore, Download 
} from '@mui/icons-material';
import { api } from '../services/api';
import wsService from '../services/websocket';

export default function CANFrameTable() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState(5);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [availableCanIds, setAvailableCanIds] = useState([]);
  const [selectedCanIds, setSelectedCanIds] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSignals, setSelectedSignals] = useState([]);
  const [filterExpanded, setFilterExpanded] = useState(false);

  const signalTypes = ['ENGINE', 'VEHICLE', 'FUEL', 'ELECTRICAL'];
  const availableSignals = ['RPM', 'Speed', 'CoolantTemp', 'ThrottlePosition', 'FuelLevel', 'BatteryVoltage'];

  useEffect(() => {
    fetchMessages();
    fetchAvailableCanIds();
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
    applyFilters();
  }, [messages, searchTerm, selectedCanIds, selectedTypes, selectedSignals]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await api.getRawMessages(timeRange, 1000);
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCanIds = async () => {
    try {
      const response = await api.getUniqueCanIds(60);
      setAvailableCanIds(response.data);
    } catch (err) {
      console.error('Error fetching CAN IDs:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...messages];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(msg =>
        msg.can_id.toLowerCase().includes(term) ||
        msg.signal_name.toLowerCase().includes(term) ||
        msg.signal_type.toLowerCase().includes(term) ||
        msg.data_hex.toLowerCase().includes(term)
      );
    }

    // CAN ID filter
    if (selectedCanIds.length > 0) {
      filtered = filtered.filter(msg => selectedCanIds.includes(msg.can_id));
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(msg => selectedTypes.includes(msg.signal_type));
    }

    // Signal filter
    if (selectedSignals.length > 0) {
      filtered = filtered.filter(msg => selectedSignals.includes(msg.signal_name));
    }

    setFilteredMessages(filtered);
    setPage(0);
  };

  const resetFilters = () => {
    setSelectedCanIds([]);
    setSelectedTypes([]);
    setSelectedSignals([]);
    setSearchTerm('');
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

  const exportToCSV = () => {
    const headers = ['Timestamp', 'CAN ID', 'Type', 'Signal', 'Raw Value', 'Physical Value', 'Unit', 'Data Hex', 'CRC'];
    const rows = filteredMessages.map(msg => [
      new Date(msg.timestamp * 1000).toISOString(),
      msg.can_id,
      msg.signal_type,
      msg.signal_name,
      `0x${msg.raw_value.toString(16).toUpperCase()}`,
      msg.physical_value,
      msg.unit,
      msg.data_hex,
      calculateCRC(msg.data_hex)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `can_frames_${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const displayMessages = filteredMessages.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const activeFilterCount = selectedCanIds.length + selectedTypes.length + selectedSignals.length;

  return (
    <Paper sx={{ p: 3, bgcolor: '#1a1f3a', borderRadius: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
          🚗 CAN Frame Analyzer
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
              <MenuItem value={1}>1 min</MenuItem>
              <MenuItem value={5}>5 min</MenuItem>
              <MenuItem value={15}>15 min</MenuItem>
              <MenuItem value={30}>30 min</MenuItem>
              <MenuItem value={60}>1 hour</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title={autoRefresh ? "Pause" : "Resume"}>
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
          </Tooltip>

          <Tooltip title="Refresh">
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
          </Tooltip>

          <Tooltip title="Export CSV">
            <IconButton
              onClick={exportToCSV}
              sx={{
                bgcolor: '#10b981',
                color: '#fff',
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              <Download />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Advanced Filters */}
        <Accordion 
          expanded={filterExpanded}
          onChange={() => setFilterExpanded(!filterExpanded)}
          sx={{ bgcolor: '#0f1729', mb: 2 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: '#8892b0' }} />}
            sx={{ 
              '&:hover': { bgcolor: '#1a1f3a' },
              borderRadius: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FilterList sx={{ color: '#667eea' }} />
              <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                Advanced Filters
              </Typography>
              {activeFilterCount > 0 && (
                <Chip 
                  label={`${activeFilterCount} active`}
                  size="small"
                  sx={{ bgcolor: '#667eea', color: '#fff' }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#8892b0' }}>CAN IDs</InputLabel>
                <Select
                  multiple
                  value={selectedCanIds}
                  onChange={(e) => setSelectedCanIds(e.target.value)}
                  input={<OutlinedInput label="CAN IDs" />}
                  renderValue={(selected) => selected.join(', ')}
                  sx={{
                    color: '#fff',
                    bgcolor: '#1a1f3a',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#2d3748' }
                  }}
                >
                  {availableCanIds.map((id) => (
                    <MenuItem key={id} value={id}>
                      <Checkbox checked={selectedCanIds.indexOf(id) > -1} />
                      <ListItemText primary={id} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel sx={{ color: '#8892b0' }}>Signal Types</InputLabel>
                <Select
                  multiple
                  value={selectedTypes}
                  onChange={(e) => setSelectedTypes(e.target.value)}
                  input={<OutlinedInput label="Signal Types" />}
                  renderValue={(selected) => selected.join(', ')}
                  sx={{
                    color: '#fff',
                    bgcolor: '#1a1f3a',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#2d3748' }
                  }}
                >
                  {signalTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      <Checkbox checked={selectedTypes.indexOf(type) > -1} />
                      <ListItemText primary={type} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel sx={{ color: '#8892b0' }}>Signals</InputLabel>
                <Select
                  multiple
                  value={selectedSignals}
                  onChange={(e) => setSelectedSignals(e.target.value)}
                  input={<OutlinedInput label="Signals" />}
                  renderValue={(selected) => selected.join(', ')}
                  sx={{
                    color: '#fff',
                    bgcolor: '#1a1f3a',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#2d3748' }
                  }}
                >
                  {availableSignals.map((signal) => (
                    <MenuItem key={signal} value={signal}>
                      <Checkbox checked={selectedSignals.indexOf(signal) > -1} />
                      <ListItemText primary={signal} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: '#8892b0', mb: 1 }}>
                    Quick Filters
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip 
                      label="ENGINE only" 
                      onClick={() => setSelectedTypes(['ENGINE'])}
                      sx={{ bgcolor: '#667eea30', color: '#667eea', cursor: 'pointer' }}
                    />
                    <Chip 
                      label="VEHICLE only" 
                      onClick={() => setSelectedTypes(['VEHICLE'])}
                      sx={{ bgcolor: '#f093fb30', color: '#f093fb', cursor: 'pointer' }}
                    />
                    <Chip 
                      label="Clear All" 
                      onClick={resetFilters}
                      sx={{ bgcolor: '#ef444430', color: '#ef4444', cursor: 'pointer' }}
                    />
                  </Stack>
                </Box>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ borderColor: '#2d3748', mb: 2 }} />

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: '#8892b0' }}>
            Total: <strong style={{ color: '#667eea' }}>{filteredMessages.length}</strong> frames
          </Typography>
          <Typography variant="body2" sx={{ color: '#8892b0' }}>
            Displaying: <strong style={{ color: '#10b981' }}>{displayMessages.length}</strong>
          </Typography>
          <Chip
            label={autoRefresh ? 'Live' : 'Paused'}
            size="small"
            sx={{
              bgcolor: autoRefresh ? '#10b981' : '#ef4444',
              color: '#fff',
              animation: autoRefresh ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 }
              }
            }}
          />
          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount} filters active`}
              size="small"
              onDelete={resetFilters}
              sx={{ bgcolor: '#667eea30', color: '#667eea' }}
            />
          )}
        </Box>
      </Box>

      <TableContainer sx={{ maxHeight: 600, bgcolor: '#0f1729', borderRadius: 1 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600, minWidth: 120 }}>
                Timestamp
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600, minWidth: 80 }}>
                CAN ID
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600, minWidth: 100 }}>
                Type
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600, minWidth: 120 }}>
                Signal
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600, minWidth: 100 }}>
                Raw Value
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600, minWidth: 120 }}>
                Physical Value
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600, minWidth: 300 }}>
                CAN Frame (8 bytes)
              </TableCell>
              <TableCell sx={{ bgcolor: '#1a1f3a', color: '#8892b0', fontWeight: 600, minWidth: 60 }}>
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

                  <TableCell>
                    <Chip
                      label={msg.can_id}
                      size="small"
                      sx={{
                        bgcolor: '#667eea30',
                        color: '#667eea',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        border: '1px solid #667eea'
                      }}
                    />
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
                        <Tooltip 
                          key={i} 
                          title={`Byte ${i}: 0x${byte} (${parseInt(byte, 16)})`}
                          arrow
                        >
                          <Box
                            sx={{
                              bgcolor: byte === '00' ? '#2d3748' : '#667eea30',
                              color: byte === '00' ? '#64748b' : '#a1c4fd',
                              px: 0.75,
                              py: 0.25,
                              borderRadius: 0.5,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: '1px solid #2d3748',
                              cursor: 'help',
                              transition: 'all 0.2s',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                bgcolor: byte === '00' ? '#3d4758' : '#667eea50'
                              }
                            }}
                          >
                            {byte}
                          </Box>
                        </Tooltip>
                      ))}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={crc}
                      size="small"
                      sx={{
                        bgcolor: '#fad0c430',
                        color: '#fad0c4',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        border: '1px solid #fad0c4'
                      }}
                    />
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
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[25, 50, 100, 200, 500]}
        sx={{
          color: '#8892b0',
          borderTop: '1px solid #2d3748',
          mt: 2,
          '.MuiTablePagination-select': { color: '#fff' },
          '.MuiTablePagination-selectIcon': { color: '#8892b0' },
          '.MuiTablePagination-displayedRows': { color: '#8892b0' }
        }}
      />
    </Paper>
  );
}