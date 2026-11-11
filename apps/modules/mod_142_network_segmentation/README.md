# Module 142: Network Segmentation

VPC 3-tier network topology:
1. Public Subnet: Load balancer only
2. Private Subnet: API containers & background workers
3. Isolated DB Subnet: PostgreSQL / Redis (no internet access)
