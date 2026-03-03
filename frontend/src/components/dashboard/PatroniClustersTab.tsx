import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { Circle as CircleIcon, Refresh as RefreshIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { monitoringApi } from '../../api/monitoring';
import { inventoryApi } from '../../api/inventory';
import { HAGroup } from '../../types';
import { useAuthStore } from '../../store/authStore';

export default function PatroniClustersTab() {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState<HAGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<HAGroup | null>(null);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const fetchClusters = () => {
    setLoading(true);
    monitoringApi.getPatroniClusters().then(({ data }) => {
      setClusters(data.results);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await inventoryApi.deleteHAGroup(deleteTarget.id);
    setDeleteTarget(null);
    fetchClusters();
  };

  if (loading) return <CircularProgress />;

  if (clusters.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No Patroni clusters configured
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add instances with HA enabled to see Patroni clusters.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {clusters.map((cluster) => (
        <Card key={cluster.id}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{cluster.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {cluster.instances?.length || 0} members &middot; Port {cluster.patroni_port}
                </Typography>
                {isAdmin && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(cluster)}
                    title="Delete cluster"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Hostname</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>PG Version</TableCell>
                    <TableCell>Environment</TableCell>
                    <TableCell>Last Checked</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cluster.instances?.map((inst) => (
                    <TableRow
                      key={inst.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/instances/${inst.id}`)}
                    >
                      <TableCell>
                        <CircleIcon
                          sx={{ fontSize: 12, color: inst.is_up ? '#4CAF50' : '#D32F2F' }}
                        />
                      </TableCell>
                      <TableCell>{inst.hostname}</TableCell>
                      <TableCell>{inst.ip_address}:{inst.port}</TableCell>
                      <TableCell>
                        <Chip
                          label={inst.role || 'unknown'}
                          size="small"
                          color={inst.role === 'leader' || inst.role === 'primary' ? 'primary' : 'default'}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>{inst.pg_version || '-'}</TableCell>
                      <TableCell>
                        <Chip label={inst.environment} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {inst.last_checked ? new Date(inst.last_checked).toLocaleString() : 'Never'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            monitoringApi.refreshInstance(inst.id);
                          }}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Patroni Cluster</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the cluster "{deleteTarget?.name}"? This will only remove the HA group, not the instances.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
