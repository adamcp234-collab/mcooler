import { Link } from "react-router-dom";
import { Snowflake, ArrowRight, ShieldCheck, Clock, MapPin, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <section className="mcooler-hero-gradient text-primary-foreground flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
          <Snowflake className="w-9 h-9" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">MCOOLER</h1>
        <p className="text-primary-foreground/80 text-base leading-relaxed max-w-sm mx-auto mb-8">
          Servis AC profesional langsung ke rumah Anda. Cepat, terpercaya, dan bergaransi.
        </p>
        <Link to="/booking">
          <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold text-base px-8 py-6 rounded-xl shadow-lg">
            Booking Servis AC Sekarang <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </section>

      {/* Trust Indicators */}
      <section className="bg-card border-y border-border">
        <div className="container max-w-lg px-4 py-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Clock, label: "Respon Cepat", desc: "Dalam 30 menit" },
              { icon: ShieldCheck, label: "Bergaransi", desc: "Garansi servis" },
              { icon: MapPin, label: "Area Luas", desc: "Jangkauan luas" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-background">
        <div className="container max-w-lg px-4 py-10">
          <h2 className="text-xl font-bold text-foreground text-center mb-8">Cara Kerja</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Pilih Layanan", desc: "Pilih jenis servis AC yang Anda butuhkan" },
              { step: "2", title: "Atur Jadwal", desc: "Tentukan tanggal dan waktu yang sesuai" },
              { step: "3", title: "Teknisi Datang", desc: "Teknisi profesional tiba tepat waktu" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-card border-y border-border">
        <div className="container max-w-lg px-4 py-10">
          <h2 className="text-xl font-bold text-foreground text-center mb-6">Kenapa Pilih MCOOLER?</h2>
          <div className="space-y-4">
            {[
              "Teknisi berpengalaman & bersertifikat",
              "Harga transparan, tanpa biaya tersembunyi",
              "Garansi servis untuk ketenangan Anda",
              "Booking mudah via online, kapan saja",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                <p className="text-sm text-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="bg-primary/5">
        <div className="container max-w-lg px-4 py-12 text-center">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Star className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Siap Bergabung Sebagai Vendor?</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto mb-6">
            Daftarkan bisnis servis AC Anda dan mulai terima pesanan online hari ini.
          </p>
          <Link to="/vendor/auth">
            <Button size="lg" className="font-bold text-base px-8 py-6 rounded-xl shadow-lg">
              Mulai Sekarang <ArrowRight className="w-5 h-5 ml-2" /> <span className="ml-1 text-primary-foreground/70 font-normal">Gratis</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container max-w-lg px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">© 2026 MCOOLER. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
