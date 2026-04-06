import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// ============================================
// MITRA QUERIES
// ============================================

export async function fetchActiveMitras() {
  const { data, error } = await supabase
    .from("ms_mitra_det")
    .select("*")
    .eq("is_active", true)
    .order("company_name");
  if (error) throw error;
  return data;
}

export async function fetchMitraBySlug(slug: string) {
  const { data, error } = await supabase
    .from("ms_mitra_det")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ============================================
// SERVICES QUERIES
// ============================================

export async function fetchMitraServices(mitraId: string) {
  const { data, error } = await supabase
    .from("ms_service_det")
    .select("*, master_services(service_name)")
    .eq("mitra_id", mitraId)
    .eq("is_active", true);
  if (error) throw error;
  return (data || []).map((d: any) => ({
    id: d.id,
    service_name: d.master_services?.service_name ?? "",
    price: d.price ?? 0,
    is_active: d.is_active,
    description: d.description || "",
    mitra_id: d.mitra_id,
    master_service_id: d.master_service_id,
  }));
}

export async function fetchAllActiveServices() {
  const { data, error } = await supabase
    .from("ms_service_det")
    .select("*, master_services(service_name)")
    .eq("is_active", true);
  if (error) throw error;
  return (data || []).map((d: any) => ({
    id: d.id,
    service_name: d.master_services?.service_name ?? "",
    price: d.price ?? 0,
    is_active: d.is_active,
    description: d.description || "",
    mitra_id: d.mitra_id,
    master_service_id: d.master_service_id,
  }));
}

// ============================================
// ORDER MUTATIONS
// ============================================

export async function createOrder(params: {
  mitraId: string;
  custName: string;
  custWhatsapp: string;
  custEmail?: string;
  custLatitude?: number;
  custLongitude?: number;
  custAddressDetail?: string;
  bookingDate: Date;
  bookingTime: string;
  notes?: string;
  selectedServices: { serviceId: string; serviceName: string; price: number }[];
}) {
  const orderId = `ORD-${format(new Date(), "yyyyMMdd")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const { data, error } = await supabase
    .from("ec_order_head")
    .insert({
      order_id: orderId,
      mitra_id: params.mitraId,
      cust_name: params.custName,
      cust_whatsapp: params.custWhatsapp,
      cust_email: params.custEmail || null,
      cust_latitude: params.custLatitude || null,
      cust_longitude: params.custLongitude || null,
      cust_address_detail: params.custAddressDetail || null,
      booking_date: format(params.bookingDate, "yyyy-MM-dd"),
      booking_time: params.bookingTime,
      notes: params.notes || null,
      selected_services: params.selectedServices as any,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// ORDER QUERIES
// ============================================

export async function fetchOrderById(orderId: string, orderToken?: string) {
  // If token provided, use secure RPC for guest access
  if (orderToken) {
    const { data, error } = await supabase.rpc("get_order_by_token" as any, {
      _order_id: orderId,
      _token: orderToken,
    });
    if (error) throw error;
    return (data as any)?.[0] || null;
  }
  // For authenticated users (vendors/admins), use direct query
  const { data, error } = await supabase
    .from("ec_order_head")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchOrdersByMitra(mitraId: string) {
  const { data, error } = await supabase
    .from("ec_order_head")
    .select("*")
    .eq("mitra_id", mitraId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId: string, newStatus: string, cancelReason?: string) {
  const updateData: any = { status: newStatus };
  if (newStatus === "cancelled" && cancelReason) {
    updateData.cancel_reason = cancelReason;
  }
  const { data, error } = await supabase
    .from("ec_order_head")
    .update(updateData)
    .eq("order_id", orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// STATUS LOG QUERIES
// ============================================

export async function fetchStatusLogs(orderId: string) {
  const { data, error } = await supabase
    .from("order_status_log")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

// ============================================
// NEAREST MITRA
// ============================================

export function findNearestMitraFromList(
  mitras: { mitra_id: string; latitude: number | null; longitude: number | null }[],
  lat: number,
  lng: number
) {
  const valid = mitras.filter((m) => m.latitude != null && m.longitude != null);
  if (valid.length === 0) return null;

  let nearest = valid[0];
  let minDist = haversine(lat, lng, nearest.latitude!, nearest.longitude!);

  for (const m of valid.slice(1)) {
    const d = haversine(lat, lng, m.latitude!, m.longitude!);
    if (d < minDist) {
      minDist = d;
      nearest = m;
    }
  }
  return nearest;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================
// ORDER RATINGS
// ============================================

export async function submitRating(orderId: string, rating: number, reviewText?: string) {
  const { data, error } = await supabase
    .from("order_ratings")
    .insert({
      order_id: orderId,
      rating,
      review_text: reviewText || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchRating(orderId: string) {
  const { data, error } = await supabase
    .from("order_ratings")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
