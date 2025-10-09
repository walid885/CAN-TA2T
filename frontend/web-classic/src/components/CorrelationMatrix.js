import { Typography, Box } from '@mui/material';
import { useState, useEffect } from 'react';

export default function CorrelationMatrix({ data }) {
  if (!data || data.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Signal Correlations
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 2 }}>
          No correlation data available
        </Typography>
      </Box>
    );
  }

  const signals = [...new Set(data.flatMap(d => [d.signal1, d.signal2]))];
  
  const getCorrelation = (s1, s2) => {
    if (s1 === s2) return 1;
    const corr = data.find(d => 
      (d.signal1 === s1 && d.signal2 === s2) || 
      (d.signal1 === s2 && d.signal2 === s1)
    );
    return corr ? corr.correlation : 0;
  };

  const getColor = (value) => {
    const abs = Math.abs(value);
    if (abs > 0.7) return value > 0 ? '#10b981' : '#ef4444';
    if (abs > 0.4) return value > 0 ? '#60a5fa' : '#f59e0b';
    return '#6b7280';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Signal Correlations
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `80px repeat(${signals.length}, 60px)`, gap: '2px', mt: 2 }}>
          <Box />
          {signals.map(sig => (
            <Box key={sig} sx={{ 
              fontSize: '10px', 
              color: '#8892b0', 
              transform: 'rotate(-45deg)',
              transformOrigin: 'left',
              height: '40px',
              display: 'flex',
              alignItems: 'flex-end'
            }}>
              {sig}
            </Box>
          ))}
          
          {signals.map(sig1 => (
            <>
              <Box key={`label-${sig1}`} sx={{ 
                fontSize: '10px', 
                color: '#8892b0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                pr: 1
              }}>
                {sig1}
              </Box>
              {signals.map(sig2 => {
                const corr = getCorrelation(sig1, sig2);
                return (
                  <Box
                    key={`${sig1}-${sig2}`}
                    sx={{
                      bgcolor: getColor(corr),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#fff',
                      fontWeight: 600,
                      borderRadius: '4px',
                      height: '40px'
                    }}
                  >
                    {corr.toFixed(2)}
                  </Box>
                );
              })}
            </>
          ))}
        </Box>
      </Box>
    </Box>
  );
}