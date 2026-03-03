import { Box, Typography, Link } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1A3D28',
        color: 'rgba(255,255,255,0.85)',
        py: 2,
        px: 3,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" fontWeight={600}>
          WORLBER
        </Typography>
        <Typography variant="body2">
          PG Inventory by Worlber Database Services
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
        Built for the PostgreSQL Community
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Link
          href="mailto:contactus@worlber.com"
          sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}
          underline="hover"
        >
          contactus@worlber.com
        </Link>
        <Link
          href="https://linkedin.com/company/worlber-database-consultancy/"
          target="_blank"
          rel="noopener"
          sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}
          underline="hover"
        >
          LinkedIn
        </Link>
        <Link
          href="/about"
          sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}
          underline="hover"
        >
          About
        </Link>
      </Box>
    </Box>
  );
}
