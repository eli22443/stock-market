"use client";

import { createClient } from "@/lib/supabase/client";
import { AuthError, Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Initial check
    async function init() {
      const {
        data: { user: initialUser },
      } = await supabase.auth.getUser();
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      setUser(initialUser);
      setSession(initialSession);
      setLoading(false);
    }

    init();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      // Update state when auth changes
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error; // Let component handle error
    }

    // onAuthStateChange will update state automatically
    router.push("/dashboard");
  };

  const signUp = async (email: string, password: string, name: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      // onAuthStateChange will update state automatically
      router.push("/dashboard");
    } else {
      // Email confirmation required
      throw new Error("Please check your email to confirm your account");
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    // onAuthStateChange will update state automatically
    router.push("/");
  };

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
    signUp,
  };
};
