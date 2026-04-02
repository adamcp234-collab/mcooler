
-- Enum for vendor registration status
CREATE TYPE public.vendor_reg_status AS ENUM ('pending_verification', 'verified', 'rejected');

-- Add registration_status to ms_mitra_det
ALTER TABLE public.ms_mitra_det
  ADD COLUMN registration_status vendor_reg_status NOT NULL DEFAULT 'pending_verification';

-- Update existing active mitras to verified
UPDATE public.ms_mitra_det SET registration_status = 'verified' WHERE is_active = true;

-- Table for vendor photos (identity, equipment, certificates)
CREATE TABLE public.vendor_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('identity', 'equipment', 'certificate', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vendor_photos ENABLE ROW LEVEL SECURITY;

-- Vendors can manage own photos
CREATE POLICY "Vendors can manage own photos"
ON public.vendor_photos FOR ALL
USING (public.is_vendor_owner(mitra_id))
WITH CHECK (public.is_vendor_owner(mitra_id));

-- Admins full access
CREATE POLICY "Admins full access vendor photos"
ON public.vendor_photos FOR ALL
USING (public.is_admin());

-- Public can view photos
CREATE POLICY "Anyone can view vendor photos"
ON public.vendor_photos FOR SELECT
USING (true);

-- Storage bucket for vendor photos
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-photos', 'vendor-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view vendor photos storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-photos');

CREATE POLICY "Authenticated can upload vendor photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vendor-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own vendor photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vendor-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own vendor photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'vendor-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
