import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Circle as CircleIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { inventoryApi } from '../../api/inventory';
import { monitoringApi } from '../../api/monitoring';
import { PostgreSQLInstance } from '../../types';
import { useAuthStore } from '../../store/authStore';
import InstanceForm from '../instances/InstanceForm';

export default function PgNodeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<PostgreSQLInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const fetchInstance = () => {
    if (!id) return;
    inventoryApi.getInstance(parseInt(id)).then(({ data }) => {
      setInstance(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!id) return;
    // Load cached data first, then auto-probe for live status
    inventoryApi.getInstance(parseInt(id)).then(({ data }) => {
      setInstance(data);
      setLoading(false);
      // Trigger live probe in background
      monitoringApi.refreshInstance(parseInt(id)).then(({ data: fresh }) => {
        setInstance(fresh);
      }).catch(() => {});
    });
  }, [id]);

  const handleRefresh = async () => {
    if (!id) return;
    try {
      const { data } = await monitoringApi.refreshInstance(parseInt(id));
      setInstance(data);
    } catch {
      fetchInstance();
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await inventoryApi.deleteInstance(parseInt(id));
    navigate(-1);
  };

  const handleExport = async (type: 'databases' | 'users', format: string = 'csv') => {
    try {
      const response = await inventoryApi.exportRaw(`/exports/instances/${id}/${type}/?filetype=${format}`);
      const contentType = response.headers['content-type'] || '';
      const isXlsx = contentType.includes('spreadsheet') || format === 'xlsx';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${id}.${isXlsx ? 'xlsx' : 'csv'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  };

  if (loading) return <CircularProgress />;
  if (!instance) return <Typography>Instance not found.</Typography>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/" underline="hover" color="inherit">Dashboard</Link>
        {instance.application_name && (
          <Link href={`/applications/${instance.application}`} underline="hover" color="inherit">
            {instance.application_name}
          </Link>
        )}
        <Typography color="text.primary">{instance.hostname}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircleIcon sx={{ fontSize: 16, color: instance.is_up ? '#4CAF50' : '#D32F2F' }} />
          <Typography variant="h4">{instance.hostname}</Typography>
          <Chip
            label={instance.is_up ? 'UP' : 'DOWN'}
            size="small"
            color={instance.is_up ? 'success' : 'error'}
          />
          {instance.role && instance.role !== 'unknown' && (
            <Chip label={instance.role} size="small" color="primary" />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={handleRefresh} variant="outlined" size="small">
            Refresh
          </Button>
          {isAdmin && (
            <>
              <IconButton onClick={() => setShowEdit(true)}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={() => setShowDelete(true)}>
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {/* System Info */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'IP Address', value: `${instance.ip_address}:${instance.port}` },
          { label: 'Environment', value: instance.environment?.toUpperCase() },
          { label: 'Application', value: instance.application_name || 'Unlinked' },
          { label: 'HA Group', value: instance.ha_group_name || 'None' },
          { label: 'PG Version', value: instance.pg_version || '-' },
          { label: 'OS Version', value: instance.os_version || '-' },
          { label: 'RAM', value: instance.ram_mb ? `${instance.ram_mb} MB` : '-' },
          { label: 'CPU Cores', value: instance.cpu_count?.toString() || '-' },
        ].map((item) => (
          <Grid item xs={6} sm={3} key={item.label}>
            <Card variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="body1" fontWeight={500}>{item.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Databases */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Databases ({instance.databases?.length || 0})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('databases', 'csv')}>
                CSV
              </Button>
              <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('databases', 'xlsx')}>
                Excel
              </Button>
            </Box>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Database Name</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell>Last Seen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instance.databases?.map((db) => (
                  <TableRow key={db.id}>
                    <TableCell>{db.name}</TableCell>
                    <TableCell align="right">{db.size_display}</TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(db.last_seen).toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No databases found. Run a probe to discover databases.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Users & Permissions ({instance.db_users?.length || 0})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('users', 'csv')}>
                CSV
              </Button>
              <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('users', 'xlsx')}>
                Excel
              </Button>
            </Box>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Superuser</TableCell>
                  <TableCell>Can Login</TableCell>
                  <TableCell>Role Memberships</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instance.db_users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_superuser ? 'Yes' : 'No'}
                        size="small"
                        color={user.is_superuser ? 'error' : 'default'}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.can_login ? 'Yes' : 'No'}
                        size="small"
                        color={user.can_login ? 'success' : 'default'}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      {user.permissions?.length > 0
                        ? user.permissions.join(', ')
                        : '-'}
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No users found. Run a probe to discover users.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <InstanceForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onCreated={fetchInstance}
        editInstance={instance}
      />

      <Dialog open={showDelete} onClose={() => setShowDelete(false)}>
        <DialogTitle>Remove Instance</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove "{instance.hostname}" ({instance.ip_address})?
            This will permanently delete the instance record and its associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
