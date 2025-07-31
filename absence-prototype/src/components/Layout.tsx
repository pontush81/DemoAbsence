'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Assessment as AssessmentIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    handleMenuClose();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Kontek Lön - Avvikelseapp
          </Typography>
          
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button
              color="inherit"
              onClick={() => handleNavigation('/')}
              sx={{ 
                mx: 1,
                backgroundColor: isActive('/') ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              onClick={() => handleNavigation('/deviations')}
              sx={{ 
                mx: 1,
                backgroundColor: isActive('/deviations') ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
              startIcon={<AssessmentIcon />}
            >
              Avvikelser
            </Button>
            <Button
              color="inherit"
              onClick={() => handleNavigation('/export')}
              sx={{ 
                mx: 1,
                backgroundColor: isActive('/export') ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
              startIcon={<FileDownloadIcon />}
            >
              PAXML Export
            </Button>
          </Box>

          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handleNavigation('/')}>
                Dashboard
              </MenuItem>
              <MenuItem onClick={() => handleNavigation('/deviations')}>
                Avvikelser
              </MenuItem>
              <MenuItem onClick={() => handleNavigation('/export')}>
                PAXML Export
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
