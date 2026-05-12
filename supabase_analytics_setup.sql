-- Add total_disposal to mis_entries if it does not exist
ALTER TABLE mis_entries ADD COLUMN IF NOT EXISTS total_disposal numeric DEFAULT 0;

-- Optional: Create an index to speed up date-range and site filtering
CREATE INDEX IF NOT EXISTS idx_mis_entries_date ON mis_entries(date);
CREATE INDEX IF NOT EXISTS idx_mis_entries_site ON mis_entries(site);
