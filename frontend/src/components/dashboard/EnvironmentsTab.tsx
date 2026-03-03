import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Circle as CircleIcon,
} from '@mui/icons-material';
import { inventoryApi } from '../../api/inventory';
import { PostgreSQLInstance } from '../../types';

const environments = [
  { key: 'prod', label: 'Production', color: '#1A3D28', bgColor: '#E8F5E9' },
  { key: 'pre-prod', label: 'Pre-Production', color: '#5E35B1', bgColor: '#EDE7F6' },
  { key: 'qa', label: 'QA', color: '#1976D2', bgColor: '#E3F2FD' },
  { key: 'dev', label: 'Development', color: '#00796B', bgColor: '#E0F2F1' },
];

export default function EnvironmentsTab() {
  const navigate = useNavigate();
  const [instances, setInstances] = useState<PostgreSQLInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.getInstances().then(({ data }) => {
      setInstances(data.results);
      setLoading(false);
    });
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Grid container spacing={2}>
      {environments.map((env) => {
        const envInstances = instances.filter((i) => i.environment === env.key);
        return (
          <Grid item xs={12} sm={6} md={3} key={env.key}>
            <Box
              sx={{
                border: `2px solid ${env.color}`,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  backgroundColor: env.bgColor,
                  px: 2,
                  py: 1,
                  borderBottom: `1px solid ${env.color}`,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} color={env.color}>
                  {env.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {envInstances.length} instance{envInstances.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Box sx={{ p: 1 }}>
                {envInstances.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                    No instances
                  </Typography>
                ) : (
                  envInstances.map((inst) => (
                    <Card key={inst.id} sx={{ mb: 1, boxShadow: 'none', border: '1px solid #E0E0E0' }}>
                      <CardActionArea onClick={() => navigate(`/instances/${inst.id}`)}>
                        <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CircleIcon
                              sx={{
                                fontSize: 10,
                                color: inst.is_up ? '#4CAF50' : '#D32F2F',
                              }}
                            />
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {inst.hostname}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            {inst.role && inst.role !== 'unknown' && (
                              <Chip
                                label={inst.role}
                                size="small"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                            {inst.application_name && (
                              <Chip
                                label={inst.application_name}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))
                )}
              </Box>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
}
