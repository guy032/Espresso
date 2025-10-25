-- Create custom types for enums
CREATE TYPE severity_enum AS ENUM ('minor', 'major', 'critical');
CREATE TYPE status_enum AS ENUM ('open', 'in_progress', 'resolved');

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS issues;
DROP TYPE IF EXISTS severity_enum CASCADE;
DROP TYPE IF EXISTS status_enum CASCADE;

-- Recreate types
CREATE TYPE severity_enum AS ENUM ('minor', 'major', 'critical');
CREATE TYPE status_enum AS ENUM ('open', 'in_progress', 'resolved');

-- Create issues table
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    site VARCHAR(100) NOT NULL,
    severity severity_enum NOT NULL,
    status status_enum NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_title_site UNIQUE (title, site)
);

-- Create indexes for performance
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_severity ON issues(severity);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX idx_issues_site ON issues(site);
CREATE INDEX idx_issues_title_search ON issues USING GIN(to_tsvector('english', title));

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE
    ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional, for testing)
INSERT INTO issues (title, description, site, severity, status) VALUES
    ('Missing consent form', 'Consent form not in file for patient 003', 'Site-101', 'major', 'open'),
    ('Late visit', 'Visit week 4 occurred on week 6', 'Site-202', 'minor', 'in_progress'),
    ('Drug temp excursion', 'IP stored above max temp for 6 hours', 'Site-101', 'critical', 'open'),
    ('Unblinded email', 'Coordinator emailed treatment arm to CRA', 'Site-303', 'major', 'resolved');

-- Verify setup
SELECT COUNT(*) as total_issues FROM issues;
