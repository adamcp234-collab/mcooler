import { Link } from "react-router-dom";
import { Snowflake, ArrowRight, ShieldCheck, Clock, MapPin, Wrench, CalendarCheck, CheckCircle, Star, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-technician.jpg";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Snowflake className="w-6 h-6 text-primary" />
            <span className="font-extrabold text-lg text-foreground tracking-tight">MCOOLER</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/vendor/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-sm">Masuk</Button>
            </Link>
            <Link to="/booking">
              <Button size="sm" className="font-semibold">Booking Sekarang</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with background image */}
      <section className="relative min-h-[520px] md:min-h-[580px] flex items-center overflow-hidden">
        <img
          src={heroImage}
          alt="Teknisi AC profesional sedang memperbaiki unit AC"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/75 to-primary/40" />
        <div className="relative z-10 container max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <Star className="w-4 h-4 text-primary-foreground" />
              <span className="text-primary-foreground/90 text-sm font-medium">Platform Booking Servis AC #1</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground leading-tight mb-4">
              Servis AC Mudah,<br />Cepat & Terpercaya
            </h1>
            <p className="text-primary-foreground/80 text-base md:text-lg leading-relaxed mb-8 max-w-md">
              Hubungkan dengan teknisi AC profesional. Booking online, pilih lokasi, dan dapatkan layanan terbaik.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/booking">
                <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold text-base px-8 py-6 rounded-xl shadow-lg">
                  Booking Servis AC Sekarang <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/vendor/auth">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-base px-6 py-6 rounded-xl">
                  Daftar Sebagai Vendor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-card">
        <div className="container max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">Kenapa Memilih MCOOLER?</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
            Platform all-in-one untuk vendor dan pelanggan servis AC.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Wrench, title: "Layanan AC Lengkap", desc: "Cuci AC, isi freon, bongkar pasang, dan perawatan rutin dari teknisi berpengalaman." },
              { icon: MapPin, title: "Pilih Lokasi di Peta", desc: "Tentukan lokasi Anda langsung di peta untuk layanan kunjungan yang akurat." },
              { icon: CalendarCheck, title: "Booking Online Mudah", desc: "Pilih tanggal, waktu, dan layanan yang diinginkan dalam hitungan menit." },
              { icon: ShieldCheck, title: "Vendor Terpercaya", desc: "Semua vendor terverifikasi dengan profil lengkap dan ulasan pelanggan." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-background rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">Cara Booking Servis AC</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            4 langkah mudah untuk mendapatkan layanan AC terbaik.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Kunjungi Halaman Vendor", desc: "Buka link unik vendor atau temukan vendor terdekat." },
              { step: "02", title: "Pilih Layanan", desc: "Pilih layanan AC yang Anda butuhkan dari daftar yang tersedia." },
              { step: "03", title: "Atur Jadwal", desc: "Tentukan tanggal, waktu, dan lokasi kunjungan di peta." },
              { step: "04", title: "Konfirmasi Booking", desc: "Kirim pesanan dan vendor akan segera menghubungi Anda." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="text-4xl font-extrabold text-primary/20 mb-3">{step}</div>
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="mcooler-hero-gradient">
        <div className="container max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">Siap Bergabung Sebagai Vendor?</h2>
          <p className="text-primary-foreground/80 text-base leading-relaxed max-w-md mx-auto mb-8">
            Daftarkan bisnis servis AC Anda dan mulai terima pesanan online hari ini.
          </p>
          <Link to="/vendor/auth">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold text-base px-8 py-6 rounded-xl shadow-lg">
              Mulai Sekarang <ArrowRight className="w-5 h-5 ml-2" /> <span className="ml-1 opacity-70 font-normal">Gratis</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Snowflake className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">MCOOLER</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 MCOOLER. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
