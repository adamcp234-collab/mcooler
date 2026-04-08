

## Rencana Kerja Harian Vendor

### Ringkasan
Membuat komponen baru `DailyPlanTab` sebagai tab ke-4 di dashboard vendor. Tab ini menampilkan jadwal kerja harian dengan peta, sorting jarak/waktu, optimasi rute, dan navigasi Google Maps.

### Perubahan yang Dilakukan

**1. Buat komponen baru `src/components/DailyPlanTab.tsx`**

Komponen utama yang berisi:

- **Date Picker** — Filter tanggal menggunakan Popover + Calendar (Shadcn). Default: hari ini.
- **Peta Leaflet** — Menampilkan posisi vendor (marker biru) dan semua lokasi order (marker warna sesuai status). Polyline rute antar titik.
- **List Order** — Card list berisi: nama customer, alamat, jam kunjungan, status (badge warna), jarak dari vendor. Highlight order aktif (on_progress).
- **Sorting** — Dropdown/toggle: Jam kunjungan (default), Jarak terdekat, Jarak terjauh.
- **Tombol "Urutkan Rute Otomatis"** — Menggunakan algoritma Nearest Neighbor untuk menghitung urutan optimal. Menampilkan estimasi jarak total.
- **Tombol "Start Navigation"** — Membuka Google Maps Direction (`https://www.google.com/maps/dir/...`) dengan waypoints sesuai urutan rute.
- **Tombol "Lihat di Maps"** — Per-order, buka Google Maps ke koordinat tersebut.
- **Empty state** — Pesan jika tidak ada order di tanggal terpilih.
- **GPS** — Minta izin lokasi browser. Jika ditolak, fallback ke lokasi vendor dari `ms_mitra_det` (latitude/longitude profil).

**2. Update `src/pages/VendorDashboard.tsx`**

- Tambah tab ke-4 "Rencana" di `TabsList` (ubah `grid-cols-3` → `grid-cols-4`).
- Import dan render `DailyPlanTab` di `TabsContent value="daily-plan"`.
- Pass `mitraId` dan data `orders` yang sudah di-fetch (reuse query existing).

**3. Realtime**

Sudah ada realtime subscription untuk `ec_order_head` di VendorDashboard — otomatis invalidate query saat ada order baru, sehingga `DailyPlanTab` akan ter-update.

### Detail Teknis

- **Nearest Neighbor Algorithm**: Mulai dari posisi vendor, pilih order terdekat yang belum dikunjungi, ulangi sampai semua order ter-cover. Hitung total jarak menggunakan fungsi `haversine` yang sudah ada di `api.ts`.
- **Google Maps Direction URL**: `https://www.google.com/maps/dir/{origin}/{waypoint1}/{waypoint2}/...` — max 10 waypoints.
- **Peta**: Menggunakan `react-leaflet` (sudah terinstall). Polyline untuk menghubungkan titik-titik rute.
- **Data source**: Filter `orders` berdasarkan `booking_date` yang dipilih, exclude status `cancelled`.
- **Responsive**: Map di atas (bisa collapse/toggle), list di bawah. Mobile-first layout.

