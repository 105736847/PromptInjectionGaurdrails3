/**
 * MuiAppLayout – the classic app shell: an AppBar on top and a Drawer
 * (side navigation) that slides in when you press the menu button.
 *
 * Normally both are fixed to the WINDOW. To keep this demo inside its box we
 * render the Drawer into the box (ModalProps.container) and position it
 * absolutely. In your own app you can drop those extra props.
 */
import { useRef, useState } from 'react';
import {
  AppBar,
  Badge,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { Bell, BrainCircuit, ChartColumn, House, Menu, Settings } from 'lucide-react';

const PAGES = [
  { label: 'Home', icon: House },
  { label: 'Predict', icon: BrainCircuit },
  { label: 'Results', icon: ChartColumn },
  { label: 'Settings', icon: Settings },
];

export default function MuiAppLayout() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState('Home');
  const boxRef = useRef(null);

  function choosePage(label) {
    setPage(label);
    setOpen(false);
  }

  return (
    <Box
      ref={boxRef}
      sx={{ position: 'relative', height: 320, overflow: 'hidden', border: 1, borderColor: 'divider', borderRadius: 2 }}
    >
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
            sx={{ mr: 1 }}
          >
            <Menu size={22} />
          </IconButton>
          <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
            Student Success Predictor
          </Typography>
          <IconButton color="inherit" aria-label="2 notifications">
            <Badge badgeContent={2} color="error">
              <Bell size={20} />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ p: 3 }}>
        <Typography variant="h5" component="h4" gutterBottom>
          {page}
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          Press the menu button to open the drawer, then pick a page. Press Escape or click the dark backdrop to close it.
        </Typography>
      </Box>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ container: () => boxRef.current }} // render inside the box, not <body>
        sx={{
          position: 'absolute', // stay inside the demo box (a real app leaves this out)
          '& .MuiBackdrop-root': { position: 'absolute' },
          '& .MuiDrawer-paper': { position: 'absolute', width: 230 },
        }}
      >
        <Toolbar>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Navigation
          </Typography>
        </Toolbar>
        <List component="nav" aria-label="Pages">
          {PAGES.map(({ label, icon: Icon }) => (
            <ListItemButton
              key={label}
              selected={page === label}
              aria-current={page === label ? 'page' : undefined}
              onClick={() => choosePage(label)}
            >
              <ListItemIcon>
                <Icon size={20} />
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </Box>
  );
}
