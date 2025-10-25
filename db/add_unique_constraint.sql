-- Add unique constraint for upsert functionality
ALTER TABLE issues 
ADD CONSTRAINT unique_title_site UNIQUE (title, site);
