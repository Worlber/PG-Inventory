import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import { inventoryApi } from '../../api/inventory';
import { Application } from '../../types';

const envColors: Record<string, string> = {
  prod: '#D32F2F',
  'pre-prod': '#F57C00',
  qa: '#1976D2',
  dev: '#388E3C',
};

export default function ApplicationsTab() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.getApplications().then(({ data }) => {
      setApps(data.results);
      setLoading(false);
    });
  }, []);

  if (loading) return <CircularProgress />;

  if (apps.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No applications yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create an application to start organizing your PostgreSQL instances.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {apps.map((app) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={app.id}>
          <Card>
            <CardActionArea onClick={() => navigate(`/applications/${app.id}`)}>
              <CardContent>
                <Typography variant="h6" gutterBottom noWrap>
                  {app.name}
                </Typography>
                {app.description && (
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
                    {app.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {app.instance_count} node{app.instance_count !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                {app.pg_instances && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {Object.entries(
                      app.pg_instances.reduce<Record<string, number>>((acc, inst) => {
                        acc[inst.environment] = (acc[inst.environment] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([env, count]) => (
                      <Chip
                        key={env}
                        label={`${env}: ${count}`}
                        size="small"
                        sx={{
                          backgroundColor: envColors[env] || '#757575',
                          color: '#fff',
                          fontSize: '0.75rem',
                        }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
