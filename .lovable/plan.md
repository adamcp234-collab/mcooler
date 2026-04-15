

## Perbaikan Google Login di Cloudflare Pages

### Masalah
Path `/~oauth/initiate` adalah infrastruktur milik Lovable hosting yang tidak tersedia di Cloudflare Pages. Fungsi `lovable.auth.signInWithOAuth("google")` hanya bekerja di domain `.lovable.app`, bukan di self-hosted deployment.

### Solusi
Ganti penggunaan `lovable.auth.signInWithOAuth()` dengan `supabase.auth.signInWithOAuth()` (native Supabase OAuth) di semua file yang menggunakannya. Ini membutuhkan konfigurasi Google OAuth credentials langsung di backend Lovable Cloud.

### Langkah

**1. Konfigurasi Google OAuth di Backend**
- Buat OAuth Client ID di Google Cloud Console (`console.cloud.google.com`)
- Authorized redirect URL: `https://gjzbtucgupgkvfofxdlf.supabase.co/auth/v1/callback`
- Tambahkan Client ID dan Secret ke backend auth settings (Lovable Cloud > Users > Auth Settings > Google)

**2. Update `src/pages/VendorAuth.tsx`**
Ganti `lovable.auth.signInWithOAuth("google")` dengan:
```typescript
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: window.location.origin + "/vendor/auth",
  },
});
```

**3. Update `src/pages/AdminAuth.tsx`**
Sama — ganti ke `supabase.auth.signInWithOAuth()`.

**4. Hapus import `lovable`**
Hapus `import { lovable } from "@/integrations/lovable/index"` dari kedua file karena tidak lagi digunakan.

### Catatan Penting
- Jika Anda tetap ingin app berjalan di **kedua** platform (Lovable hosting + Cloudflare Pages), kita bisa buat kondisional berdasarkan hostname. Tapi lebih simpel pilih salah satu.
- Anda perlu membuat Google OAuth credentials sendiri di Google Cloud Console karena managed credentials Lovable tidak berlaku di luar Lovable hosting.

