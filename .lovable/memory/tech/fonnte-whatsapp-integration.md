---
name: Fonnte WhatsApp Integration
description: Automated WA notifications via Fonnte API - vendor new order alerts and customer service reminders
type: feature
---
- **Fonnte Token**: stored as secret `FONNTE_TOKEN`
- **Edge Function `notify-vendor-new-order`**: triggered by DB trigger on `ec_order_head` INSERT via `pg_net`. Sends vendor WA with distance, maps link, schedule, services. No customer PII.
- **Edge Function `send-service-reminders`**: sends due reminders to customers. Called by pg_cron daily at 22:00 UTC (05:00 WIB).
- **Cron Job**: `send-daily-service-reminders` runs at `0 22 * * *` (05:00 WIB)
- **DB Trigger**: `on_new_order_notify_vendor` on `ec_order_head` AFTER INSERT
- **Trigger Function**: `notify_vendor_new_order()` reads Supabase URL/key from vault
