export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'viewer';
  is_active: boolean;
  otp_enabled: boolean;
  date_joined: string;
}

export interface Application {
  id: number;
  name: string;
  description: string;
  instance_count: number;
  created_at: string;
  updated_at: string;
  pg_instances?: PostgreSQLInstanceSummary[];
}

export interface HAGroup {
  id: number;
  name: string;
  patroni_port: number;
  instance_count: number;
  created_at: string;
  instances?: PostgreSQLInstanceSummary[];
}

export interface PostgreSQLInstanceSummary {
  id: number;
  hostname: string;
  ip_address: string;
  port: number;
  environment: string;
  application: number | null;
  application_name: string | null;
  ha_enabled: boolean;
  ha_group: number | null;
  ha_group_name: string | null;
  is_up: boolean;
  role: string;
  pg_version: string;
  last_checked: string | null;
}

export interface PostgreSQLInstance extends PostgreSQLInstanceSummary {
  username: string;
  db_name: string;
  os_version: string;
  ram_mb: number | null;
  cpu_count: number | null;
  created_at: string;
  updated_at: string;
  databases?: DatabaseInfo[];
  db_users?: DatabaseUser[];
}

export interface DatabaseInfo {
  id: number;
  name: string;
  size_bytes: number;
  size_display: string;
  last_seen: string;
}

export interface DatabaseUser {
  id: number;
  username: string;
  is_superuser: boolean;
  can_login: boolean;
  permissions: string[];
  last_seen: string;
}

export interface SearchResult {
  type: 'instance' | 'database' | 'user';
  id: number;
  label: string;
  detail: string;
}

export interface DashboardStats {
  total_instances: number;
  up_instances: number;
  down_instances: number;
  total_applications: number;
  total_ha_groups: number;
  environment_counts: Record<string, number>;
}

export interface LoginResponse {
  otp_required?: boolean;
  id?: number;
  username?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
