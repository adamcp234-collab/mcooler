import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDate(dateStr: string): string {
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5); // "09:00:00" -> "09:00"
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fonnteToken = Deno.env.get("FONNTE_TOKEN")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get order data
    const { data: order, error: orderErr } = await supabase
      .from("ec_order_head")
      .select("order_id, mitra_id, booking_date, booking_time, selected_services, cust_latitude, cust_longitude")
      .eq("order_id", order_id)
      .single();

    if (orderErr || !order) {
      console.error("Order not found:", orderErr);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order.mitra_id) {
      console.log("No mitra_id, skipping notification");
      return new Response(JSON.stringify({ ok: true, skipped: "no mitra_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get vendor data
    const { data: mitra, error: mitraErr } = await supabase
      .from("ms_mitra_det")
      .select("whatsapp_number, latitude, longitude, company_name")
      .eq("mitra_id", order.mitra_id)
      .single();

    if (mitraErr || !mitra) {
      console.error("Mitra not found:", mitraErr);
      return new Response(JSON.stringify({ error: "Mitra not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate distance
    let distanceText = "Tidak diketahui";
    let mapsLink = "";
    if (order.cust_latitude && order.cust_longitude) {
      mapsLink = `https://maps.google.com/?q=${order.cust_latitude},${order.cust_longitude}`;
      if (mitra.latitude && mitra.longitude) {
        const dist = haversineDistance(
          mitra.latitude, mitra.longitude,
          order.cust_latitude, order.cust_longitude
        );
        distanceText = `${dist.toFixed(1)} km`;
      }
    }

    // Parse services
    let services: string[] = [];
    try {
      const svcData = order.selected_services;
      if (Array.isArray(svcData)) {
        services = svcData.map((s: any) => s.service_name || s.name || String(s));
      }
    } catch { services = []; }
    const serviceList = services.length > 0 ? services.join(", ") : "Lihat di dashboard";

    // Build message (NO customer PII)
    const message = `🔔 *Pesanan Baru!*

📍 Jarak: ${distanceText}
🗺️ Lokasi: ${mapsLink || "Tidak tersedia"}
📅 Tanggal: ${formatDate(order.booking_date)}
⏰ Jam: ${formatTime(order.booking_time)}
🔧 Layanan: ${serviceList}

Silahkan kelola pesanan melalui dashboard Anda:
https://accare.pages.dev/vendor

Jawab "siap" untuk konfirmasi.`;

    // Send via Fonnte
    const vendorWa = mitra.whatsapp_number.replace(/^0/, "62");
    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: fonnteToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: vendorWa,
        message: message,
      }),
    });

    const fonnteResult = await fonnteRes.text();
    console.log("Fonnte response:", fonnteResult);

    return new Response(JSON.stringify({ ok: true, fonnte: fonnteResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
