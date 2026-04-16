

## Rebranding MCOOLER → ACcare

Mengganti semua referensi nama brand "MCOOLER" menjadi "ACcare" di seluruh aplikasi.

### File yang perlu diubah

**1. `index.html`** — Title, meta tags (og:title, twitter:title, description, author)

**2. `src/index.css`** — Rename CSS classes:
- `.mcooler-gradient` → `.accare-gradient`
- `.mcooler-hero-gradient` → `.accare-hero-gradient`
- `.mcooler-card` → `.accare-card`
- `.mcooler-elevated` → `.accare-elevated`

**3. `src/components/Header.tsx`** — Brand text & gradient class

**4. `src/pages/Index.tsx`** — Brand text di navbar, hero, footer, dan CTA section + class names

**5. `src/pages/AdminAuth.tsx`** — Teks "administrator MCOOLER" + class names

**6. `src/pages/BookingPage.tsx`** — Class names (`mcooler-gradient`)

**7. `src/pages/VendorOnboarding.tsx`** — Class names

**8. `src/pages/VendorDashboard.tsx`** — Class names

**9. `src/components/DailyPlanTab.tsx`** — Class names

**10. `src/components/RemindersTab.tsx`** — Class names

**11. `src/pages/AdminDashboard.tsx`** — Class names (jika ada)

**12. `src/pages/OrderSuccess.tsx`** — Class names (jika ada)

**13. `src/pages/VendorAuth.tsx`** — Class names (jika ada)

**14. Edge Functions** — Update URL `accare.pages.dev` references (sudah benar)

**15. Memory files** — Update `.lovable/memory/index.md` jika ada referensi MCOOLER

### Pendekatan
Find-and-replace global:
- `MCOOLER` → `ACcare` (brand text)
- `mcooler-` → `accare-` (CSS class prefix)

Semua perubahan bersifat kosmetik/branding, tidak ada perubahan logika atau database.

