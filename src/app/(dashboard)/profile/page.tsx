"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Mail,
  Phone,
  Briefcase,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  bio: string;
  avatar_url: string | null;
  role: string;
};
type TeamMember = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  avatar_url: string | null;
  role: "admin" | "sub_admin" | "user";
  last_seen_at: string | null;
};

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    job_title: "",
    bio: "",
    avatar_url: null,
    role: "user",
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeProfileTab, setActiveProfileTab] = useState("team");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const membersPerPage = 8;
  useEffect(() => {
  setCurrentPage(1);
}, [memberSearch, roleFilter]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Unable to load user.");
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, phone, job_title, bio, avatar_url, role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      setProfile({
        full_name: data.full_name ?? "",
        email: data.email ?? user.email ?? "",
        phone: data.phone ?? "",
        job_title: data.job_title ?? "",
        bio: data.bio ?? "",
        role: data.role ?? "user",
        avatar_url: data.avatar_url ?? null,
      });

      const { data: membersData, error: membersError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, job_title, avatar_url, role, last_seen_at"
      )
      .order("full_name", { ascending: true });

    if (membersError) {
      console.error("Team members load error:", membersError);
    } else {
      setTeamMembers((membersData ?? []) as TeamMember[]);
    }

      setLoading(false);
    };

    loadProfile();
  }, [supabase]);

  useEffect(() => {
  const updateLastSeen = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const now = new Date().toISOString();

await supabase
  .from("profiles")
  .update({
    last_seen_at: now,
  })
  .eq("id", user.id);

setTeamMembers((members) =>
  members.map((member) =>
    member.id === user.id
      ? { ...member, last_seen_at: now }
      : member
  )
);
  };

  updateLastSeen();

  const interval = setInterval(updateLastSeen, 60 * 1000);

  return () => clearInterval(interval);
}, [supabase]);

  const totalMembers = teamMembers.length;

  const adminCount = teamMembers.filter(
    (member) => member.role === "admin"
  ).length;

  const subAdminCount = teamMembers.filter(
    (member) => member.role === "sub_admin"
  ).length;

  const employeeCount = teamMembers.filter(
    (member) => member.role === "user"
  ).length;

  const isMemberActive = (lastSeenAt: string | null) => {
  if (!lastSeenAt) return false;

  const lastSeenTime = new Date(lastSeenAt).getTime();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  return lastSeenTime >= fiveMinutesAgo;
};

  const activeMemberCount = teamMembers.filter((member) =>
  isMemberActive(member.last_seen_at)
).length;

const currentMember = teamMembers.find(
  (member) => member.id === currentUserId
);

const canManageTeam =
  currentMember?.role === "admin" ||
  currentMember?.role === "sub_admin";

const filteredTeamMembers = teamMembers.filter((member) => {
  const searchValue = memberSearch.trim().toLowerCase();

  const matchesSearch =
    !searchValue ||
    member.full_name?.toLowerCase().includes(searchValue) ||
    member.email?.toLowerCase().includes(searchValue) ||
    member.phone?.toLowerCase().includes(searchValue) ||
    member.job_title?.toLowerCase().includes(searchValue);

  const matchesRole =
    roleFilter === "all" || member.role === roleFilter;

  return matchesSearch && matchesRole;
});

const totalPages = Math.max(
  1,
  Math.ceil(filteredTeamMembers.length / membersPerPage)
);

const paginatedTeamMembers = filteredTeamMembers.slice(
  (currentPage - 1) * membersPerPage,
  currentPage * membersPerPage
);

const getRoleLabel = (role: string | null) => {
  if (role === "admin") return "Admin";
  if (role === "sub_admin") return "Sub Admin";
  if (role === "user") return "Employee";

  return "Member";
};


