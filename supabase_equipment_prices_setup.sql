-- ====================================================================
-- BIOMINE OPERATIONAL INTELLIGENCE PLATFORM
-- DATABASE UPGRADE: STATE-WISE EQUIPMENT & MACHINERY PRICE TRANSPARENCY
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create equipment_prices table
CREATE TABLE IF NOT EXISTS public.equipment_prices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name text NOT NULL,
    model_number text,
    category text NOT NULL CHECK (category IN ('Machinery', 'Equipment', 'Auxiliary')),
    state text NOT NULL,
    base_price numeric NOT NULL DEFAULT 0,
    gst_percent numeric NOT NULL DEFAULT 18.0,
    freight_cost numeric NOT NULL DEFAULT 0,
    state_cess numeric NOT NULL DEFAULT 0,
    specifications jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Ensure same equipment/model is unique per state
    CONSTRAINT uq_equipment_state UNIQUE (item_name, model_number, state)
);

-- Enable RLS
ALTER TABLE public.equipment_prices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated read on prices" ON public.equipment_prices;
DROP POLICY IF EXISTS "Allow authorized write on prices" ON public.equipment_prices;

-- Read policy: Anyone authenticated can read (transparency guaranteed)
CREATE POLICY "Allow authenticated read on prices" 
ON public.equipment_prices 
FOR SELECT 
TO authenticated 
USING (true);

-- Write policy: Restricted to Super Admins, Site Incharges, or Back Office
-- (We'll check user_roles/roles setup in Supabase or fallback to user permissions check in app)
CREATE POLICY "Allow authorized write on prices" 
ON public.equipment_prices 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('Super Admin', 'Site Incharge', 'Back Office')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('Super Admin', 'Site Incharge', 'Back Office')
    )
);

-- Auto-update updated_at function
CREATE OR REPLACE FUNCTION update_equipment_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS tr_update_equipment_prices_updated_at ON public.equipment_prices;
CREATE TRIGGER tr_update_equipment_prices_updated_at
BEFORE UPDATE ON public.equipment_prices
FOR EACH ROW
EXECUTE FUNCTION update_equipment_prices_updated_at();

-- Seed dynamic transparency parameters state-wise
INSERT INTO public.equipment_prices (item_name, model_number, category, state, base_price, gst_percent, freight_cost, state_cess, specifications)
VALUES
-- Excavators
('CAT Heavy Excavator', '390D L', 'Machinery', 'Jharkhand', 32000000, 18.0, 450000, 2.5, '{"engine_power": "524 HP", "operating_weight": "86275 kg", "bucket_capacity": "4.6 m³", "warranty": "36 Months"}'),
('CAT Heavy Excavator', '390D L', 'Machinery', 'Odisha', 32000000, 18.0, 480000, 4.0, '{"engine_power": "524 HP", "operating_weight": "86275 kg", "bucket_capacity": "4.6 m³", "warranty": "36 Months"}'),
('CAT Heavy Excavator', '390D L', 'Machinery', 'Chhattisgarh', 32000000, 18.0, 420000, 1.5, '{"engine_power": "524 HP", "operating_weight": "86275 kg", "bucket_capacity": "4.6 m³", "warranty": "36 Months"}'),
('CAT Heavy Excavator', '390D L', 'Machinery', 'Madhya Pradesh', 32000000, 18.0, 520000, 2.0, '{"engine_power": "524 HP", "operating_weight": "86275 kg", "bucket_capacity": "4.6 m³", "warranty": "36 Months"}'),
('CAT Heavy Excavator', '390D L', 'Machinery', 'West Bengal', 32000000, 18.0, 390000, 3.0, '{"engine_power": "524 HP", "operating_weight": "86275 kg", "bucket_capacity": "4.6 m³", "warranty": "36 Months"}'),

