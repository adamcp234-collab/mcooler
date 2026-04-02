export interface Service {
  id: string;
  name: string;
  category: string;
  defaultPrice: number;
  description: string;
}

export const SERVICE_CATEGORIES = [
  "Cuci AC",
  "Tambah Freon",
  "Isi Freon",
  "Bongkar & Pasang",
  "Perbaikan & Perawatan",
  "Lainnya",
] as const;

export const DEFAULT_SERVICES: Service[] = [
  { id: "cuci-ac-05-2pk", name: "Cuci AC 0.5 - 2 PK", category: "Cuci AC", defaultPrice: 80000, description: "Pembersihan AC standar untuk unit 0.5 - 2 PK" },
  { id: "cuci-ac-15-2pk", name: "Cuci AC 1.5 - 2 PK", category: "Cuci AC", defaultPrice: 100000, description: "Pembersihan AC standar untuk unit 1.5 - 2 PK" },
  { id: "cuci-ac-inverter", name: "Cuci AC Inverter 0.5 - 2 PK", category: "Cuci AC", defaultPrice: 120000, description: "Pembersihan AC Inverter" },
  { id: "cuci-besar-overhaul", name: "Cuci Besar (Overhaul)", category: "Cuci AC", defaultPrice: 350000, description: "Pembersihan menyeluruh dengan bongkar unit" },
  { id: "freon-r22-tambah-05-1pk", name: "Tambah Freon R22 0.5 - 1 PK", category: "Tambah Freon", defaultPrice: 100000, description: "Penambahan freon R22 untuk unit kecil" },
  { id: "freon-r22-tambah-15-2pk", name: "Tambah Freon R22 1.5 - 2 PK", category: "Tambah Freon", defaultPrice: 150000, description: "Penambahan freon R22 untuk unit besar" },
  { id: "freon-r32-tambah-05-1pk", name: "Tambah Freon R32/R410 0.5 - 1 PK", category: "Tambah Freon", defaultPrice: 150000, description: "Penambahan freon R32/R410 untuk unit kecil" },
  { id: "freon-r32-tambah-15-2pk", name: "Tambah Freon R32/R410 1.5 - 2 PK", category: "Tambah Freon", defaultPrice: 200000, description: "Penambahan freon R32/R410 untuk unit besar" },
  { id: "freon-r22-isi-05-1pk", name: "Isi Freon R22 0.5 - 1 PK", category: "Isi Freon", defaultPrice: 200000, description: "Isi penuh freon R22 unit kecil" },
  { id: "freon-r22-isi-15-2pk", name: "Isi Freon R22 1.5 - 2 PK", category: "Isi Freon", defaultPrice: 280000, description: "Isi penuh freon R22 unit besar" },
  { id: "freon-r32-isi-05-1pk", name: "Isi Freon R32/R410 0.5 - 1 PK", category: "Isi Freon", defaultPrice: 280000, description: "Isi penuh freon R32/R410 unit kecil" },
  { id: "freon-r32-isi-15-2pk", name: "Isi Freon R32/R410 1.5 - 2 PK", category: "Isi Freon", defaultPrice: 350000, description: "Isi penuh freon R32/R410 unit besar" },
  { id: "bongkar", name: "Bongkar", category: "Bongkar & Pasang", defaultPrice: 200000, description: "Bongkar unit AC" },
  { id: "pasang-05-1pk", name: "Pasang 0.5 - 1 PK", category: "Bongkar & Pasang", defaultPrice: 250000, description: "Pasang unit AC kecil" },
  { id: "pasang-15-2pk", name: "Pasang 1.5 - 2 PK", category: "Bongkar & Pasang", defaultPrice: 350000, description: "Pasang unit AC besar" },
  { id: "bongkar-pasang-05-1pk", name: "Bongkar Pasang 0.5 - 1 PK", category: "Bongkar & Pasang", defaultPrice: 400000, description: "Bongkar dan pasang ulang unit kecil" },
  { id: "bongkar-pasang-15-2pk", name: "Bongkar Pasang 1.5 - 2 PK", category: "Bongkar & Pasang", defaultPrice: 500000, description: "Bongkar dan pasang ulang unit besar" },
  { id: "bobok-tembok", name: "Bobok Tembok /m", category: "Bongkar & Pasang", defaultPrice: 150000, description: "Bobok tembok per meter" },
  { id: "las-sambungan", name: "Las Sambungan Pipa Freon /titik", category: "Perbaikan & Perawatan", defaultPrice: 200000, description: "Las sambungan pipa freon per titik" },
  { id: "las-kebocoran-isi", name: "Las Perbaikan Kebocoran + Isi Freon", category: "Perbaikan & Perawatan", defaultPrice: 500000, description: "Perbaikan kebocoran dan isi freon" },
  { id: "pengecekan-ac", name: "Pengecekan AC", category: "Perbaikan & Perawatan", defaultPrice: 50000, description: "Pengecekan kondisi AC" },
  { id: "kapasitor-05-1pk", name: "Pergantian Kapasitor 0.5–1 PK", category: "Perbaikan & Perawatan", defaultPrice: 180000, description: "Ganti kapasitor unit kecil" },
  { id: "kapasitor-15-2pk", name: "Pergantian Kapasitor 1.5–2 PK", category: "Perbaikan & Perawatan", defaultPrice: 250000, description: "Ganti kapasitor unit besar" },
  { id: "vacuum-flushing", name: "Vacuum & Flushing AC", category: "Lainnya", defaultPrice: 300000, description: "Vacuum dan flushing sistem AC" },
  { id: "flushing-evaporator", name: "Flushing Evaporator", category: "Lainnya", defaultPrice: 250000, description: "Flushing evaporator AC" },
  { id: "vacuum", name: "Vacuum", category: "Lainnya", defaultPrice: 200000, description: "Vacuum sistem AC" },
  { id: "biaya-apartemen", name: "Biaya Apartemen", category: "Lainnya", defaultPrice: 50000, description: "Biaya tambahan untuk servis di apartemen" },
];

export const ORDER_STATUSES = ["pending", "confirmed", "on_progress", "done", "cancelled"] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  on_progress: "Sedang Dikerjakan",
  done: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-info/10 text-info",
  on_progress: "bg-primary/10 text-primary",
  done: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};
