## Notifikasi WhatsApp Otomatis via Fonnte

### Ringkasan

Membuat 2 edge function + 1 cron job untuk:

1. **Notifikasi vendor saat order baru** — dipicu otomatis via database webhook
2. **Reminder service rutin ke customer** — dikirim otomatis di hari jatuh tempo remiander pada  jam 05:00-07:00 random, contoh. remainder aktif di tanggal 16/05/2026 maka di tanggal tersebut notifikasi whatsapp ke customer dijalankan

### Arsitektur

```text
[Order Baru] → DB Trigger → pg_net → Edge Function "notify-vendor-new-order" → Fonnte API → WhatsApp Vendor

[Cron 05:00 WIB] → pg_cron → pg_net → Edge Function "send-service-reminders" → Fonnte API → WhatsApp Customer
```

### Langkah Implementasi

**1. Simpan Fonnte Token sebagai Secret**

- Menggunakan tool `add_secret` untuk menyimpan `FONNTE_TOKEN` di backend

**2. Edge Function: `notify-vendor-new-order**`

- Menerima payload order baru dari database webhook
- Query `ms_mitra_det` untuk mendapatkan nomor WA vendor dan koordinat vendor
- Hitung jarak (haversine) antara lokasi customer dan vendor
- Generate link Google Maps dari koordinat customer
- Kirim pesan WA ke vendor via Fonnte API (`https://api.fonnte.com/send`) berisi:
  - Jarak (km)
  - Link Google Maps
  - Tanggal & jam kunjungan
  - Layanan yang dipilih
  - Link dashboard: `https://accare.pages.dev/vendor`
  - Pesan: "Silahkan kelola pesanan melalui dashboard Anda"
  - **TANPA** nama, WA, email, alamat customer (sesuai aturan anti-direct selling)

**3. Database Trigger: Auto-notify on new order**

- Menggunakan `pg_net` untuk memanggil edge function saat INSERT ke `ec_order_head`
- Trigger akan mengirim `order_id` dan data non-PII ke edge function

**4. Edge Function: `send-service-reminders**`

- Query `service_reminders` where `is_sent = false` AND `reminder_date <= today`
- Untuk setiap reminder yang jatuh tempo, kirim pesan WA ke customer via Fonnte
- Update `is_sent = true` dan `sent_at = now()` setelah berhasil kirim

**5. Cron Job: Daily reminder at 05:00 WIB (UTC+7 = 22:00 UTC)**

- Menggunakan `pg_cron` + `pg_net` untuk memanggil edge function `send-service-reminders` setiap hari jam 22:00 UTC (= 05:00 WIB)

### Format Pesan WhatsApp

**Vendor (Order Baru):**

```
🔔 *Pesanan Baru!*

📍 Jarak: 3.2 km
🗺️ Lokasi: https://maps.google.com/?q=-6.xxx,106.xxx
📅 Tanggal: 15 April 2026
⏰ Jam: 09:00
🔧 Layanan: Cuci AC, Isi Freon

Silahkan kelola pesanan melalui dashboard Anda:
https://accare.pages.dev/vendor

Jawab "siap" untuk konfirmasi.
```

**Customer (Reminder):**

```
Halo [Nama]! 👋

Ini pengingat bahwa sudah waktunya untuk service AC rutin Anda.

Layanan terakhir: [service_summary]

Silakan hubungi kami untuk menjadwalkan service berikutnya https://accare.pages.dev/. Terima kasih! 🙏
```

### Kebutuhan dari Anda

- Token Fonnte (akan diminta saat implementasi)
- Pastikan extension `pg_net` dan `pg_cron` aktif (akan diaktifkan via migration)