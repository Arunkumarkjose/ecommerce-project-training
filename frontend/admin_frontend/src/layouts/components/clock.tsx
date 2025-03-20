import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000); // Update time every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1976D2', // MUI Primary Blue
        color: 'white',
        padding: '6px 12px',
        borderRadius: '8px',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
        fontFamily: 'monospace',
        minWidth: '120px',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '16px' }}>
        {time.toLocaleTimeString()}
      </Typography>
    </Box>
  );
}
