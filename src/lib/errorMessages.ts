/**
 * Translate common Supabase/auth error messages to Indonesian
 */
const errorMap: Record<string, string> = {
  "Invalid login credentials": "Email atau password salah",
  "Email not confirmed": "Email belum diverifikasi. Silakan cek inbox Anda",
  "User already registered": "Email sudah terdaftar",
  "Signup requires a valid password": "Password tidak valid",
  "Password should be at least 6 characters": "Password minimal harus 6 karakter",
  "Password should contain at least one character of each": "Password harus mengandung huruf besar, huruf kecil, dan angka",
  "New password should be different from the old password": "Password baru harus berbeda dari password lama",
  "Unable to validate email address: invalid format": "Format email tidak valid",
  "For security purposes, you can only request this once every 60 seconds": "Demi keamanan, Anda hanya bisa meminta ini sekali setiap 60 detik",
  "Email rate limit exceeded": "Terlalu banyak permintaan email. Coba lagi nanti",
  "Token has expired or is invalid": "Link sudah kedaluwarsa atau tidak valid",
  "Auth session missing!": "Sesi login tidak ditemukan. Silakan login ulang",
  "JWT expired": "Sesi Anda telah berakhir. Silakan login ulang",
  "User not found": "Pengguna tidak ditemukan",
  "Email link is invalid or has expired": "Link email tidak valid atau sudah kedaluwarsa",
  "Password is too short": "Password terlalu pendek",
  "Password is too weak": "Password terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol",
  "Rate limit exceeded": "Terlalu banyak percobaan. Silakan coba lagi nanti",
  "Network request failed": "Koneksi gagal. Periksa jaringan internet Anda",
  "Failed to fetch": "Koneksi gagal. Periksa jaringan internet Anda",
};

export function translateError(message: string): string {
  // Exact match
  if (errorMap[message]) return errorMap[message];

  // Partial match
  const lowerMsg = message.toLowerCase();
  for (const [key, value] of Object.entries(errorMap)) {
    if (lowerMsg.includes(key.toLowerCase())) return value;
  }

  // Fallback: return original
  return message;
}
