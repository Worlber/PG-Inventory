import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';

export default function ProfilePage() {
  const { user, checkAuth } = useAuthStore();

  const [otpSetup, setOtpSetup] = useState<{ secret: string; qr_code: string } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [disableOtpCode, setDisableOtpCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSetupOtp = async () => {
    setError('');
    setMessage('');
    try {
      const { data } = await authApi.setupOtp();
      setOtpSetup(data);
    } catch {
      setError('Failed to start OTP setup.');
    }
  };

  const handleEnableOtp = async () => {
    setError('');
    try {
      await authApi.enableOtp(otpCode);
      setOtpSetup(null);
      setOtpCode('');
      setMessage('OTP enabled successfully.');
      await checkAuth();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP code.');
    }
  };

  const handleDisableOtp = async () => {
    setError('');
    try {
      await authApi.disableOtp(disableOtpCode);
      setDisableOtpCode('');
      setMessage('OTP disabled.');
      await checkAuth();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP code.');
    }
  };

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>My Profile</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Account Info</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Username</Typography>
              <Typography fontWeight={500}>{user.username}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Email</Typography>
              <Typography fontWeight={500}>{user.email || '-'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Role</Typography>
              <Chip label={user.role} size="small" color={user.role === 'admin' ? 'primary' : 'default'} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Joined</Typography>
              <Typography fontWeight={500}>{new Date(user.date_joined).toLocaleDateString()}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Two-Factor Authentication (OTP)</Typography>

          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {user.otp_enabled ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                OTP is currently <strong>enabled</strong> on your account.
              </Alert>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Enter your current OTP code to disable two-factor authentication:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="OTP Code"
                  value={disableOtpCode}
                  onChange={(e) => setDisableOtpCode(e.target.value)}
                  size="small"
                  inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
                />
                <Button variant="outlined" color="error" onClick={handleDisableOtp}>
                  Disable OTP
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                OTP is currently <strong>disabled</strong>. Enable it for extra security.
              </Alert>

              {!otpSetup ? (
                <Button variant="contained" onClick={handleSetupOtp}>
                  Set Up OTP
                </Button>
              ) : (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                  </Typography>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <img src={otpSetup.qr_code} alt="OTP QR Code" style={{ width: 200, height: 200 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, textAlign: 'center' }}>
                    Manual key: <code>{otpSetup.secret}</code>
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Enter the 6-digit code from your authenticator app to verify:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="OTP Code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      size="small"
                      inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
                    />
                    <Button variant="contained" onClick={handleEnableOtp}>
                      Verify & Enable
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
