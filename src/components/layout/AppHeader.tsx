"use client";
import Link from "next/link";
import { useEffect, useRef, useMemo, useState } from "react";
import {
  Menu,
  Search,
  Plus,
  Share2,
  ListChecks,
  Clock,
  Bell,
  LogOut,
  UserRound,
  Pencil,
  Settings,
  Palette,
  ShieldCheck,
  CircleHelp,
  Mail,
  MailOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

export default function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationProfiles, setNotificationProfiles] = useState<
  Record<string, any>
>({});
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  const loadNotifications = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(30);
      console.log("NOTIFICATION USER:", authUser.id);
      console.log("NOTIFICATION DATA:", data);
      console.log("NOTIFICATION ERROR:", error);
    if (error) {
      console.error("Error loading notifications:", error);
      return;
    }

    const items = data ?? [];
    const senderIds = [
  ...new Set(
    items
      .map((item) => item.sender_id)
      .filter(Boolean)
  ),
] as string[];

if (senderIds.length > 0) {
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role")
    .in("id", senderIds);

  if (profilesError) {
    console.error("Error loading notification profiles:", profilesError);
  } else {
    const profileMap = (profilesData ?? []).reduce(
      (acc: Record<string, any>, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      },
      {}
    );

    setNotificationProfiles(profileMap);
  }
}

    setNotifications(items);
    setUnreadCount(items.filter((item) => !item.is_read).length);
  };

  loadNotifications();
}, [supabase]);

