import { 
    Box, 
    Paper, 
    Button, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Chip, 
    Typography,
    Divider,
    Stack
  } from '@mui/material';
  import { Download, Refresh, FilterList } from '@mui/icons-material';
  
  export default function ControlPanel({ 
    timeRange, 
    setTimeRange, 
    selectedSignals, 
    setSelectedSignals, 
    onExport,
    onRefresh 
  }) {
    const availableSignals = ['RPM', 'Speed', 'CoolantTemp', 'ThrottlePosition', 'FuelLevel', 'BatteryVoltage'];
  
    const handleSignalToggle = (signal) => {
      setSelectedSignals(prev =>
        prev.includes(signal)
          ? prev.filter(s => s !== signal)
          : [...prev, signal]
      );
    };
  
    const handleSelectAll = () => {
      setSelectedSignals(availableSignals);
    };
  
    const handleClearAll = () => {
      setSelectedSignals([]);
    };
  
    return (
      <Paper sx={{ p: 3, m: 2, bgcolor: '#1a1f3a', borderRadius: 2 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#8892b0', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList fontSize="small" />
              Time Range
            </Typography>
            <FormControl fullWidth size="small">
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
                <MenuItem value={180}>Last 3 hours</MenuItem>
                <MenuItem value={360}>Last 6 hours</MenuItem>
              </Select>
            </FormControl>
          </Box>
  
          <Divider sx={{ borderColor: '#2d3748' }} />
  
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#8892b0' }}>
                Signal Selection
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  size="small" 
                  onClick={handleSelectAll}
                  sx={{ color: '#667eea', fontSize: '0.75rem' }}
                >
                  Select All
                </Button>
                <Button 
                  size="small" 
                  onClick={handleClearAll}
                  sx={{ color: '#ef4444', fontSize: '0.75rem' }}
                >
                  Clear
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {availableSignals.map(signal => (
                <Chip
                  key={signal}
                  label={signal}
                  onClick={() => handleSignalToggle(signal)}
                  sx={{
                    bgcolor: selectedSignals.includes(signal) ? '#667eea' : '#2d3748',
                    color: '#fff',
                    fontWeight: selectedSignals.includes(signal) ? 600 : 400,
                    '&:hover': { 
                      bgcolor: selectedSignals.includes(signal) ? '#5568d3' : '#3d4758',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s'
                    },
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Box>
          </Box>
  
          <Divider sx={{ borderColor: '#2d3748' }} />
  
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={onRefresh}
              sx={{ 
                bgcolor: '#2d3748', 
                '&:hover': { bgcolor: '#3d4758' },
                flex: 1,
                minWidth: '120px'
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => onExport('csv')}
              sx={{ 
                bgcolor: '#667eea', 
                '&:hover': { bgcolor: '#5568d3' },
                flex: 1,
                minWidth: '120px'
              }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => onExport('json')}
              sx={{ 
                bgcolor: '#667eea', 
                '&:hover': { bgcolor: '#5568d3' },
                flex: 1,
                minWidth: '120px'
              }}
            >
              Export JSON
            </Button>
          </Box>
        </Stack>
      </Paper>
    );
  }