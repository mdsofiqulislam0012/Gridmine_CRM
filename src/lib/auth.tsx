"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface User {
  name: string;
  email: string;
  avatar_url: string | null;
  job_title: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;

  login: (
    email: string,
    password: string,
    remember: boolean
  ) => Promise<{ ok: boolean; error?: string }>;

  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>;

  completeInvite: (
  name: string,
  password: string
) => Promise<{ ok: boolean; error?: string }>;

  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

// Temporary only so the current login page does not break.
// We will remove the Demo section next.
export const DEMO_CREDENTIALS = {
  email: "",
  password: "",
};

async function getAppUser(
  supabase: ReturnType<typeof createClient>,
  authUser: SupabaseUser
): Promise<User> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, job_title")
    .eq("id", authUser.id)
    .maybeSingle();

  return {
    name:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split("@")[0] ||
      "User",

    email:
      profile?.email ||
      authUser.email ||
      "",

    avatar_url:
      profile?.avatar_url || null,

    job_title:
      profile?.job_title || "",
  };
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user ? await getAppUser(supabase, user) : null);
      setLoading(false);
    };

    loadUser();

  const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((_event, session) => {
  if (!session?.user) {
    setUser(null);
    setLoading(false);
    return;
  }

  setTimeout(async () => {
    const appUser = await getAppUser(supabase, session.user);
    setUser(appUser);
    setLoading(false);
  }, 0);
});

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login: AuthCtx["login"] = async (
    email,
    password,
    _remember
  ) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    if (data.user) {
  setUser(await getAppUser(supabase, data.user));
  }

    return { ok: true };
  };

  const signup: AuthCtx["signup"] = async (
    name,
    email,
    password
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    });

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    if (data.user && data.session) {
  setUser(await getAppUser(supabase, data.user));
  }

    return {
      ok: true,
      needsConfirmation: !data.session,
    };
  };

  const completeInvite: AuthCtx["completeInvite"] = async (
  name,
  password
) => {
  let {
  data: { session },
  error: sessionError,
} = await supabase.auth.getSession();

if (sessionError) {
  return {
    ok: false,
    error: sessionError.message,
  };
}

/* Restore Supabase invite session from URL hash */
if (!session && typeof window !== "undefined") {
  const hashParams = new URLSearchParams(
    window.location.hash.replace(/^#/, "")
  );

  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (accessToken && refreshToken) {
    const {
      data: sessionData,
      error: setSessionError,
    } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (setSessionError) {
      return {
        ok: false,
        error: setSessionError.message,
      };
    }

    session = sessionData.session;

    if (session && typeof window !== "undefined") {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`
  );
}
  }
}

if (!session) {
  return {
    ok: false,
    error: "Invitation session not found. Please open the invitation link again.",
  };
}

  const { data, error } = await supabase.auth.updateUser({
    password,
    data: {
      full_name: name.trim(),
    },
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  if (data.user) {
    setUser(await getAppUser(supabase, data.user));
  }

  return {
    ok: true,
  };
};

  const refreshUser = async () => {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    setUser(null);
    return;
  }

  const appUser = await getAppUser(supabase, authUser);
  setUser(appUser);
};

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
  const profileChannel = supabase
    .channel("auth-profile-live")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
      },
      async () => {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) return;

        const updatedUser = await getAppUser(supabase, authUser);
        setUser(updatedUser);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(profileChannel);
  };
}, [supabase]);

  return (
    <Ctx.Provider
      value={{
  user,
  loading,
  login,
  signup,
  completeInvite,
  logout,
  refreshUser,
}}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}