useEffect(() => {
  let channel: ReturnType<typeof supabase.channel> | null = null;

  const subscribeToNotifications = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return;

    channel = supabase
      .channel(`notifications-${authUser.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${authUser.id}`,
        },
        (payload) => {
          const newNotification = payload.new as any;
          if (newNotification.sender_id) {
          supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url, role")
            .eq("id", newNotification.sender_id)
            .maybeSingle()
            .then(({ data: senderProfile, error: senderProfileError }) => {
              if (senderProfileError) {
                console.error(
                  "Error loading realtime notification profile:",
                  senderProfileError
                );
                return;
              }

              if (senderProfile) {
                setNotificationProfiles((prev) => ({
                  ...prev,
                  [senderProfile.id]: senderProfile,
                }));
              }
            });
        }

          setNotifications((prev) => [
            newNotification,
            ...prev.filter((item) => item.id !== newNotification.id),
          ]);

          if (!newNotification.is_read) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
  "postgres_changes",
  {
    event: "UPDATE",
    schema: "public",
    table: "notifications",
    filter: `recipient_id=eq.${authUser.id}`,
  },
  (payload) => {
    const updatedNotification = payload.new as any;

    setNotifications((prev) => {
      const existingNotification = prev.find(
        (item) => item.id === updatedNotification.id
      );

      const next = prev.map((item) =>
        item.id === updatedNotification.id
          ? updatedNotification
          : item
      );

      if (
        existingNotification &&
        !existingNotification.is_read &&
        updatedNotification.is_read
      ) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      return next;
    });
  }
)
      .subscribe();
  };

  subscribeToNotifications();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}, [supabase]);

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      profileMenuRef.current &&
      !profileMenuRef.current.contains(event.target as Node)
    ) {
      setProfileOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);

      if (!error) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true }
              : item
          )
        );
      }
    }

    setNotifOpen(false);

    if (notification.ticket_id) {
      window.location.href = `/support?ticket=${notification.ticket_id}`;
    }
  };

  const formatRelativeTime = (dateString: string) => {
  const now = Date.now();
  const created = new Date(dateString).getTime();
  const diffSeconds = Math.floor((now - created) / 1000);

  if (diffSeconds < 60) return "Just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return new Date(dateString).toLocaleDateString();
};

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border-subtle bg-white px-4 py-2.5">
      <button onClick={onMenuClick} className="text-gray-500 lg:hidden"><Menu size={20} /></button>

      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-md">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search..." className="w-full rounded-full border border-border-subtle bg-gray-50 py-2 pl-9 pr-4 text-[13px] outline-none focus:border-brand" />
        </div>
        <div className="relative ml-2">
          <button onClick={() => setQuickOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white hover:bg-brand/90">
            <Plus size={18} />
          </button>
          {quickOpen && (
            <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-border-subtle bg-white py-1 shadow-lg">
              {["New Customer", "New Project", "New Task", "New Invoice"].map((i) => (
                <button key={i} className="block w-full px-3 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-50">{i}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="rounded-md p-2 text-gray-500 hover:bg-gray-50"><Share2 size={17} /></button>
        <button className="rounded-md p-2 text-gray-500 hover:bg-gray-50"><ListChecks size={17} /></button>
        <button className="rounded-md p-2 text-gray-500 hover:bg-gray-50"><Clock size={17} /></button>
        <div className="relative">
          <button onClick={() => setNotifOpen((v) => !v)} className="relative rounded-md p-2 text-gray-500 hover:bg-gray-50">
            <Bell size={17} />
            {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
          </span>)}
          </button>
          {notifOpen && (
          <div className="absolute right-0 z-20 mt-1 w-80 overflow-hidden rounded-xl border border-border-subtle bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                Notifications
              </p>

              <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0? (
                <div className="px-4 py-6 text-center text-xs text-gray-500 dark:text-slate-400">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => {
                const senderProfile =
                  notificationProfiles[notification.sender_id] ?? null;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-slate-800 ${
                      !notification.is_read
                      ? "bg-red-50 dark:bg-red-500/10"
                      : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                      {notification.is_read ? (
                        <MailOpen size={16} className="text-gray-400" />
                      ) : (
                        <Mail size={16} className="text-red-500" />
                      )}
                    </div>
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                    {senderProfile?.avatar_url ? (
                      <img
                        src={senderProfile.avatar_url}
                        alt={senderProfile.full_name || "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-700 dark:text-slate-200">
                        {(senderProfile?.full_name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {senderProfile?.full_name || "User"}
                      </p>

                      {senderProfile?.role === "admin" && (
                        <span className="rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold text-purple-500">
                          ADMIN
                        </span>
                      )}

                      {senderProfile?.role === "support" && (
                        <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-500">
                          SUPPORT
                        </span>
                      )}
                    </div>

                    {notification.message && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-slate-300">
                        {notification.message}
                      </p>
                    )}

                    <p className="mt-1.5 text-[10px] text-gray-400">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </div>
                  </div>
                );
              })
              )}
            </div>
          </div>
        )}
        </div>
        <div ref={profileMenuRef} className="relative">
        <button
          onClick={() => setProfileOpen(true)}
          className="ml-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-dark text-xs font-semibold text-white"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            (user?.name ?? "U")
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
          )}
        </button>

       {profileOpen && (
  <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">

    {/* User Info */}
    <div className="border-b border-gray-100 p-4">
      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-dark text-sm font-semibold text-white">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            (user?.name ?? "U")
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {user?.name || "User"}
          </p>

          <p className="truncate text-xs text-gray-500">
            {user?.email}
          </p>

          {user?.job_title && (
            <p className="mt-1 truncate text-xs text-gray-400">
              {user.job_title}
            </p>
          )}
        </div>

      </div>
    </div>

    {/* Profile Menu */}
    <div className="p-2">
      <Link
        href="/profile"
        onClick={() => setProfileOpen(false)}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <UserRound size={17} />
        My Profile
      </Link>

      <Link
        href="/profile/edit"
        onClick={() => setProfileOpen(false)}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <Pencil size={17} />
        Edit Profile
      </Link>
      <Link
  href="/settings/account"
  onClick={() => setProfileOpen(false)}
  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
>
  <Settings size={16} />
  Account Settings
</Link>

<Link
  href="/settings/notifications"
  onClick={() => setProfileOpen(false)}
  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
>
  <Bell size={16} />
  Notifications
</Link>

<Link
  href="/settings/appearance"
  onClick={() => setProfileOpen(false)}
  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
>
  <Palette size={16} />
  Appearance
</Link>

<Link
  href="/settings/security"
  onClick={() => setProfileOpen(false)}
  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
>
  <ShieldCheck size={16} />
  Security
</Link>

<div className="my-1 border-t border-gray-100" />

<Link
  href="/support"
  onClick={() => setProfileOpen(false)}
  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
>
  <CircleHelp size={16} />
  Help & Support
</Link>
    </div>


    {/* Logout */}
    <div className="border-t border-gray-100 p-2">
      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        <LogOut size={17} />
        Logout
      </button>
    </div>

  </div>
)}
      </div>
      </div>
    </header>
  );
}
