"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, Zap, Repeat, FolderKanban, CheckSquare, LifeBuoy,
  Target, HelpCircle, Circle, ChevronDown, ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const salesLinks = [
  { href: "/sales/proposals", label: "Proposals" },
  { href: "/sales/estimates", label: "Estimates" },
  { href: "/sales/invoices", label: "Invoices" },
  { href: "/sales/payments", label: "Payments" },
  { href: "/sales/items", label: "Items" },
];

const utilitiesLinks = [
  { href: "/utilities/media", label: "Media" },
  { href: "/utilities/calendar", label: "Calendar" },
];

export default function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [salesOpen, setSalesOpen] = useState(pathname.startsWith("/sales"));
  const [utilOpen, setUtilOpen] = useState(pathname.startsWith("/utilities"));

  const isActive = (href: string) => pathname === href;
  const isParentActive = (prefix: string) => pathname.startsWith(prefix);

  const linkClass = (active: boolean) =>
    `flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium ${
      active ? "bg-brand/10 text-brand" : "text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-border-subtle bg-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-xl font-extrabold">
            <span className="text-brand">Grid</span>
            <span className="rounded bg-brand px-1 text-white">mine</span>
          </span>
          <button onClick={onClose} className="text-gray-400 lg:hidden"><ChevronLeft size={18} /></button>
        </div>

        <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-md border border-border-subtle px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-dark text-xs font-semibold text-white">
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
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-gray-800">{user?.name ?? "Guest"}</div>
            <div className="truncate text-[11px] text-gray-400">{user?.email}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 scrollbar-none">
          <Link href="/dashboard" className={linkClass(isActive("/dashboard"))}><LayoutDashboard size={16} /> Dashboard</Link>
          <Link href="/customers" className={linkClass(isActive("/customers"))}><Users size={16} /> Customers</Link>

          <button onClick={() => setSalesOpen((v) => !v)} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-[13.5px] font-medium ${isParentActive("/sales") ? "text-brand" : "text-gray-600 hover:bg-gray-50"}`}>
            <span className="flex items-center gap-2.5"><Zap size={16} /> Sales</span>
            <ChevronDown size={14} className={`transition-transform ${salesOpen ? "rotate-180" : ""}`} />
          </button>
          {salesOpen && (
            <div className="ml-6 space-y-0.5 border-l border-border-subtle pl-3">
              {salesLinks.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass(isActive(l.href))}>{l.label}</Link>
              ))}
            </div>
          )}

          <Link href="/subscriptions" className={linkClass(isActive("/subscriptions"))}><Repeat size={16} /> Subscriptions</Link>
          <Link href="/projects" className={linkClass(isActive("/projects"))}><FolderKanban size={16} /> Projects</Link>
          <Link href="/tasks" className={linkClass(isActive("/tasks"))}><CheckSquare size={16} /> Tasks</Link>
          <Link href="/support" className={linkClass(isActive("/support"))}><LifeBuoy size={16} /> Support</Link>
          <Link href="/leads" className={linkClass(isActive("/leads"))}><Target size={16} /> Leads</Link>
          <Link href="/knowledge-base" className={linkClass(isActive("/knowledge-base"))}><HelpCircle size={16} /> Knowledge Base</Link>

          <button onClick={() => setUtilOpen((v) => !v)} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-[13.5px] font-medium ${isParentActive("/utilities") ? "text-brand" : "text-gray-600 hover:bg-gray-50"}`}>
            <span className="flex items-center gap-2.5"><Circle size={16} /> Utilities</span>
            <ChevronDown size={14} className={`transition-transform ${utilOpen ? "rotate-180" : ""}`} />
          </button>
          {utilOpen && (
            <div className="ml-6 space-y-0.5 border-l border-border-subtle pl-3">
              {utilitiesLinks.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass(isActive(l.href))}>{l.label}</Link>
              ))}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
