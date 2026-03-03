import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockReset as LockResetIcon,
  NoEncryption as NoEncryptionIcon,
} from '@mui/icons-material';
import { usersApi } from '../../api/users';
import { User } from '../../types';
import { useAuthStore } from '../../store/authStore';

export default function UserManagementPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  // Edit dialog
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Reset password dialog
  const [showResetPw, setShowResetPw] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const fetchUsers = () => {
    usersApi.getUsers().then(({ data }) => {
      setUsers(data.results);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    setError('');
    try {
      await usersApi.createUser({
        username: newUsername,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setShowCreate(false);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('viewer');
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data;
      if (typeof detail === 'object') {
        setError(Object.values(detail).flat().join(' '));
      } else {
        setError('Failed to create user.');
      }
    }
  };

  const handleEditOpen = (u: User) => {
    setEditUser(u);
    setEditEmail(u.email);
    setEditFirstName(u.first_name);
    setEditLastName(u.last_name);
    setEditRole(u.role);
    setEditActive(u.is_active);
    setError('');
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setError('');
    try {
      await usersApi.updateUser(editUser.id, {
        email: editEmail,
        first_name: editFirstName,
        last_name: editLastName,
        role: editRole as 'admin' | 'viewer',
        is_active: editActive,
      });
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data;
      if (typeof detail === 'object') {
        setError(Object.values(detail).flat().join(' '));
      } else {
        setError('Failed to update user.');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!showResetPw) return;
    setError('');
    try {
      await usersApi.resetPassword(showResetPw.id, resetPassword);
      setShowResetPw(null);
      setResetPassword('');
    } catch {
      setError('Failed to reset password.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usersApi.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      setError('Failed to delete user.');
    }
  };

  const handleDisableOtp = async (user: User) => {
    if (!window.confirm(`Disable OTP for "${user.username}"?`)) return;
    await usersApi.disableOtp(user.id);
    fetchUsers();
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">Access Denied</Typography>
        <Typography variant="body2" color="text.secondary">
          Only administrators can manage users.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreate(true)}>
          Create User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>OTP</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} sx={{ opacity: u.is_active ? 1 : 0.5 }}>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {u.first_name || u.last_name
                    ? `${u.first_name} ${u.last_name}`.trim()
                    : '-'}
                </TableCell>
                <TableCell>
                  <Chip label={u.role} size="small" color={u.role === 'admin' ? 'primary' : 'default'} />
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.otp_enabled ? 'Enabled' : 'Disabled'}
                    size="small"
                    color={u.otp_enabled ? 'success' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={u.is_active ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(u.date_joined).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton size="small" title="Edit User" onClick={() => handleEditOpen(u)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" title="Reset Password" onClick={() => setShowResetPw(u)}>
                    <LockResetIcon fontSize="small" />
                  </IconButton>
                  {u.otp_enabled && (
                    <IconButton size="small" title="Disable OTP" onClick={() => handleDisableOtp(u)}>
                      <NoEncryptionIcon fontSize="small" />
                    </IconButton>
                  )}
                  {u.id !== currentUser?.id && (
                    <IconButton
                      size="small"
                      color="error"
                      title="Delete User"
                      onClick={() => setDeleteTarget(u)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth label="Username" value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)} margin="normal" required
          />
          <TextField
            fullWidth label="Email" type="email" value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)} margin="normal" required
          />
          <TextField
            fullWidth label="Password" type="password" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} margin="normal" required
            helperText="Minimum 8 characters"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select value={newRole} onChange={(e) => setNewRole(e.target.value)} label="Role">
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User — {editUser?.username}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth label="First Name" value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)} margin="normal"
            />
            <TextField
              fullWidth label="Last Name" value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)} margin="normal"
            />
          </Box>
          <TextField
            fullWidth label="Email" type="email" value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)} margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select value={editRole} onChange={(e) => setEditRole(e.target.value)} label="Role">
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                disabled={editUser?.id === currentUser?.id}
              />
            }
            label="Active"
            sx={{ mt: 1 }}
          />
          {editUser?.id === currentUser?.id && (
            <Typography variant="caption" color="text.secondary" display="block">
              You cannot deactivate your own account.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!showResetPw} onClose={() => setShowResetPw(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password for {showResetPw?.username}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="New Password" type="password" value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)} margin="normal" required
            helperText="Minimum 8 characters"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetPw(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleResetPassword}>Reset Password</Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete "{deleteTarget?.username}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