const getMemberStatus = (lastSeenAt: string | null) => {
  if (isMemberActive(lastSeenAt)) {
    return "Active now";
  }

  if (!lastSeenAt) {
    return "Offline";
  }

  const lastSeenTime = new Date(lastSeenAt).getTime();
  const diffMinutes = Math.floor(
    (Date.now() - lastSeenTime) / (1000 * 60)
  );

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays}d ago`;
};

const teamStats = [
  {
    label: "Admins",
    value: adminCount,
  },
  {
    label: "Sub Admins",
    value: subAdminCount,
  },
  {
    label: "Employees",
    value: employeeCount,
  },
];

const teamOverviewCard = (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Team Overview
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Members and role distribution
        </p>
      </div>

      <div className="text-right">
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {totalMembers}
        </p>

        <p className="text-xs text-slate-500">
          Total Members
        </p>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-3 gap-3">
      {teamStats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
        >
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {stat.value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {stat.label}
          </p>
        </div>
      ))}
    </div>

    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      <span>{activeMemberCount} active now</span>
    </div>
  </div>
);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
  <div className="profile-page-enter min-h-[calc(100vh-60px)] bg-[rgba(247,248,252,1)] px-5 py-8 md:px-8 md:py-10 profile-theme-page">
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">

      {/* Error */}
      {error && (
        <div className="mx-auto mb-5 max-w-4xl rounded-2xl border border-[rgba(239,68,68,0.16)] bg-[rgba(255,245,245,0.92)] px-4 py-3 text-sm text-red-600 shadow-sm">
          {error}
        </div>
      )}

      <div className="mb-1 flex w-full flex-col gap-3 md:flex-row md:items-end md:justify-between lg:col-span-2">
        <div>
          <h1 className="profile-title-enter text-[22px] font-extrabold tracking-[-0.02em] text-[rgba(28,24,46,0.95)]">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage your profile and view your team members
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Home</span>
          <span>›</span>
          <span className="font-medium text-slate-200">Profile</span>
        </div>
      </div>
        <div className="team-overview-section lg:col-start-2 lg:row-start-2">
          {teamOverviewCard}
        </div>

        {isInviteOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Invite Team Member
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Add a new member to your Gridmine CRM team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInviteOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          ×
        </button>
      </div>
      <div className="mt-6 space-y-4">
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-300">
      Email Address
    </label>

    <input
      type="email"
      value={inviteEmail}
      onChange={(e) => setInviteEmail(e.target.value)}
      placeholder="member@example.com"
      className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
    />
  </div>

  <div>
    <label className="mb-2 block text-sm font-medium text-slate-300">
      Role
    </label>

    <select
      value={inviteRole}
      onChange={(e) => setInviteRole(e.target.value)}
      className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-300 outline-none focus:border-violet-500"
    >
      <option value="user">Employee</option>
      <option value="sub_admin">Sub Admin</option>
      <option value="admin">Admin</option>
    </select>
  </div>

  {inviteError && (
    <p className="text-sm text-red-400">
      {inviteError}
    </p>
  )}
</div>
    </div>
  </div>
)}

      {/* 3D PROFILE CARD */}
      <div className="order-3 mt-1 flex items-center gap-6 border-b border-slate-800 lg:col-span-2 lg:row-start-3">
        <button
        type="button"
        onClick={() => setActiveProfileTab("team")}
        className={`px-1 py-3 text-sm font-medium transition ${
          activeProfileTab === "team"
            ? "border-b-2 border-violet-500 text-violet-400"
            : "text-slate-400 hover:text-white"
        }`}
      >
        Team Members
      </button>

        <button
        type="button"
        onClick={() => setActiveProfileTab("activity")}
        className={`px-1 py-3 text-sm font-medium transition ${
          activeProfileTab === "activity"
            ? "border-b-2 border-violet-500 text-violet-400"
            : "text-slate-400 hover:text-white"
        }`}
      >
        My Activity
      </button>

        <button
          type="button"
          onClick={() => setActiveProfileTab("security")}
          className={`px-1 py-3 text-sm font-medium transition ${
            activeProfileTab === "security"
              ? "border-b-2 border-violet-500 text-violet-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Security
        </button>

        <button
        type="button"
        onClick={() => setActiveProfileTab("notifications")}
        className={`px-1 py-3 text-sm font-medium transition ${
          activeProfileTab === "notifications"
            ? "border-b-2 border-violet-500 text-violet-400"
            : "text-slate-400 hover:text-white"
        }`}
      >
        Notifications
      </button>
      </div>
      {activeProfileTab === "team" && (
      <div className="order-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 lg:col-span-2 lg:row-start-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            All Team Members
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            View all members in your company and their roles
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search team members..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/40 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500 sm:w-64"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-700 bg-slate-950/40 px-3 text-sm text-slate-300 outline-none focus:border-violet-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="sub_admin">Sub Admin</option>
            <option value="user">Employee</option>
          </select>

          {canManageTeam && (
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="h-10 whitespace-nowrap rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            + Invite Member
          </button>
        )}
        </div>
      </div>
      

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-800">
        <div className="grid grid-cols-[40px_1.6fr_1fr_1.6fr_1.2fr_0.8fr_1fr_60px] items-center bg-slate-800/60 px-4 py-3 text-xs font-medium text-slate-400">
          <span>#</span>
          <span>Name</span>
          <span>Role</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Projects</span>
          <span>Status</span>
          <span className="text-center">Action</span>
        </div>

        {paginatedTeamMembers.map((member, index) => {
    const isCurrentUser = member.id === currentUserId;
  const isActive = isMemberActive(member.last_seen_at);

  return (
    <div
      key={member.id}
      className="grid grid-cols-[40px_1.6fr_1fr_1.6fr_1.2fr_0.8fr_1fr_60px] items-center border-t border-slate-800 px-4 py-3 text-sm text-slate-300"
    >
      <span>{index + 1}</span>

      <div className="flex min-w-0 items-center gap-3">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.full_name || "Member"}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            {(member.full_name || member.email || "M")
              .charAt(0)
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-white">
              {member.full_name || "Unnamed Member"}
            </span>

            {isCurrentUser && (
              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-200">
                You
              </span>
            )}
          </div>
        </div>
      </div>

      <span
        className={`w-fit rounded-md px-2 py-1 text-xs font-medium ${
          member.role === "admin"
            ? "bg-violet-500/15 text-violet-400"
            : member.role === "sub_admin"
              ? "bg-blue-500/15 text-blue-400"
              : "bg-emerald-500/15 text-emerald-400"
        }`}
      >
        {getRoleLabel(member.role)}
      </span>

      <span className="truncate">
        {member.email || "—"}
      </span>

      <span>
        {member.phone || "—"}
      </span>

      <span>—</span>

      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            isActive ? "bg-emerald-500" : "bg-slate-500"
          }`}
        />

        <span className={isActive ? "text-emerald-400" : "text-slate-400"}>
          {getMemberStatus(member.last_seen_at)}
        </span>
      </div>

      <span className="text-center text-slate-400">
      {isCurrentUser
        ? "—"
        : canManageTeam
          ? "•••"
          : "—"}
    </span>
    </div>
  );
})}

{paginatedTeamMembers.length === 0 && (
  <div className="border-t border-slate-800 px-4 py-10 text-center">
    <p className="text-sm font-medium text-slate-300">
      No team members found
    </p>

    <p className="mt-1 text-xs text-slate-500">
      Try changing your search or role filter.
    </p>
  </div>
)}

<div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
  <span>
    Showing {filteredTeamMembers.length} of {totalMembers} members
  </span>

  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
      disabled={currentPage === 1}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
    >
      ‹
    </button>

    {Array.from({ length: totalPages }, (_, index) => {
      const pageNumber = index + 1;

      return (
        <button
          key={pageNumber}
          type="button"
          onClick={() => setCurrentPage(pageNumber)}
          className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium ${
            currentPage === pageNumber
              ? "border-violet-500 bg-violet-600 text-white"
              : "border-slate-700 text-slate-300"
          }`}
        >
          {pageNumber}
        </button>
      );
    })}

    <button
      type="button"
      onClick={() =>
        setCurrentPage((page) => Math.min(totalPages, page + 1))
      }
      disabled={currentPage === totalPages}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
    >
      ›
    </button>
  </div>
</div>

  </div>
    </div>
    )}
      <div className="profile-card-enter relative w-full [perspective:1400px] lg:col-start-1 lg:row-start-2">

        {/* Card Depth */}
        <div className="absolute inset-x-8 -bottom-5 h-16 rounded-[40px] bg-[rgba(119,89,210,0.16)] blur-2xl" />

        <div className="absolute inset-0 translate-x-[7px] translate-y-[10px] rounded-[34px] bg-[rgba(177,157,244,0.20)]" />

        {/* Main Card */}
        <div
          className="
            profile-main-card
            relative overflow-hidden rounded-[34px]
            border border-[rgba(255,255,255,0.85)]
            bg-[linear-gradient(145deg,rgba(248,244,255,0.98)_0%,rgba(239,234,255,0.96)_48%,rgba(247,243,255,0.98)_100%)]
            shadow-[0_32px_75px_rgba(94,72,160,0.18),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_8px_rgba(117,85,205,0.07)]
            transition-all duration-500
            hover:shadow-[0_40px_85px_rgba(94,72,160,0.22)]
          "
        >

          {/* Soft internal RGBA light */}
          <div className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-[rgba(255,255,255,0.72)] blur-[70px]" />

          <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[rgba(164,112,255,0.12)] blur-[80px]" />

          <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-72 rounded-full bg-[rgba(105,130,255,0.07)] blur-[80px]" />

          {/* PROFILE TOP */}
          <div className="relative z-10 flex flex-col gap-6 px-7 pb-7 pt-8 md:flex-row md:items-center md:justify-between md:px-9 md:pb-8 md:pt-9">

            <div className="flex min-w-0 items-center gap-5">

              {/* Avatar 3D */}
              <div className="relative shrink-0">
                <div className="absolute inset-x-2 -bottom-2 h-7 rounded-full bg-[rgba(83,57,145,0.20)] blur-lg" />

                <div
                  className="
                    relative flex h-24 w-24 items-center justify-center
                    overflow-hidden rounded-[26px]
                    border border-[rgba(255,255,255,0.94)]
                    bg-[rgba(255,255,255,0.72)]
                    text-2xl font-bold text-[rgba(77,61,119,0.90)]
                    shadow-[0_18px_35px_rgba(91,64,162,0.20),inset_0_2px_4px_rgba(255,255,255,0.95)]
                    backdrop-blur-xl
                  "
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    profile.full_name
                      ?.split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "U"
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="min-w-0">
                <h2 className="truncate text-[25px] font-extrabold tracking-[-0.025em] text-[rgba(30,24,48,0.96)]">
                  {profile.full_name || "User"}
                </h2>

                <div className="mt-2 inline-flex rounded-xl border border-[rgba(150,110,255,0.16)] bg-[rgba(157,111,255,0.11)] px-3 py-1.5 text-[12px] font-semibold text-[rgba(115,72,215,0.94)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.85)]">
                  {profile.job_title || "No job title"}
                </div>

                <p className="mt-2.5 break-all text-[13px] text-[rgba(91,83,116,0.72)]">
                  {profile.email}
                </p>
              </div>
            </div>

            {/* Reference Style Purple Button */}
            <Link
              href="/profile/edit"
              className="
                inline-flex shrink-0 items-center justify-center gap-2
                rounded-[15px]
                border border-[rgba(255,255,255,0.24)]
                bg-[linear-gradient(135deg,rgba(137,80,247,0.98),rgba(111,68,232,0.98))]
                px-6 py-3
                text-[14px] font-bold text-white
                shadow-[0_16px_30px_rgba(124,76,232,0.30),inset_0_1px_2px_rgba(255,255,255,0.24)]
                transition-all duration-300
                hover:-translate-y-1
                hover:scale-[1.02]
                hover:shadow-[0_20px_38px_rgba(124,76,232,0.36)]
                active:translate-y-0
              "
            >
              <Pencil size={16} />
              Edit Profile
            </Link>
          </div>

          {/* INNER 3D PANEL */}
          <div className="relative z-10 px-5 pb-5 md:px-7 md:pb-7">
            <div
              className="
                profile-info-panel
                relative overflow-hidden rounded-[28px]
                border border-[rgba(255,255,255,0.78)]
                bg-[rgba(255,255,255,0.48)]
                p-6
                shadow-[0_20px_45px_rgba(91,69,151,0.10),inset_0_2px_3px_rgba(255,255,255,0.90)]
                backdrop-blur-2xl
                md:p-7
              "
            >

              {/* Inner highlight */}
              <div className="pointer-events-none absolute left-10 top-0 h-28 w-80 rounded-full bg-[rgba(255,255,255,0.58)] blur-3xl" />

              <div className="relative z-10">
                <h3 className="text-[19px] font-extrabold tracking-[-0.02em] text-[rgba(36,29,55,0.94)]">
                  Personal Information
                </h3>

                <p className="mt-1 text-[12px] text-[rgba(104,93,128,0.68)]">
                  Your contact and professional details
                </p>

                {/* INFORMATION CARDS */}
                <div className="mt-6 grid gap-4 md:grid-cols-2">

                  {/* Email */}
                  <div
                    className="
                      group relative overflow-hidden rounded-[22px]
                      border border-[rgba(126,151,255,0.16)]
                      bg-[linear-gradient(145deg,rgba(240,244,255,0.82),rgba(255,255,255,0.58))]
                      p-5
                      shadow-[0_13px_26px_rgba(79,105,205,0.08),inset_0_1px_2px_rgba(255,255,255,0.94)]
                      transition-all duration-300
                      hover:-translate-y-1
                      hover:shadow-[0_18px_32px_rgba(79,105,205,0.13)]
                    "
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[rgba(106,135,255,0.09)] blur-2xl" />

                    <div className="relative">
                      <div
                        className="
                          mb-4 flex h-11 w-11 items-center justify-center rounded-[14px]
                          border border-[rgba(255,255,255,0.72)]
                          bg-[linear-gradient(145deg,rgba(129,158,255,0.28),rgba(100,127,244,0.14))]
                          shadow-[0_8px_16px_rgba(87,114,219,0.13),inset_0_1px_2px_rgba(255,255,255,0.94)]
                        "
                      >
                        <Mail
                          size={17}
                          className="text-[rgba(75,104,218,0.94)]"
                        />
                      </div>

                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgba(101,105,132,0.62)]">
                        Email Address
                      </p>

                      <p className="mt-2 break-all text-[14px] font-semibold text-[rgba(35,36,55,0.94)]">
                        {profile.email || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div
                    className="
                      group relative overflow-hidden rounded-[22px]
                      border border-[rgba(125,209,167,0.16)]
                      bg-[linear-gradient(145deg,rgba(240,251,247,0.82),rgba(255,255,255,0.58))]
                      p-5
                      shadow-[0_13px_26px_rgba(64,159,112,0.07),inset_0_1px_2px_rgba(255,255,255,0.94)]
                      transition-all duration-300
                      hover:-translate-y-1
                      hover:shadow-[0_18px_32px_rgba(64,159,112,0.12)]
                    "
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[rgba(70,196,134,0.08)] blur-2xl" />

                    <div className="relative">
                      <div
                        className="
                          mb-4 flex h-11 w-11 items-center justify-center rounded-[14px]
                          border border-[rgba(255,255,255,0.72)]
                          bg-[linear-gradient(145deg,rgba(108,219,164,0.27),rgba(75,186,134,0.13))]
                          shadow-[0_8px_16px_rgba(62,169,119,0.11),inset_0_1px_2px_rgba(255,255,255,0.94)]
                        "
                      >
                        <Phone
                          size={17}
                          className="text-[rgba(39,159,104,0.94)]"
                        />
                      </div>

                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgba(101,105,132,0.62)]">
                        Phone
                      </p>

                      <p className="mt-2 text-[14px] font-semibold text-[rgba(35,36,55,0.94)]">
                        {profile.phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Job Title */}
                  <div
                    className="
                      group relative overflow-hidden rounded-[22px]
                      border border-[rgba(239,178,120,0.17)]
                      bg-[linear-gradient(145deg,rgba(255,247,238,0.82),rgba(255,255,255,0.58))]
                      p-5
                      shadow-[0_13px_26px_rgba(199,128,67,0.07),inset_0_1px_2px_rgba(255,255,255,0.94)]
                      transition-all duration-300
                      hover:-translate-y-1
                      hover:shadow-[0_18px_32px_rgba(199,128,67,0.12)]
                      md:col-span-2
                    "
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[rgba(241,154,83,0.08)] blur-2xl" />

                    <div className="relative">
                      <div
                        className="
                          mb-4 flex h-11 w-11 items-center justify-center rounded-[14px]
                          border border-[rgba(255,255,255,0.72)]
                          bg-[linear-gradient(145deg,rgba(255,183,122,0.28),rgba(239,138,69,0.13))]
                          shadow-[0_8px_16px_rgba(205,132,67,0.10),inset_0_1px_2px_rgba(255,255,255,0.94)]
                        "
                      >
                        <Briefcase
                          size={17}
                          className="text-[rgba(220,116,48,0.94)]"
                        />
                      </div>

                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgba(101,105,132,0.62)]">
                        Job Title
                      </p>

                      <p className="mt-2 text-[14px] font-semibold text-[rgba(35,36,55,0.94)]">
                        {profile.job_title || "Not provided"}
                      </p>
                    </div>
                  </div>

                </div>

                {/* BIO */}
                <div
                  className="
                    profile-bio-card
                    relative mt-4 overflow-hidden rounded-[22px]
                    border border-[rgba(187,146,239,0.17)]
                    bg-[linear-gradient(145deg,rgba(249,243,255,0.82),rgba(255,255,255,0.60))]
                    p-5
                    shadow-[0_13px_26px_rgba(139,91,199,0.07),inset_0_1px_2px_rgba(255,255,255,0.94)]
                  "
                >
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[rgba(168,108,239,0.08)] blur-2xl" />

                  <div className="relative">
                    <span
                      className="
                        profile-bio-label
                        inline-flex rounded-xl
                        border border-[rgba(175,117,236,0.12)]
                        bg-[rgba(179,118,244,0.11)]
                        px-3 py-1.5
                        text-[10px] font-bold
                        text-[rgba(133,79,198,0.90)]
                      "
                    >
                      Bio
                    </span>

                    <p className="profile-bio-text mt-3 whitespace-pre-wrap text-[14px] leading-7 text-[rgba(65,60,82,0.84)]">
                      {profile.bio || "No bio added yet."}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}