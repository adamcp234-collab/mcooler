import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fonnteToken = Deno.env.get("FONNTE_TOKEN")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Query reminders that are due and not yet sent
    const { data: reminders, error } = await supabase
      .from("service_reminders")
      .select("*, ms_mitra_det:mitra_id(company_name)")
      .eq("is_sent", false)
      .lte("reminder_date", today)
      .limit(50);

    if (error) {
      console.error("Query error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!reminders || reminders.length === 0) {
      console.log("No reminders due today");
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${reminders.length} reminders to send`);

    let sentCount = 0;
    const errors: string[] = [];

    for (const reminder of reminders) {
      // Random delay between 0-120 minutes (spread across 05:00-07:00 window)
      // Since cron runs at 05:00, we add random delay per message
      const delayMs = Math.floor(Math.random() * 5000); // small delay between messages
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));

      const companyName = (reminder.ms_mitra_det as any)?.company_name || "Kami";

      const message = `Halo ${reminder.cust_name}! 👋

Ini pengingat dari *${companyName}* bahwa sudah waktunya untuk service AC rutin Anda.

Layanan terakhir: ${reminder.service_summary}

Silakan hubungi kami untuk menjadwalkan service berikutnya https://accare.pages.dev/. Terima kasih! 🙏`;

      const custWa = reminder.cust_whatsapp.replace(/^0/, "62");

      try {
        const fonnteRes = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            Authorization: fonnteToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target: custWa,
            message: message,
          }),
        });

        const result = await fonnteRes.text();
        console.log(`Sent to ${custWa}:`, result);

        // Mark as sent
        const { error: updateErr } = await supabase
          .from("service_reminders")
          .update({ is_sent: true, sent_at: new Date().toISOString() })
          .eq("id", reminder.id);

        if (updateErr) {
          console.error(`Update error for ${reminder.id}:`, updateErr);
          errors.push(`Update failed: ${reminder.id}`);
        } else {
          sentCount++;
        }
      } catch (sendErr) {
        console.error(`Send error for ${reminder.id}:`, sendErr);
        errors.push(`Send failed: ${reminder.id}`);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent: sentCount, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
