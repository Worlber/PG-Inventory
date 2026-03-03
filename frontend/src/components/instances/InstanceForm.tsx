import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Autocomplete,
  Box,
  Typography,
} from '@mui/material';
import { inventoryApi } from '../../api/inventory';
import { Application, HAGroup, PostgreSQLInstance } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultApplication?: number;
  editInstance?: PostgreSQLInstance | null;
}

export default function InstanceForm({ open, onClose, onCreated, defaultApplication, editInstance }: Props) {
  const isEdit = Boolean(editInstance);

  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('5432');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dbName, setDbName] = useState('postgres');
  const [environment, setEnvironment] = useState('');
  const [applicationId, setApplicationId] = useState<number | ''>('');
  const [haEnabled, setHaEnabled] = useState(false);
  const [haGroupName, setHaGroupName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [apps, setApps] = useState<Application[]>([]);
  const [haGroups, setHaGroups] = useState<HAGroup[]>([]);

  useEffect(() => {
    if (open) {
      inventoryApi.getApplications().then(({ data }) => setApps(data.results));
      inventoryApi.getHAGroups().then(({ data }) => setHaGroups(data.results));

      if (editInstance) {
        setHostname(editInstance.hostname);
        setIpAddress(editInstance.ip_address);
        setPort(String(editInstance.port));
        setUsername(editInstance.username);
        setPassword('');
        setDbName(editInstance.db_name || 'postgres');
        setEnvironment(editInstance.environment);
        setApplicationId(editInstance.application || '');
        setHaEnabled(editInstance.ha_enabled);
        setHaGroupName(editInstance.ha_group_name || '');
      } else {
        if (defaultApplication) setApplicationId(defaultApplication);
      }
    }
  }, [open, defaultApplication, editInstance]);

  const resetForm = () => {
    setHostname('');
    setIpAddress('');
    setPort('5432');
    setUsername('');
    setPassword('');
    setDbName('postgres');
    setEnvironment('');
    setApplicationId('');
    setHaEnabled(false);
    setHaGroupName('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!hostname.trim() || !ipAddress.trim() || !environment) {
      setError('Hostname, IP address, and environment are required.');
      return;
    }
    if (!isEdit && (!username.trim() || !password)) {
      setError('Username and password are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let haGroupId: number | null = null;

      if (haEnabled && haGroupName) {
        const existing = haGroups.find((g) => g.name === haGroupName);
        if (existing) {
          haGroupId = existing.id;
        } else {
          const { data } = await inventoryApi.createHAGroup({ name: haGroupName });
          haGroupId = data.id;
        }
      }

      const payload: Record<string, unknown> = {
        hostname: hostname.trim(),
        ip_address: ipAddress.trim(),
        port: parseInt(port),
        username: username.trim(),
        db_name: dbName.trim() || 'postgres',
        environment,
        application: applicationId || null,
        ha_enabled: haEnabled,
        ha_group: haGroupId,
      };

      if (password) {
        payload.password = password;
      }

      if (isEdit && editInstance) {
        await inventoryApi.updateInstance(editInstance.id, payload);
      } else {
        payload.password = password;
        await inventoryApi.createInstance(payload);
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err: any) {
      const detail = err.response?.data;
      if (typeof detail === 'object') {
        const msg = Object.values(detail).flat().join(' ');
        setError(msg || `Failed to ${isEdit ? 'update' : 'create'} instance.`);
      } else {
        setError(`Failed to ${isEdit ? 'update' : 'create'} instance.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit PostgreSQL Instance' : 'Add PostgreSQL Instance'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, color: 'text.secondary' }}>
          Connection Details
        </Typography>
        <TextField
          fullWidth label="Hostname / Label" value={hostname}
          onChange={(e) => setHostname(e.target.value)} margin="dense" required
          placeholder="e.g., erp-pg-primary-01"
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth label="IP Address" value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)} margin="dense" required
            placeholder="e.g., 10.0.1.50"
          />
          <TextField
            label="Port" value={port}
            onChange={(e) => setPort(e.target.value)} margin="dense"
            sx={{ width: 120 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth label="Username" value={username}
            onChange={(e) => setUsername(e.target.value)} margin="dense" required={!isEdit}
          />
          <TextField
            fullWidth label="Password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} margin="dense" required={!isEdit}
            helperText={isEdit ? 'Leave blank to keep current' : undefined}
          />
        </Box>
        <TextField
          fullWidth label="Database Name" value={dbName}
          onChange={(e) => setDbName(e.target.value)} margin="dense"
          placeholder="postgres" helperText="Database to connect to for probing"
        />

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
          Classification
        </Typography>
        <FormControl fullWidth margin="dense" required>
          <InputLabel>Environment *</InputLabel>
          <Select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            label="Environment *"
          >
            <MenuItem value="dev">Development</MenuItem>
            <MenuItem value="qa">QA</MenuItem>
            <MenuItem value="pre-prod">Pre-Production</MenuItem>
            <MenuItem value="prod">Production</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Application (optional)</InputLabel>
          <Select
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value as number)}
            label="Application (optional)"
          >
            <MenuItem value="">None</MenuItem>
            {apps.map((app) => (
              <MenuItem key={app.id} value={app.id}>{app.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
          High Availability
        </Typography>
        <FormControlLabel
          control={<Switch checked={haEnabled} onChange={(e) => setHaEnabled(e.target.checked)} />}
          label="HA Enabled"
        />
        {haEnabled && (
          <Autocomplete
            freeSolo
            options={haGroups.map((g) => g.name)}
            value={haGroupName}
            onInputChange={(_, v) => setHaGroupName(v)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="HA Group Name"
                margin="dense"
                fullWidth
                placeholder="Select existing or type new name"
              />
            )}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {isEdit ? 'Save Changes' : 'Add Instance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
