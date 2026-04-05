import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
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
  refreshRoles: () => Promise<void>;
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
  refreshRoles: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [mitraId, setMitraId] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);

  const checkRoles = useCallback(async (userId: string) => {
    const [adminRes, vendorRes] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "vendor" }),
    ]);
    setIsAdmin(adminRes.data === true);
    setIsVendor(vendorRes.data === true);

    // Always check for mitra record (vendor may have just been created)
    const { data: mitra } = await supabase
      .from("ms_mitra_det")
      .select("mitra_id, registration_status")
      .eq("mitra_id", userId)
      .maybeSingle();
    setMitraId(mitra?.mitra_id || null);
    setRegistrationStatus(mitra?.registration_status || null);
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user) {
      await checkRoles(user.id);
    }
  }, [user, checkRoles]);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        // Set loading true immediately to prevent premature redirects
        // while checkRoles is still running
        if (session?.user) {
          setLoading(true);
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
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
  }, [checkRoles]);

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
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isVendor, mitraId, registrationStatus, signOut, refreshRoles }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
