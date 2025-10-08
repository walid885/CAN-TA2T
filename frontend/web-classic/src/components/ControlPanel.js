import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, Chip, Paper } from '@mui/material';
import { Download } from '@mui/icons-material';

export default function ControlPanel({ timeRange, setTimeRange, selectedSignals, setSelectedSignals, onExport }) {
  const availableSignals = ['RPM', 'Speed', 'CoolantTemp', 'ThrottlePosition', 'FuelLevel', 'BatteryVoltage'];

  const handleSignalToggle = (signal) => {
    setSelectedSignals(prev =>
      prev.includes(signal)
        ? prev.filter(s => s !== signal)
        : [...prev, signal]
    );
  };

  return (
    <Paper sx={{ p: 2, m: 2, bgcolor: '#1a1f3a' }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel sx={{ color: '#8892b0' }}>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#2d3748' } }}
          >
            <MenuItem value={1}>1 minute</MenuItem>
            <MenuItem value={5}>5 minutes</MenuItem>
            <MenuItem value={15}>15 minutes</MenuItem>
            <MenuItem value={30}>30 minutes</MenuItem>
            <MenuItem value={60}>1 hour</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {availableSignals.map(signal => (
            <Chip
              key={signal}
              label={signal}
              onClick={() => handleSignalToggle(signal)}
              color={selectedSignals.includes(signal) ? 'primary' : 'default'}
              sx={{
                bgcolor: selectedSignals.includes(signal) ? '#667eea' : '#2d3748',
                color: '#fff',
                '&:hover': { bgcolor: selectedSignals.includes(signal) ? '#5568d3' : '#3d4758' }
              }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => onExport('csv')}
            sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => onExport('json')}
            sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
          >
            Export JSON
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}