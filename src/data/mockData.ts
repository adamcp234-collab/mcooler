import { DEFAULT_SERVICES, type OrderStatus } from "./services";

export interface Mitra {
  id: string;
  slug: string;
  companyName: string;
  whatsappNumber: string;
  email: string;
  addressFull: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  operationalHours: Record<string, { open: string; close: string; isOpen: boolean }>;
  services: MitraService[];
}

export interface MitraService {
  serviceId: string;
  serviceName: string;
  price: number;
  isActive: boolean;
  description: string;
}

export interface Order {
  orderId: string;
  mitraId: string;
  custName: string;
  custWhatsapp: string;
  custEmail?: string;
  custLatitude: number;
  custLongitude: number;
  custAddressDetail: string;
  bookingDate: string;
  bookingTime: string;
  notes: string;
  selectedServices: { serviceId: string; serviceName: string; price: number }[];
  status: OrderStatus;
  createdAt: string;
  completionNotes?: string;
  statusLog: StatusLog[];
}

export interface StatusLog {
  id: string;
  oldStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedBy: string;
  notes: string;
  createdAt: string;
}

const defaultDays = () => ({
  senin: { open: "08:00", close: "17:00", isOpen: true },
  selasa: { open: "08:00", close: "17:00", isOpen: true },
  rabu: { open: "08:00", close: "17:00", isOpen: true },
  kamis: { open: "08:00", close: "17:00", isOpen: true },
  jumat: { open: "08:00", close: "17:00", isOpen: true },
  sabtu: { open: "08:00", close: "14:00", isOpen: true },
  minggu: { open: "08:00", close: "14:00", isOpen: false },
});

export const MOCK_MITRAS: Mitra[] = [
  {
    id: "mitra-1",
    slug: "ac-jaya-teknik",
    companyName: "AC Jaya Teknik",
    whatsappNumber: "628123456789",
    email: "jayateknik@email.com",
    addressFull: "Jl. Sudirman No. 10, Jakarta Pusat",
    latitude: -6.2088,
    longitude: 106.8456,
    isActive: true,
    operationalHours: defaultDays(),
    services: DEFAULT_SERVICES.map((s) => ({
      serviceId: s.id,
      serviceName: s.name,
      price: s.defaultPrice,
      isActive: true,
      description: s.description,
    })),
  },
  {
    id: "mitra-2",
    slug: "cool-master",
    companyName: "Cool Master AC",
    whatsappNumber: "628987654321",
    email: "coolmaster@email.com",
    addressFull: "Jl. Thamrin No. 20, Jakarta Pusat",
    latitude: -6.1951,
    longitude: 106.8231,
    isActive: true,
    operationalHours: defaultDays(),
    services: DEFAULT_SERVICES.map((s) => ({
      serviceId: s.id,
      serviceName: s.name,
      price: s.defaultPrice + Math.floor(Math.random() * 20000),
      isActive: Math.random() > 0.2,
      description: s.description,
    })),
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    orderId: "ORD-20260401-001",
    mitraId: "mitra-1",
    custName: "Budi Santoso",
    custWhatsapp: "628111222333",
    custLatitude: -6.21,
    custLongitude: 106.85,
    custAddressDetail: "Jl. Kebon Kacang No. 5, RT 03/RW 02",
    bookingDate: "2026-04-05",
    bookingTime: "10:00",
    notes: "AC di kamar tidur lantai 2",
    selectedServices: [
      { serviceId: "cuci-ac-05-2pk", serviceName: "Cuci AC 0.5 - 2 PK", price: 80000 },
    ],
    status: "pending",
    createdAt: "2026-04-01T08:30:00Z",
    statusLog: [
      { id: "log-1", oldStatus: null, newStatus: "pending", changedBy: "system", notes: "Order dibuat", createdAt: "2026-04-01T08:30:00Z" },
    ],
  },
  {
    orderId: "ORD-20260401-002",
    mitraId: "mitra-1",
    custName: "Siti Aminah",
    custWhatsapp: "628444555666",
    custLatitude: -6.20,
    custLongitude: 106.84,
    custAddressDetail: "Apartemen Green Park Tower A Lt. 12",
    bookingDate: "2026-04-06",
    bookingTime: "14:00",
    notes: "2 unit AC, tolong bawa tangga",
    selectedServices: [
      { serviceId: "cuci-ac-05-2pk", serviceName: "Cuci AC 0.5 - 2 PK", price: 80000 },
      { serviceId: "freon-r22-tambah-05-1pk", serviceName: "Tambah Freon R22 0.5 - 1 PK", price: 100000 },
      { serviceId: "biaya-apartemen", serviceName: "Biaya Apartemen", price: 50000 },
    ],
    status: "confirmed",
    createdAt: "2026-04-01T10:15:00Z",
    statusLog: [
      { id: "log-2", oldStatus: null, newStatus: "pending", changedBy: "system", notes: "Order dibuat", createdAt: "2026-04-01T10:15:00Z" },
      { id: "log-3", oldStatus: "pending", newStatus: "confirmed", changedBy: "mitra-1", notes: "Dikonfirmasi oleh teknisi", createdAt: "2026-04-01T11:00:00Z" },
    ],
  },
];

export function findNearestMitra(lat: number, lng: number): Mitra | null {
  const activeMitras = MOCK_MITRAS.filter((m) => m.isActive);
  if (activeMitras.length === 0) return null;

  let nearest = activeMitras[0];
  let minDist = getDistance(lat, lng, nearest.latitude, nearest.longitude);

  for (const mitra of activeMitras.slice(1)) {
    const dist = getDistance(lat, lng, mitra.latitude, mitra.longitude);
    if (dist < minDist) {
      minDist = dist;
      nearest = mitra;
    }
  }
  return nearest;
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
