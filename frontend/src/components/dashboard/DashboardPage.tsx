import { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ApplicationsTab from './ApplicationsTab';
import EnvironmentsTab from './EnvironmentsTab';
import PatroniClustersTab from './PatroniClustersTab';
import ApplicationForm from './ApplicationForm';
import InstanceForm from '../instances/InstanceForm';
import { inventoryApi } from '../../api/inventory';
import { monitoringApi } from '../../api/monitoring';
import { DashboardStats } from '../../types';
import { useAuthStore } from '../../store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showAppForm, setShowAppForm] = useState(false);
  const [showInstanceForm, setShowInstanceForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    inventoryApi.getDashboardStats().then(({ data }) => setStats(data));
  }, [refreshKey]);

  // Auto-probe all instances on dashboard load, then refresh UI with live data
  useEffect(() => {
    monitoringApi.refreshAll().then(() => {
      setRefreshKey((k) => k + 1);
    }).catch(() => {});
  }, []);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Dashboard</Typography>
          {stats && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {stats.total_instances} instances &middot; {stats.up_instances} up &middot;{' '}
              {stats.down_instances} down &middot; {stats.total_applications} applications
            </Typography>
          )}
        </Box>
        {isAdmin && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setShowAppForm(true)}>
              Add Application
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowInstanceForm(true)}>
              Add Instance
            </Button>
          </Box>
        )}
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 },
        }}
      >
        <Tab label="Applications" />
        <Tab label="Environments" />
        <Tab label="Patroni Clusters" />
      </Tabs>

      {tab === 0 && <ApplicationsTab key={refreshKey} />}
      {tab === 1 && <EnvironmentsTab key={refreshKey} />}
      {tab === 2 && <PatroniClustersTab key={refreshKey} />}

      <ApplicationForm
        open={showAppForm}
        onClose={() => setShowAppForm(false)}
        onCreated={refresh}
      />
      <InstanceForm
        open={showInstanceForm}
        onClose={() => setShowInstanceForm(false)}
        onCreated={refresh}
      />
    </Box>
  );
}
