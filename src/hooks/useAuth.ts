import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export type UserRole = "admin" | "doctor" | "patient";

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          role: (roles?.role as UserRole) || "patient",
          fullName: profile?.full_name || "User",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          role: (roles?.role as UserRole) || "patient",
          fullName: profile?.full_name || "User",
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };

  return { user, loading, signOut };
}
