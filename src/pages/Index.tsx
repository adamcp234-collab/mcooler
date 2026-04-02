import { Link } from "react-router-dom";
import { Snowflake, Wrench, MapPin, Zap, Shield, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { fetchActiveMitras } from "@/lib/api";

export default function Index() {
  const { data: mitras = [] } = useQuery({
    queryKey: ["active-mitras"],
    queryFn: fetchActiveMitras,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="mcooler-hero-gradient text-primary-foreground">
        <div className="container max-w-lg px-4 py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto">
            <Snowflake className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">MCOOLER</h1>
          <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-xs mx-auto">
            Servis AC profesional langsung ke rumah Anda. Pesan sekarang, teknisi datang tepat waktu.
          </p>
          <Link to="/booking">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold mt-2">
              Pesan Sekarang <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container max-w-lg px-4 py-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Zap, label: "Cepat & Mudah", desc: "Pesan dalam 2 menit" },
            { icon: Shield, label: "Teknisi Ahli", desc: "Berpengalaman" },
            { icon: MapPin, label: "Mitra Terdekat", desc: "Otomatis ditemukan" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-card rounded-xl p-4 text-center mcooler-card border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Services */}
      <section className="container max-w-lg px-4 pb-10">
        <h2 className="text-lg font-bold text-foreground mb-4">Layanan Populer</h2>
        <div className="space-y-2">
          {[
            { name: "Cuci AC", price: "Mulai Rp 80.000", icon: "🧊" },
            { name: "Tambah Freon", price: "Mulai Rp 100.000", icon: "❄️" },
            { name: "Pasang AC", price: "Mulai Rp 250.000", icon: "🔧" },
            { name: "Pengecekan AC", price: "Mulai Rp 50.000", icon: "🔍" },
          ].map((s) => (
            <Link key={s.name} to="/booking" className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
              <span className="text-2xl">{s.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.price}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>

      {/* Mitra Partners */}
      {mitras.length > 0 && (
        <section className="container max-w-lg px-4 pb-10">
          <h2 className="text-lg font-bold text-foreground mb-4">Mitra Kami</h2>
          <div className="space-y-2">
            {mitras.map((m) => (
              <Link key={m.mitra_id} to={`/${m.slug}`} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{m.company_name}</p>
                  <p className="text-xs text-muted-foreground">{m.address_full}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container max-w-lg px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">© 2026 MCOOLER. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
