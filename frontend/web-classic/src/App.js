import { useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Tabs, 
  Tab,
  Container 
} from '@mui/material';
import { Timeline, Storage, Dashboard as DashboardIcon } from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import CANFrameTable from './components/CANFrameTable';
import RawMessageTable from './components/RawMessageTable';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#0a0e27', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#1a1f3a', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700 }}>
            🚗 CAN Bus Analytics Platform
          </Typography>
        </Toolbar>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ 
            bgcolor: '#0f1729',
            '& .MuiTab-root': { 
              color: '#8892b0',
              '&.Mui-selected': { color: '#667eea' }
            },
            '& .MuiTabs-indicator': { bgcolor: '#667eea' }
          }}
        >
          <Tab icon={<DashboardIcon />} label="Dashboard" iconPosition="start" />
          <Tab icon={<Storage />} label="CAN Frame Analyzer" iconPosition="start" />
          <Tab icon={<Timeline />} label="Raw Messages" iconPosition="start" />
        </Tabs>
      </AppBar>

      <Container maxWidth="xl">
        <TabPanel value={tabValue} index={0}>
          <Dashboard />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <CANFrameTable />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <RawMessageTable />
        </TabPanel>
      </Container>
    </Box>
  );
}

export default App;