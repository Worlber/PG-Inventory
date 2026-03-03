import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { inventoryApi } from '../../api/inventory';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function ApplicationForm({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Application name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await inventoryApi.createApplication({ name: name.trim(), description });
      setName('');
      setDescription('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.name?.[0] || 'Failed to create application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Application</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          fullWidth
          label="Application Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
          autoFocus
          placeholder="e.g., ERP, CRM, HR System"
        />
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={2}
          placeholder="Optional description"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
