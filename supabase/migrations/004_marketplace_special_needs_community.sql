-- Migration: 004_marketplace_special_needs_community.sql
-- Adds Motherpreneur Marketplace, Special Needs Education, and Mother Community Forum

-- 1. MARKETPLACE SHOPS (Vendors/Pharmacies)
CREATE TABLE IF NOT EXISTS public.marketplace_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Addis Ababa',
  category TEXT NOT NULL DEFAULT 'pharmacy_cosmetics',
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  verified BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. MARKETPLACE PRODUCTS
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.marketplace_shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('medications_supplements', 'cosmetics_care', 'baby_essentials', 'maternity_wear')),
  price_etb NUMERIC(10,2) NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  image_emoji TEXT DEFAULT '📦',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. MARKETPLACE ORDERS & COMMISSIONS
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  shop_id UUID NOT NULL REFERENCES public.marketplace_shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  total_price_etb NUMERIC(10,2) NOT NULL,
  commission_amount_etb NUMERIC(10,2) NOT NULL,
  delivery_address TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'confirmed', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. SPECIAL NEEDS MATERNAL EDUCATION
CREATE TABLE IF NOT EXISTS public.special_needs_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_area TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT DEFAULT 'heart',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. COMMUNITY POSTS (Peer Forum)
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('first_trimester', 'second_trimester', 'third_trimester', 'new_moms', 'wellness')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. COMMUNITY COMMENTS
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  mother_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.marketplace_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_needs_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- Shops & Products: Publicly readable by all authenticated users
CREATE POLICY "shops_auth_read" ON public.marketplace_shops FOR SELECT TO authenticated USING (true);
CREATE POLICY "shops_super_admin_all" ON public.marketplace_shops FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "products_auth_read" ON public.marketplace_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_super_admin_all" ON public.marketplace_products FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Orders: Mother reads/creates her own; Super Admin views all for commission reporting
CREATE POLICY "orders_mother_select" ON public.marketplace_orders FOR SELECT TO authenticated USING (mother_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "orders_mother_insert" ON public.marketplace_orders FOR INSERT TO authenticated WITH CHECK (mother_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "orders_super_admin_update" ON public.marketplace_orders FOR UPDATE TO authenticated USING (public.is_super_admin());

-- Special Needs: Readable by all authenticated users; Super Admin can edit
CREATE POLICY "special_needs_auth_read" ON public.special_needs_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "special_needs_super_admin_all" ON public.special_needs_content FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Community: All authenticated users can read, insert posts/comments; authors can delete their own
CREATE POLICY "community_posts_read" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "community_posts_insert" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (mother_id = auth.uid());
CREATE POLICY "community_posts_delete" ON public.community_posts FOR DELETE TO authenticated USING (mother_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "community_comments_read" ON public.community_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "community_comments_insert" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (mother_id = auth.uid());

-- ============================================================================
-- INITIAL SAMPLE SEED FOR NEW MODULES
-- ============================================================================

-- Sample Shops
INSERT INTO public.marketplace_shops (id, name, owner_name, phone, city, category, commission_percent, verified, status)
VALUES
  ('22222222-aaaa-bbbb-cccc-111111111111', 'Addis Maternal Pharmacy & Care', 'Sr. Hanna Worku', '+251911445566', 'Addis Ababa (Bole)', 'pharmacy_cosmetics', 10.00, true, 'active'),
  ('22222222-aaaa-bbbb-cccc-222222222222', 'Enat Organic Baby & Mother Goods', 'W/ro Selamawit Tadesse', '+251922889900', 'Addis Ababa (Kazanchis)', 'baby_essentials', 8.50, true, 'active'),
  ('22222222-aaaa-bbbb-cccc-333333333333', 'Sheba Natural Maternity Cosmetics', 'Dr. Rahel Zewde', '+251933112233', 'Addis Ababa (Sarbet)', 'cosmetics_care', 12.00, true, 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample Products
INSERT INTO public.marketplace_products (id, shop_id, name, description, category, price_etb, in_stock, requires_prescription, image_emoji)
VALUES
  ('33333333-aaaa-bbbb-cccc-111111111111', '22222222-aaaa-bbbb-cccc-111111111111', 'Folic Acid + Iron High-Absorption Tablets (90s)', 'Essential prenatal iron & folate supplements prescribed for daily maternal health and fetal neural development.', 'medications_supplements', 450.00, true, false, '💊'),
  ('33333333-aaaa-bbbb-cccc-111111111111', '22222222-aaaa-bbbb-cccc-111111111111', 'Natural Morning Nausea Relief Lozenges (Ginger & B6)', 'Soothing ginger drops specially formulated for early first trimester nausea and gentle digestion.', 'medications_supplements', 380.00, true, false, '🌿'),
  ('33333333-aaaa-bbbb-cccc-333333333333', '22222222-aaaa-bbbb-cccc-333333333333', 'Organic Shea & Cocoa Belly Butter (250ml)', 'Deep-moisturizing stretch mark prevention cream enriched with vitamin E and cold-pressed botanical oils.', 'cosmetics_care', 720.00, true, false, '🧴'),
  ('33333333-aaaa-bbbb-cccc-333333333333', '22222222-aaaa-bbbb-cccc-333333333333', 'Fragrance-Free Sensitive Maternal Body Wash', 'Hypoallergenic, sulfate-free cleanser designed for sensitive skin during hormonal changes in pregnancy.', 'cosmetics_care', 490.00, true, false, '🧼'),
  ('33333333-aaaa-bbbb-cccc-222222222222', '22222222-aaaa-bbbb-cccc-222222222222', 'Ultra-Soft Organic Cotton Newborn Onesies (Pack of 3)', 'Breathable, 100% Ethiopian organic cotton baby bodysuits with nickel-free snaps.', 'baby_essentials', 850.00, true, false, '👶'),
  ('33333333-aaaa-bbbb-cccc-222222222222', '22222222-aaaa-bbbb-cccc-222222222222', 'Adjustable Ergonomic Pregnancy Support Pillow', 'Full-body contour pillow to relieve lower back tension and support comfortable left-side sleep posture.', 'maternity_wear', 1650.00, true, false, '🛌')
ON CONFLICT (id) DO NOTHING;

-- Sample Special Needs Modules
INSERT INTO public.special_needs_content (id, topic_area, title, summary, body, icon)
VALUES
  ('44444444-aaaa-bbbb-cccc-111111111111', 'Physical & Mobility Support', 'Navigating Pregnancy with Mobility Differences', 'Practical adjustments, ergonomic seating, and accessible antenatal care planning for expectant mothers with physical disabilities.', 'Pregnancy causes natural shifts in center of gravity and joint laxity. For mothers using mobility devices, crutches, or with joint limitations, working closely with your midwife on accessible clinic transfer protocols and customized support pillows makes a tremendous difference. Ensure your delivery facility is briefed in advance regarding bed height adjustments and accessible washrooms.', 'wheelchair'),
  ('44444444-aaaa-bbbb-cccc-222222222222', 'Chronic Health Coordination', 'Managing Hypertension & Blood Sugar During Pregnancy', 'Understanding routine monitoring routines, resting protocols, and collaborative clinician care plans.', 'If you have pre-existing high blood pressure, diabetes, or renal considerations, your prenatal care involves more frequent non-invasive checks. Keep a steady resting blood pressure log, stay well hydrated, and maintain consistent meal intervals. Never alter any dosage without direct review from your healthcare provider.', 'activity'),
  ('44444444-aaaa-bbbb-cccc-333333333333', 'Sensory & Neurodiversity Care', 'Sensory Wellbeing & Overstimulation Relief in Pregnancy', 'Gentle sensory adaptation strategies for mothers with sensory sensitivity, autism, or ADHD.', 'Hormonal surges can heighten sensitivity to smells, bright lights, and loud textures. Creating low-stimulation resting zones at home, using soft dimmable lights, and wearing seamless natural fabrics can significantly enhance daily calm and maternal heart-rate regulation.', 'smile'),
  ('44444444-aaaa-bbbb-cccc-444444444444', 'Infant Special Needs Watch', 'Understanding Early Milestone Support & Newborn Assessments', 'A supportive guide on what neonatal pediatricians observe during newborn screenings and early interventions.', 'Every newborn develops at their own unique pace. Early identification of hearing, vision, or muscle tone differences allows gentle physical therapy and developmental support to start early. Ethiopian tertiary referral hospitals offer specialized infant follow-up clinics.', 'baby')
ON CONFLICT (id) DO NOTHING;

-- Sample Community Posts
INSERT INTO public.community_posts (id, author_name, channel, title, content, likes_count)
VALUES
  ('55555555-aaaa-bbbb-cccc-111111111111', 'Hiwot M.', 'first_trimester', 'How did you handle nausea in weeks 7-10?', 'Hello sisters! I am in week 8 and experiencing strong morning sickness. Small cups of warm ginger tea and dry crackers before getting out of bed have helped me a bit. What helped you?', 14),
  ('55555555-aaaa-bbbb-cccc-222222222222', 'Tigist B.', 'second_trimester', 'Felt the first fluttering kicks today at Week 19!', 'Such an emotional and wonderful milestone today. It felt like tiny butterflies. Wishing every mother here strength and joy on this journey!', 28),
  ('55555555-aaaa-bbbb-cccc-333333333333', 'Genet K.', 'wellness', 'Traditional barley porridge (Genfo) & hydration tips', 'My grandmother made light barley genfo with minimal spice. It really helped my energy levels without upsetting my stomach. Remember to drink plenty of water throughout the day too!', 19)
ON CONFLICT (id) DO NOTHING;
