import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Link,
  Divider,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  LinkedIn as LinkedInIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';

export default function AboutPage() {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <img
          src="/worlber-logo.png"
          alt="Worlber Database Services"
          style={{ maxWidth: 300, width: '100%', height: 'auto' }}
        />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            About PG Inventory
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>PG Inventory</strong> is built by <strong>Worlber Database Services</strong> for
            the PostgreSQL community. It provides a centralized platform to manage and monitor your
            PostgreSQL infrastructure across all environments.
          </Typography>
          <Typography variant="body1" paragraph>
            Track your PostgreSQL instances, monitor their health via Patroni API integration,
            manage HA clusters, and export your inventory data — all from a single dashboard.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            About Worlber Database Services
          </Typography>
          <Typography variant="body1" paragraph>
            Worlber is Saudi Arabia's premier PostgreSQL enterprise solutions provider, helping
            businesses reduce database costs by 60-70% while maximizing performance compared
            to proprietary alternatives like Oracle and SQL Server.
          </Typography>
          <Typography variant="body1" paragraph>
            Our services include:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <li><Typography variant="body1">CYBERTEC PGEE (PostgreSQL Enterprise Edition)</Typography></li>
            <li><Typography variant="body1">Carbonite DoubleTake migration services</Typography></li>
            <li><Typography variant="body1">Worlber Quick Deploy (automated cluster deployment)</Typography></li>
            <li><Typography variant="body1">PostgreSQL consulting and support</Typography></li>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Contact Us
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <PhoneIcon sx={{ color: '#2D5A3D' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">
                    <Link href="tel:+966599252224" underline="hover" color="inherit">
                      +966 59 925 2224
                    </Link>
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <EmailIcon sx={{ color: '#2D5A3D' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body1">
                    <Link href="mailto:contactus@worlber.com" underline="hover" color="inherit">
                      contactus@worlber.com
                    </Link>
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocationIcon sx={{ color: '#2D5A3D' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Address</Typography>
                  <Typography variant="body1">
                    King Saud University, Riyadh 12372, Saudi Arabia
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <LinkedInIcon sx={{ color: '#2D5A3D' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">LinkedIn</Typography>
                  <Typography variant="body1">
                    <Link
                      href="https://linkedin.com/company/worlber-database-consultancy/"
                      target="_blank"
                      rel="noopener"
                      underline="hover"
                      color="inherit"
                    >
                      Worlber Database Consultancy
                    </Link>
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <CalendarIcon sx={{ color: '#2D5A3D' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Schedule a Meeting</Typography>
                  <Typography variant="body1">
                    <Link
                      href="https://calendly.com/contactus-worlber/30min"
                      target="_blank"
                      rel="noopener"
                      underline="hover"
                      color="inherit"
                    >
                      Book a 30-min call
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
