"use client";
import { useEffect, useMemo, useState } from "react";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";


export default function CrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  useEffect(() => {
  const loadUserRole = async () => {
    const {
  data: { session },
  } = await supabase.auth.getSession();

  const authUser = session?.user;

  if (!authUser) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error("Route guard role error:", error);
      return;
    }

    setUserRole(data?.role || "user");
  };

  loadUserRole();
}, [supabase]);

  useEffect(() => {
  const applyTheme = (mode: "light" | "dark" | "system") => {
    const isDark =
      mode === "dark" ||
      (mode === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.dataset.theme = mode;
  };

  const loadTheme = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const localTheme =
        (localStorage.getItem("gridmine-theme") as
          | "light"
          | "dark"
          | "system") || "system";

      applyTheme(localTheme);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("appearance_mode")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error loading saved theme:", error);
      return;
    }

    const savedTheme =
      (data?.appearance_mode as "light" | "dark" | "system") || "system";

    localStorage.setItem("gridmine-theme", savedTheme);
    applyTheme(savedTheme);
  };

  loadTheme();
}, [supabase]);

useEffect(() => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleSystemThemeChange = () => {
    const currentTheme =
      (localStorage.getItem("gridmine-theme") as
        | "light"
        | "dark"
        | "system") || "system";

    if (currentTheme === "system") {
      document.documentElement.classList.toggle(
        "dark",
        mediaQuery.matches
      );

      document.documentElement.dataset.theme = "system";
    }
  };

  mediaQuery.addEventListener("change", handleSystemThemeChange);

  return () => {
    mediaQuery.removeEventListener("change", handleSystemThemeChange);
  };
}, []);

useEffect(() => {
  console.log("PRESENCE EFFECT START");
  let cancelled = false;
  let presenceChannel: ReturnType<typeof supabase.channel> | null = null;
  let presenceConnecting = false;

  const connectPresence = async () => {

    if (presenceConnecting || presenceChannel) return;
    presenceConnecting = true;
   const {
  data: { session },
} = await supabase.auth.getSession();

const authUser = session?.user;
if (cancelled) return;

console.log(
  "PRESENCE SESSION USER:",
  authUser?.id ?? null,
  authUser?.email ?? null
);

  if (!authUser) {
    presenceConnecting = false;
    return;
  }

    presenceChannel = supabase
  .channel("crm-online-users", {
    config: {
      presence: {
        key: authUser.id,
      },
    },
  })
  .on("presence", { event: "sync" }, () => {
    const state = presenceChannel?.presenceState() ?? {};
    const onlineIds = Object.keys(state);

    (
      window as Window & {
        __crmOnlineUserIds?: string[];
      }
    ).__crmOnlineUserIds = onlineIds;

    window.dispatchEvent(
      new CustomEvent("crm-presence-sync", {
        detail: onlineIds,
      })
    );
  });

    presenceChannel.subscribe(async (status) => {
  console.log("PRESENCE STATUS:", status, "USER:", authUser.id);

  if (status !== "SUBSCRIBED") return;

  const trackResult = await presenceChannel?.track({
    user_id: authUser.id,
    online_at: new Date().toISOString(),
  });

  console.log("PRESENCE TRACK RESULT:", trackResult);
});
  };

  const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user && !presenceChannel) {
    void connectPresence();
  }
});

  connectPresence();

  return () => {
    cancelled = true;
    subscription.unsubscribe();
    if (presenceChannel) {
      void presenceChannel.untrack();
      void supabase.removeChannel(presenceChannel);
    }
  };
}, [supabase]);


  return (
    <div
      className={`flex ${
        pathname === "/profile" ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main
        className={`min-h-0 flex-1 overflow-x-hidden ${
          pathname === "/profile" ? "overflow-hidden p-0" : "p-4"
        }`}
      >
        {children}
      </main>
      </div>
    </div>
  );
}
