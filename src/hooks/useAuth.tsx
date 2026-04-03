import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  mitraId: string | null;
  registrationStatus: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  isVendor: false,
  mitraId: null,
  registrationStatus: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [mitraId, setMitraId] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);

  const checkRoles = async (userId: string) => {
    const [adminRes, vendorRes] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "vendor" }),
    ]);
    setIsAdmin(adminRes.data === true);
    setIsVendor(vendorRes.data === true);

    if (vendorRes.data === true) {
      const { data: mitra } = await supabase
        .from("ms_mitra_det")
        .select("mitra_id, registration_status")
        .eq("mitra_id", userId)
        .maybeSingle();
      setMitraId(mitra?.mitra_id || null);
      setRegistrationStatus(mitra?.registration_status || null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Non-blocking role check, then set loading false
          checkRoles(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setIsAdmin(false);
          setIsVendor(false);
          setMitraId(null);
          setRegistrationStatus(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRoles(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsVendor(false);
    setMitraId(null);
    setRegistrationStatus(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isVendor, mitraId, registrationStatus, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
