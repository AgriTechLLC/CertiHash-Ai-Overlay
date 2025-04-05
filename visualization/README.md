# Visualization

The visualization module provides dashboards and data visualization configurations for the CERTIHASH metrics system. It includes:

- Pre-configured Grafana dashboards
- Prometheus metric collection settings
- Dashboard provisioning templates
- Alert configurations

## Key Components

- `dashboards/`: JSON dashboard definitions for Grafana
- `provisioning/`: Configuration files for automated dashboard and datasource setup
- `provisioning/prometheus.yml`: Prometheus scraper configuration
- `provisioning/recording_rules.yml`: Metric aggregation rules