import { Box, Button, Link, Stack, Typography, IconButton } from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material';
import React from 'react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer>
      <Box sx={{ 
        p: 4, 
        textAlign: 'center', 
        maxWidth: '1250px', 
        borderTop: '1px solid rgba(182, 170, 170, 0.4)', 
        mx: 'auto', 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb:6,
        mt:4
      }}>
        <Typography variant="body2" color="text.secondary" sx={{letterSpacing:1 , fontWeight:'500' , fontSize:'17px'}}>
          © 2025 PAI. All rights reserved.
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Link 
            href="#" 
            sx={{
              textDecoration: 'none',
              '&:hover': {
                color: 'rgb(255, 55, 199)',
                transition:'color 0.3s',
              }
            }}
          >
            <Typography>
              Privacy Policy
            </Typography>
          </Link>
          
          <Link 
            href="#" 
            sx={{
              textDecoration: 'none',
              '&:hover': {
                color: 'rgb(255, 55, 199)',
                transition:'color 0.3s'
              }
            }}
          >
            <Typography>
              Terms of Use
            </Typography>
          </Link>
          
          <IconButton
            onClick={scrollToTop}
            sx={{
              ml: 1,
              '&:hover': {
                backgroundColor: 'rgb(255, 55, 199)',
                color: 'white',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
            size="small"
          >
            <KeyboardArrowUp />
          </IconButton>
        </Stack>
      </Box>
    </footer>
  );
};

export default Footer;