-- BioMine Procurement Workflow Upgrade

ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS dispatched_at timestamptz;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS dispatched_by text;

ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS delivered_by text;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS delivery_notes text;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS invoice_reference text;

ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS quantity_fulfilled numeric DEFAULT 0;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS procurement_owner uuid REFERENCES auth.users(id);

-- Optional: Add status constraint if we want to enforce it later, but keeping it text for flexibility.
