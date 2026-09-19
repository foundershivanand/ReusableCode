-- Module 03: Multi-Tenancy & Workspace Management Schema
-- Database: PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    domain VARCHAR(255),
    custom_domain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING_DELETION')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain ON organizations(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- 2. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workspace_org_slug UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON workspaces(organization_id);

-- 3. Members
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invited_by VARCHAR(64),
    CONSTRAINT uq_member_org_user UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_org_user ON members(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_members_ws_user ON members(workspace_id, user_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_user_status ON members(user_id, status);

-- 4. Invitations
CREATE TABLE IF NOT EXISTS invitations (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED')),
    expires_at TIMESTAMPTZ NOT NULL,
    invited_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_org_email ON invitations(organization_id, email);

-- 5. Row-Level Security (RLS) Example Pattern
-- Enable RLS on multi-tenant tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Note: In application queries, set session variable:
-- SET LOCAL app.current_tenant_id = 'org_xxx';
-- CREATE POLICY tenant_isolation_workspaces ON workspaces
--     FOR ALL
--     USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), ''));
