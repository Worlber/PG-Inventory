import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Breadcrumbs,
  Link,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { inventoryApi } from '../../api/inventory';
import { monitoringApi } from '../../api/monitoring';
import { Application } from '../../types';
import { useAuthStore } from '../../store/authStore';
import InstanceForm from '../instances/InstanceForm';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInstanceForm, setShowInstanceForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    inventoryApi.getApplication(parseInt(id)).then(({ data }) => {
      setApp(data);
      setLoading(false);
    });
  }, [id, refreshKey]);

  // Auto-probe all instances on page load, then refresh with live data
  useEffect(() => {
    monitoringApi.refreshAll().then(() => {
      setRefreshKey((k) => k + 1);
    }).catch(() => {});
  }, []);

  const handleEditOpen = () => {
    if (!app) return;
    setEditName(app.name);
    setEditDescription(app.description);
    setShowEditDialog(true);
  };

  const handleEditSave = async () => {
    if (!id) return;
    await inventoryApi.updateApplication(parseInt(id), { name: editName, description: editDescription });
    setShowEditDialog(false);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = async () => {
    if (!id) return;
    await inventoryApi.deleteApplication(parseInt(id));
    navigate('/');
  };

  if (loading) return <CircularProgress />;
  if (!app) return <Typography>Application not found.</Typography>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/" underline="hover" color="inherit">Dashboard</Link>
        <Typography color="text.primary">{app.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">{app.name}</Typography>
          {app.description && (
            <Typography variant="body1" color="text.secondary">{app.description}</Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {app.instance_count} node{app.instance_count !== 1 ? 's' : ''}
          </Typography>
        </Box>
        {isAdmin && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowInstanceForm(true)}
            >
              Add Node
            </Button>
            <IconButton onClick={handleEditOpen}>
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={() => setShowDeleteDialog(true)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      {!app.pg_instances || app.pg_instances.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No PostgreSQL nodes yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add a PostgreSQL instance to this application.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {app.pg_instances.map((inst) => (
            <Grid item xs={12} sm={6} md={4} key={inst.id}>
              <Card>
                <CardActionArea onClick={() => navigate(`/instances/${inst.id}`)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CircleIcon
                        sx={{ fontSize: 12, color: inst.is_up ? '#4CAF50' : '#D32F2F' }}
                      />
                      <Typography variant="h6" noWrap>{inst.hostname}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {inst.ip_address}:{inst.port}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                      <Chip
                        label={inst.is_up ? 'UP' : 'DOWN'}
                        size="small"
                        color={inst.is_up ? 'success' : 'error'}
                        sx={{ fontSize: '0.75rem' }}
                      />
                      {inst.role && inst.role !== 'unknown' && (
                        <Chip
                          label={inst.role}
                          size="small"
                          color={inst.role === 'primary' || inst.role === 'leader' ? 'primary' : 'default'}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      )}
                      <Chip label={inst.environment} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                    </Box>
                    {inst.pg_version && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {inst.pg_version}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <InstanceForm
        open={showInstanceForm}
        onClose={() => setShowInstanceForm(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
        defaultApplication={app.id}
      />

      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Application</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Name" value={editName}
            onChange={(e) => setEditName(e.target.value)} margin="dense" required
          />
          <TextField
            fullWidth label="Description" value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)} margin="dense"
            multiline rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{app.name}"? The PostgreSQL instances under this
            application will NOT be deleted — they will be unlinked and remain in the inventory.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
