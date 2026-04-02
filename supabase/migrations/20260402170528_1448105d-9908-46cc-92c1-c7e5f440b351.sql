
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'vendor');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'on_progress', 'done', 'cancelled');

-- ============================================
-- HELPER: updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- TABLE: user_roles
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLE: ms_mitra_det
-- ============================================
CREATE TABLE public.ms_mitra_det (
  mitra_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  address_full TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  operational_hours JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ms_mitra_det ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_mitra_det_updated_at
  BEFORE UPDATE ON public.ms_mitra_det
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: ms_services
-- ============================================
CREATE TABLE public.ms_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mitra_id UUID REFERENCES public.ms_mitra_det(mitra_id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ms_services ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLE: ec_order_head
-- ============================================
CREATE TABLE public.ec_order_head (
  order_id TEXT PRIMARY KEY,
  mitra_id UUID REFERENCES public.ms_mitra_det(mitra_id),
  cust_name TEXT NOT NULL,
  cust_whatsapp TEXT NOT NULL,
  cust_email TEXT,
  cust_latitude DOUBLE PRECISION,
  cust_longitude DOUBLE PRECISION,
  cust_address_detail TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  notes TEXT,
  selected_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  completion_notes TEXT
);
ALTER TABLE public.ec_order_head ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLE: order_status_log
-- ============================================
CREATE TABLE public.order_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.ec_order_head(order_id) ON DELETE CASCADE NOT NULL,
  old_status order_status,
  new_status order_status NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.order_status_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLE: order_completion_photo
-- ============================================
CREATE TABLE public.order_completion_photo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.ec_order_head(order_id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.order_completion_photo ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLE: mitra_doc
-- ============================================
CREATE TABLE public.mitra_doc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mitra_id UUID REFERENCES public.ms_mitra_det(mitra_id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.mitra_doc ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLE: order_ratings
-- ============================================
CREATE TABLE public.order_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.ec_order_head(order_id) ON DELETE CASCADE NOT NULL UNIQUE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'vendor')
$$;

CREATE OR REPLACE FUNCTION public.get_mitra_id_for_user()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mitra_id FROM public.ms_mitra_det WHERE mitra_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_vendor_owner(_mitra_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_vendor() AND auth.uid() = _mitra_id
$$;

CREATE OR REPLACE FUNCTION public.get_mitra_id_for_order(_order_id TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mitra_id FROM public.ec_order_head WHERE order_id = _order_id LIMIT 1
$$;

-- ============================================
-- RLS POLICIES: user_roles
-- ============================================
CREATE POLICY "Admins can manage user_roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- ============================================
-- RLS POLICIES: ms_mitra_det
-- ============================================
CREATE POLICY "Public can view active mitra" ON public.ms_mitra_det
  FOR SELECT USING (is_active = true);

CREATE POLICY "Vendors can view own mitra" ON public.ms_mitra_det
  FOR SELECT USING (public.is_vendor_owner(mitra_id));

CREATE POLICY "Admins full access mitra" ON public.ms_mitra_det
  FOR ALL USING (public.is_admin());

CREATE POLICY "Vendors can update own mitra" ON public.ms_mitra_det
  FOR UPDATE USING (public.is_vendor_owner(mitra_id));

CREATE POLICY "Vendors can insert own mitra" ON public.ms_mitra_det
  FOR INSERT WITH CHECK (public.is_vendor_owner(mitra_id));

-- ============================================
-- RLS POLICIES: ms_services
-- ============================================
CREATE POLICY "Public can view active services" ON public.ms_services
  FOR SELECT USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM public.ms_mitra_det WHERE ms_mitra_det.mitra_id = ms_services.mitra_id AND ms_mitra_det.is_active = true)
  );

CREATE POLICY "Vendors can manage own services" ON public.ms_services
  FOR ALL USING (public.is_vendor_owner(mitra_id));

CREATE POLICY "Admins full access services" ON public.ms_services
  FOR ALL USING (public.is_admin());

-- ============================================
-- RLS POLICIES: ec_order_head
-- ============================================
CREATE POLICY "Anyone can create orders" ON public.ec_order_head
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read own order by id" ON public.ec_order_head
  FOR SELECT USING (true);

CREATE POLICY "Vendors can update own orders" ON public.ec_order_head
  FOR UPDATE USING (public.is_vendor_owner(mitra_id));

CREATE POLICY "Admins full access orders" ON public.ec_order_head
  FOR ALL USING (public.is_admin());

-- ============================================
-- RLS POLICIES: order_status_log
-- ============================================
CREATE POLICY "Anyone can read status logs" ON public.order_status_log
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert status logs" ON public.order_status_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins full access status logs" ON public.order_status_log
  FOR ALL USING (public.is_admin());

-- ============================================
-- RLS POLICIES: order_completion_photo
-- ============================================
CREATE POLICY "Anyone can view completion photos" ON public.order_completion_photo
  FOR SELECT USING (true);

CREATE POLICY "Vendors can upload completion photos" ON public.order_completion_photo
  FOR INSERT WITH CHECK (
    public.is_vendor_owner(public.get_mitra_id_for_order(order_id))
  );

CREATE POLICY "Admins full access photos" ON public.order_completion_photo
  FOR ALL USING (public.is_admin());

-- ============================================
-- RLS POLICIES: mitra_doc
-- ============================================
CREATE POLICY "Vendors can manage own docs" ON public.mitra_doc
  FOR ALL USING (public.is_vendor_owner(mitra_id));

CREATE POLICY "Admins full access docs" ON public.mitra_doc
  FOR ALL USING (public.is_admin());

-- ============================================
-- RLS POLICIES: order_ratings
-- ============================================
CREATE POLICY "Anyone can read ratings" ON public.order_ratings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert rating" ON public.order_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins full access ratings" ON public.order_ratings
  FOR ALL USING (public.is_admin());

-- ============================================
-- TRIGGER: Auto-create status log on order status change
-- ============================================
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_log (order_id, old_status, new_status, changed_by, notes)
    VALUES (
      NEW.order_id,
      OLD.status,
      NEW.status,
      COALESCE(auth.uid()::text, 'system'),
      'Status diubah dari ' || OLD.status::text || ' ke ' || NEW.status::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_order_status
  AFTER UPDATE ON public.ec_order_head
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- ============================================
-- TRIGGER: Auto-create initial status log on insert
-- ============================================
CREATE OR REPLACE FUNCTION public.log_order_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.order_status_log (order_id, old_status, new_status, changed_by, notes)
  VALUES (NEW.order_id, NULL, NEW.status, 'system', 'Order dibuat');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_order_created
  AFTER INSERT ON public.ec_order_head
  FOR EACH ROW EXECUTE FUNCTION public.log_order_created();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_ms_services_mitra ON public.ms_services(mitra_id);
CREATE INDEX idx_ec_order_mitra ON public.ec_order_head(mitra_id);
CREATE INDEX idx_ec_order_status ON public.ec_order_head(status);
CREATE INDEX idx_order_status_log_order ON public.order_status_log(order_id);
CREATE INDEX idx_order_ratings_order ON public.order_ratings(order_id);
CREATE INDEX idx_ms_mitra_det_slug ON public.ms_mitra_det(slug);
CREATE INDEX idx_ms_mitra_det_active ON public.ms_mitra_det(is_active);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('order-photos', 'order-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('mitra-docs', 'mitra-docs', false);

CREATE POLICY "Anyone can view order photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-photos');

CREATE POLICY "Authenticated users can upload order photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view mitra docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'mitra-docs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload mitra docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'mitra-docs' AND auth.role() = 'authenticated');
