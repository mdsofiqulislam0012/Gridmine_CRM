"use client";
import Link from "next/link";
import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-white">7</span>
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-20 mt-1 w-64 rounded-md border border-border-subtle bg-white p-3 shadow-lg">
              <p className="text-xs text-gray-500">You have 7 unread notifications.</p>
            </div>
          )}
        </div>
        <div className="relative">
        <button
          onClick={() => setProfileOpen((v) => !v)}
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
