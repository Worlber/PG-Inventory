import logging
import re

import requests

logger = logging.getLogger(__name__)


class PatroniService:
    """Queries Patroni REST API for cluster status."""

    def get_cluster_status(self, host: str, port: int = 8008) -> dict | None:
        try:
            response = requests.get(f"http://{host}:{port}/cluster", timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.warning("Failed to get Patroni cluster status from %s:%s: %s", host, port, e)
            return None

    def get_node_health(self, host: str, port: int = 8008) -> dict | None:
        try:
            response = requests.get(f"http://{host}:{port}/patroni", timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.warning("Failed to get Patroni node health from %s:%s: %s", host, port, e)
            return None


class PGConnectorService:
    """Connects to PG instances to gather metadata."""

    def probe_instance(self, host: str, port: int, username: str, password: str, db_name: str = "postgres") -> dict:
        result = {
            "is_up": False,
            "pg_version": "",
            "os_version": "",
            "databases": [],
            "users": [],
        }

        try:
            import psycopg

            conninfo = (
                f"host={host} port={port} user={username} "
                f"password={password} dbname={db_name} connect_timeout=10"
            )

            with psycopg.connect(conninfo) as conn:
                result["is_up"] = True

                # PG version and OS
                with conn.cursor() as cur:
                    cur.execute("SELECT version()")
                    row = cur.fetchone()
                    if row and row[0]:
                        version_str = row[0]
                        result["pg_version"] = version_str.split(",")[0]
                        # Extract OS from e.g. "on x86_64-pc-linux-gnu"
                        on_match = re.search(r"on\s+(\S+)", version_str)
                        if on_match:
                            result["os_version"] = on_match.group(1)

                # System info (RAM, CPU) via /proc on Linux
                with conn.cursor() as cur:
                    try:
                        cur.execute(
                            "SELECT "
                            "(SELECT count(*) FROM regexp_matches(pg_read_file('/proc/cpuinfo'), 'processor', 'g'))::int, "
                            "(SELECT (regexp_match(pg_read_file('/proc/meminfo'), 'MemTotal:\\s+(\\d+)'))[1]::bigint / 1024)::int"
                        )
                        row = cur.fetchone()
                        if row:
                            if row[0]:
                                result["cpu_count"] = row[0]
                            if row[1]:
                                result["ram_mb"] = row[1]
                    except Exception:
                        pass  # pg_read_file may not be available to non-superusers

                # Databases
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT datname, pg_database_size(datname) "
                        "FROM pg_database WHERE datistemplate = false"
                    )
                    result["databases"] = [
                        {"name": row[0], "size_bytes": row[1]}
                        for row in cur.fetchall()
                    ]

                # Users/roles
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT rolname, rolsuper, rolcanlogin, "
                        "ARRAY(SELECT b.rolname FROM pg_catalog.pg_auth_members m "
                        "JOIN pg_catalog.pg_roles b ON m.roleid = b.oid "
                        "WHERE m.member = r.oid) as memberof "
                        "FROM pg_catalog.pg_roles r "
                        "WHERE rolname NOT LIKE 'pg_%' "
                        "ORDER BY rolname"
                    )
                    result["users"] = [
                        {
                            "username": row[0],
                            "is_superuser": row[1],
                            "can_login": row[2],
                            "permissions": list(row[3]) if row[3] else [],
                        }
                        for row in cur.fetchall()
                    ]

        except Exception as e:
            logger.warning("Failed to probe PG instance %s:%s: %s", host, port, e)
            result["error"] = str(e)

        return result