-- Dump Trucks
('Komatsu Off-Highway Dump Truck', 'HD785-7', 'Machinery', 'Jharkhand', 48000000, 18.0, 600000, 2.0, '{"engine_power": "1200 HP", "payload_capacity": "91.0 Ton", "gross_weight": "166500 kg", "max_speed": "65 km/h"}'),
('Komatsu Off-Highway Dump Truck', 'HD785-7', 'Machinery', 'Odisha', 48000000, 18.0, 650000, 3.5, '{"engine_power": "1200 HP", "payload_capacity": "91.0 Ton", "gross_weight": "166500 kg", "max_speed": "65 km/h"}'),
('Komatsu Off-Highway Dump Truck', 'HD785-7', 'Machinery', 'Chhattisgarh', 48000000, 18.0, 580000, 1.5, '{"engine_power": "1200 HP", "payload_capacity": "91.0 Ton", "gross_weight": "166500 kg", "max_speed": "65 km/h"}'),
('Komatsu Off-Highway Dump Truck', 'HD785-7', 'Machinery', 'Madhya Pradesh', 48000000, 18.0, 720000, 2.0, '{"engine_power": "1200 HP", "payload_capacity": "91.0 Ton", "gross_weight": "166500 kg", "max_speed": "65 km/h"}'),

-- Drill Rigs
('Sandvik Crawler Drill', 'DI550', 'Equipment', 'Jharkhand', 19000000, 18.0, 250000, 1.0, '{"hole_diameter": "90-165 mm", "engine": "CAT C13 328 kW", "air_delivery": "24.4 m³/min", "operating_weight": "24000 kg"}'),
('Sandvik Crawler Drill', 'DI550', 'Equipment', 'Odisha', 19000000, 18.0, 280000, 2.5, '{"hole_diameter": "90-165 mm", "engine": "CAT C13 328 kW", "air_delivery": "24.4 m³/min", "operating_weight": "24000 kg"}'),
('Sandvik Crawler Drill', 'DI550', 'Equipment', 'Rajasthan', 19000000, 18.0, 320000, 1.5, '{"hole_diameter": "90-165 mm", "engine": "CAT C13 328 kW", "air_delivery": "24.4 m³/min", "operating_weight": "24000 kg"}'),

-- Wheel Loaders
('CAT Wheel Loader', '966L', 'Equipment', 'Jharkhand', 16500000, 18.0, 180000, 1.2, '{"flywheel_power": "290 HP", "operating_weight": "23000 kg", "bucket_capacity": "3.8 m³", "transmission": "Powershift"}'),
('CAT Wheel Loader', '966L', 'Equipment', 'Odisha', 16500000, 18.0, 210000, 2.5, '{"flywheel_power": "290 HP", "operating_weight": "23000 kg", "bucket_capacity": "3.8 m³", "transmission": "Powershift"}'),
('CAT Wheel Loader', '966L', 'Equipment', 'Chhattisgarh', 16500000, 18.0, 170000, 1.0, '{"flywheel_power": "290 HP", "operating_weight": "23000 kg", "bucket_capacity": "3.8 m³", "transmission": "Powershift"}'),

-- Auxiliary Power
('Cummins Silent Power DG Set', '500kVA', 'Auxiliary', 'Jharkhand', 4500000, 18.0, 85000, 0.5, '{"power_rating": "500 kVA / 400 kWe", "engine": "KTA19-G9", "fuel_tank": "850 Liters", "dimensions": "5200x2000x2200 mm"}'),
('Cummins Silent Power DG Set', '500kVA', 'Auxiliary', 'Odisha', 4500000, 18.0, 92000, 1.0, '{"power_rating": "500 kVA / 400 kWe", "engine": "KTA19-G9", "fuel_tank": "850 Liters", "dimensions": "5200x2000x2200 mm"}'),
('Cummins Silent Power DG Set', '500kVA', 'Auxiliary', 'West Bengal', 4500000, 18.0, 78000, 0.8, '{"power_rating": "500 kVA / 400 kWe", "engine": "KTA19-G9", "fuel_tank": "850 Liters", "dimensions": "5200x2000x2200 mm"}')
ON CONFLICT (item_name, model_number, state) 
DO UPDATE SET 
    base_price = EXCLUDED.base_price,
    gst_percent = EXCLUDED.gst_percent,
    freight_cost = EXCLUDED.freight_cost,
    state_cess = EXCLUDED.state_cess,
    specifications = EXCLUDED.specifications,
    updated_at = now();

COMMENT ON TABLE public.equipment_prices IS 'Sovereign pricing indices for equipments and machineries across Indian operational states.';
