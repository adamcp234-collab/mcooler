import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, isToday, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Bell, Send, CheckCircle, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RemindersTabProps {
  mitraId: string | null;
}

export default function RemindersTab({ mitraId }: RemindersTabProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"upcoming" | "sent" | "all">("upcoming");

  const { data: reminders = [] } = useQuery({
    queryKey: ["service-reminders", mitraId],
    queryFn: async () => {
      if (!mitraId) return [];
      const { data, error } = await supabase
        .from("service_reminders")
        .select("*")
        .eq("mitra_id", mitraId)
        .order("reminder_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!mitraId,
  });

  const markSentMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from("service_reminders")
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq("id", reminderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-reminders"] });
      toast.success("Reminder ditandai sudah terkirim");
    },
  });

  const sendWhatsAppReminder = (reminder: any) => {
    const wa = reminder.cust_whatsapp.replace(/^0/, "62");
    const message = `Halo ${reminder.cust_name}! 👋\n\nIni pengingat dari kami bahwa sudah waktunya untuk service AC rutin Anda.\n\nLayanan terakhir: ${reminder.service_summary}\nTanggal terakhir service: ${reminder.order_id}\n\n${reminder.notes ? `Catatan: ${reminder.notes}\n\n` : ""}Silakan hubungi kami untuk menjadwalkan service berikutnya. Terima kasih! 🙏`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(message)}`, "_blank");
    markSentMutation.mutate(reminder.id);
  };

  const filtered = reminders.filter((r) => {
    if (filter === "upcoming") return !r.is_sent;
    if (filter === "sent") return r.is_sent;
    return true;
  });

  const dueCount = reminders.filter(r => !r.is_sent && (isPast(parseISO(r.reminder_date)) || isToday(parseISO(r.reminder_date)))).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Pengingat service rutin untuk pelanggan</p>
        {dueCount > 0 && (
          <Badge className="bg-warning/10 text-warning text-xs">
            {dueCount} jatuh tempo
          </Badge>
        )}
      </div>

      <div className="flex gap-1.5">
        {([
          { key: "upcoming" as const, label: "Belum Dikirim" },
          { key: "sent" as const, label: "Sudah Dikirim" },
          { key: "all" as const, label: "Semua" },
        ]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8">
          <Bell className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">Belum ada reminder.</p>
          <p className="text-xs text-muted-foreground mt-1">Reminder dibuat otomatis saat menyelesaikan order.</p>
        </div>
      )}

      {filtered.map((reminder) => {
        const reminderDate = parseISO(reminder.reminder_date);
        const isDue = !reminder.is_sent && (isPast(reminderDate) || isToday(reminderDate));
        return (
          <Card key={reminder.id} className={cn("border", isDue ? "border-warning/50 bg-warning/5" : "border-border")}>
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm text-foreground">{reminder.cust_name}</p>
                  <p className="text-xs text-muted-foreground">{reminder.cust_whatsapp}</p>
                </div>
                {reminder.is_sent ? (
                  <Badge className="bg-success/10 text-success text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" /> Terkirim
                  </Badge>
                ) : isDue ? (
                  <Badge className="bg-warning/10 text-warning text-xs">
                    <Clock className="w-3 h-3 mr-1" /> Jatuh Tempo
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground text-xs">
                    <Clock className="w-3 h-3 mr-1" /> Menunggu
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{reminder.service_summary}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Reminder: {format(reminderDate, "d MMM yyyy", { locale: idLocale })} ({reminder.reminder_days} hari)
                </span>
              </div>
              {reminder.notes && <p className="text-xs text-muted-foreground italic">{reminder.notes}</p>}
              {!reminder.is_sent && (
                <Button
                  size="sm"
                  variant={isDue ? "default" : "outline"}
                  className={cn("w-full", isDue && "mcooler-gradient")}
                  onClick={() => sendWhatsAppReminder(reminder)}
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1" /> Kirim via WhatsApp
                </Button>
              )}
              {reminder.is_sent && reminder.sent_at && (
                <p className="text-[10px] text-muted-foreground">
                  Dikirim: {format(new Date(reminder.sent_at), "d MMM yyyy HH:mm", { locale: idLocale })}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
