import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import apiClient from '../../api/client';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, verifyOtp } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch CSRF cookie on mount
  useEffect(() => {
    apiClient.get('/auth/login/');
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.otp_required) {
        setShowOtp(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(otpCode);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A3D28',
        p: 2,
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <img
          src="/logo.png"
          alt="Worlber PG Inventory"
          style={{ maxWidth: 340, width: '100%', height: 'auto', mixBlendMode: 'screen' }}
        />
      </Box>

      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: 4 }}>
          {!showOtp ? (
            <form onSubmit={handleLogin}>
              <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', color: '#1A3D28' }}>
                Sign In
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                autoFocus
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify}>
              <Typography variant="h5" sx={{ mb: 1, textAlign: 'center', color: '#1A3D28' }}>
                Two-Factor Authentication
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
                Enter the 6-digit code from your authenticator app
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="OTP Code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                margin="normal"
                required
                autoFocus
                inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify'}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => {
                  setShowOtp(false);
                  setError('');
                }}
                sx={{ mt: 1 }}
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 4 }}>
        Built by Worlber Database Services for the PostgreSQL Community
      </Typography>
    </Box>
  );
}
