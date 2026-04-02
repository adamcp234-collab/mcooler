
-- Allow authenticated users to insert their own vendor role
CREATE POLICY "Users can insert own role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to create their own mitra record (self-registration)
CREATE POLICY "Users can create own mitra"
ON public.ms_mitra_det FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = mitra_id);

-- Allow authenticated users to insert their own vendor photos
CREATE POLICY "Users can insert own vendor photos"
ON public.vendor_photos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = mitra_id);
