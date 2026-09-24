"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Camera,
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
  const [openMemberMenuId, setOpenMemberMenuId] = useState<string | null>(null);
  const [roleEditMember, setRoleEditMember] = useState<TeamMember | null>(null);
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [roleEditValue, setRoleEditValue] = useState<
  "admin" | "sub_admin" | "user"
>("user");
  const [roleEditLoading, setRoleEditLoading] = useState(false);
  const [roleEditError, setRoleEditError] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [profileSaveError, setProfileSaveError] = useState("");

const [profileForm, setProfileForm] = useState({
  email: "",
  phone: "",
  job_title: "",
  bio: "",
});

useEffect(() => {
  return () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
  };
}, [avatarPreview]);


  useEffect(() => {
  if (!inviteSuccess) return;

  const timer = setTimeout(() => {
    setInviteSuccess("");
  }, 4000);

  return () => clearTimeout(timer);
}, [inviteSuccess]);

useEffect(() => {
  setProfileForm({
    email: profile.email || "",
    phone: profile.phone || "",
    job_title: profile.job_title || "",
    bio: profile.bio || "",
  });
}, [profile]);

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

const handleAvatarUpload = async (file: File) => {
  if (!currentUserId) return;

  setAvatarUploading(true);
  setProfileSaveError("");

  try {
    const filePath = `${currentUserId}/avatar`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
  setProfileSaveError(uploadError.message);
  setAvatarPreview("");
  setAvatarFile(null);
  return;
}

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentUserId);

    if (updateError) {
      setProfileSaveError(updateError.message);
      return;
    }

    setProfile((current) => ({
      ...current,
      avatar_url: avatarUrl,
    }));

    setAvatarPreview("");
    setAvatarFile(null);
  } catch (error) {
    console.error("Avatar upload error:", error);
    setProfileSaveError("Unable to upload profile image.");
  } finally {
    setAvatarUploading(false);
  }
};

const handleSaveProfile = async () => {
  if (!currentUserId) return;

  setProfileSaveError("");
  setProfileSaveLoading(true);

  try {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        job_title: profileForm.job_title.trim(),
        bio: profileForm.bio.trim(),
      })
      .eq("id", currentUserId);

    if (updateError) {
      setProfileSaveError(updateError.message);
      return;
    }

    setProfile((prev) => ({
      ...prev,
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
      job_title: profileForm.job_title.trim(),
      bio: profileForm.bio.trim(),
    }));

    setTeamMembers((members) =>
      members.map((member) =>
        member.id === currentUserId
          ? {
              ...member,
              email: profileForm.email.trim(),
              phone: profileForm.phone.trim(),
              job_title: profileForm.job_title.trim(),
            }
          : member
      )
    );

    setIsEditingProfile(false);
  } catch (error) {
  console.error("Avatar upload error:", error);
  setProfileSaveError("Unable to upload profile image.");
  setAvatarPreview("");
  setAvatarFile(null);
} finally {
    setProfileSaveLoading(false);
  }
};

const handleInviteMember = async () => {
  setInviteError("");

  const fullName = inviteFullName.trim();
  const email = inviteEmail.trim();

  if (!fullName) {
  setInviteError("Full name is required.");
  return;
}

  if (!email) {
    setInviteError("Email address is required.");
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(email)) {
  setInviteError("Please enter a valid email address.");
  return;
}

  setInviteLoading(true);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setInviteError("Your session has expired. Please log in again.");
      return;
    }

    const response = await fetch("/api/team/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
      fullName,
      email,
      role: inviteRole,
    }),
    });

    const result = await response.json();

    if (!response.ok) {
  setInviteError(result.error || "Unable to send invitation.");
  return;
}

const { data: refreshedMembers, error: refreshError } = await supabase
  .from("profiles")
  .select(
    "id, full_name, email, phone, job_title, avatar_url, role, last_seen_at"
  )
  .order("full_name", { ascending: true });

if (!refreshError) {
  setTeamMembers((refreshedMembers ?? []) as TeamMember[]);
}
setInviteSuccess(`Invitation sent to ${email}`);
setInviteFullName("");
setInviteEmail("");
setInviteRole("user");
setIsInviteOpen(false);

  } catch (error) {
    console.error("Invite member error:", error);
    setInviteError("Something went wrong while sending the invitation.");
  } finally {
    setInviteLoading(false);
  }
};

const handleRoleUpdate = async () => {
  if (!roleEditMember) return;

  setRoleEditError("");
  setRoleEditLoading(true);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setRoleEditError("Your session has expired. Please log in again.");
      return;
    }

    const response = await fetch("/api/team/role", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        memberId: roleEditMember.id,
        role: roleEditValue,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setRoleEditError(result.error || "Unable to update member role.");
      return;
    }

    setTeamMembers((members) =>
      members.map((member) =>
        member.id === roleEditMember.id
          ? { ...member, role: roleEditValue }
          : member
      )
    );

    setRoleEditMember(null);
    setOpenMemberMenuId(null);
  } catch (error) {
    console.error("Role update error:", error);
    setRoleEditError("Something went wrong while updating the role.");
  } finally {
    setRoleEditLoading(false);
  }
};

const handleRemoveMember = async () => {
  if (!removeMember) return;

  setRemoveError("");
  setRemoveLoading(true);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setRemoveError("Your session has expired. Please log in again.");
      return;
    }

    const response = await fetch("/api/team/remove", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        memberId: removeMember.id,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setRemoveError(result.error || "Unable to remove team member.");
      return;
    }

    setTeamMembers((members) =>
      members.filter((member) => member.id !== removeMember.id)
    );

    setRemoveMember(null);
    setOpenMemberMenuId(null);
  } catch (error) {
    console.error("Remove member error:", error);
    setRemoveError("Something went wrong while removing the member.");
  } finally {
    setRemoveLoading(false);
  }
};  

const teamOverviewCard = (
  <div className="h-[255px] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4">
    {/* Header */}
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-[17px] font-bold leading-tight text-white">
        Team Overview
      </h3>

      <p className="mt-0.5 text-[12px] leading-4 text-slate-400">
        Total employees and their roles
      </p>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/70 text-lg text-violet-300">
        ♙
      </div>
    </div>

    {/* Total Members */}
    <div className="mt-2 flex h-[62px] items-center justify-between rounded-[14px] border border-slate-700/60 bg-gradient-to-r from-slate-800/90 to-slate-800/60 px-4 shadow-inner">
      <p className="text-3xl font-bold text-white">
        {teamMembers.length}
      </p>

      <div className="flex items-center gap-2 text-xs text-slate-400">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      <span>{activeMemberCount} active now</span>
      </div>
      </div>

    {/* Role Cards */}
    <div className="mt-2 grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-violet-500/50 bg-violet-500/15 p-4 text-center">
        <p className="text-xl font-bold text-white">
          {adminCount}
        </p>
        <p className="mt-1 text-sm text-violet-300">
          Admin
        </p>
      </div>

      <div className="rounded-xl border border-blue-500/50 bg-blue-500/15 p-4 text-center">
        <p className="text-xl font-bold text-white">
          {subAdminCount}
        </p>
        <p className="mt-1 text-sm text-blue-300">
          Sub Admins
        </p>
      </div>

      <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/15 p-4 text-center">
        <p className="text-xl font-bold text-white">
          {employeeCount}
        </p>
        <p className="mt-1 text-sm text-emerald-300">
          Employees
        </p>
      </div>
    </div>

    {/* Active */}
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
  <div className="min-h-[calc(100vh-60px)] w-full bg-[rgba(247,248,252,1)] px-5 pt-3 pb-6 md:px-6 lg:px-7 profile-theme-page">
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(340px,1fr)]">

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
        <div className="team-overview-section self-start lg:col-start-2 lg:row-start-2">
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
    Full Name
  </label>

  <input
    type="text"
    value={inviteFullName}
    onChange={(e) => setInviteFullName(e.target.value)}
    placeholder="Enter member name"
    className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
  />
</div>
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
      {currentMember?.role === "admin" && (
        <>
          <option value="sub_admin">Sub Admin</option>
          <option value="admin">Admin</option>
        </>
      )}
    </select>
  </div>

  {inviteError && (
    <p className="text-sm text-red-400">
      {inviteError}
    </p>
  )}

  <div className="mt-6 flex items-center justify-end gap-3">
  <button
    type="button"
    onClick={() => setIsInviteOpen(false)}
    className="h-10 rounded-lg border border-slate-700 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
  >
    Cancel
  </button>

  <button
    type="button"
    onClick={handleInviteMember}
    disabled={inviteLoading}
    className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {inviteLoading ? "Sending..." : "Send Invite"}
  </button>
</div>
</div>
    </div>
  </div>
)}

{roleEditMember && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Change Member Role
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Update the role for{" "}
            <span className="font-medium text-slate-200">
              {roleEditMember.full_name || roleEditMember.email}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRoleEditMember(null)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Role
        </label>

        <select
          value={roleEditValue}
          onChange={(e) =>
          setRoleEditValue(
            e.target.value as "admin" | "sub_admin" | "user"
          )
        }
          className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-300 outline-none focus:border-violet-500"
        >
          <option value="user">Employee</option>
          {currentMember?.role === "admin" && (
            <>
              <option value="sub_admin">Sub Admin</option>
              <option value="admin">Admin</option>
            </>
          )}
        </select>
      </div>

      {roleEditError && (
        <p className="mt-4 text-sm text-red-400">
          {roleEditError}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setRoleEditMember(null)}
          className="h-10 rounded-lg border border-slate-700 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          Cancel
        </button>

        <button
        type="button"
        onClick={handleRoleUpdate}
        disabled={roleEditLoading}
        className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {roleEditLoading ? "Saving..." : "Save Role"}
      </button>
      </div>
    </div>
  </div>
)}

{removeMember && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Remove Team Member
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Are you sure you want to remove{" "}
            <span className="font-medium text-white">
              {removeMember.full_name || removeMember.email}
            </span>
            ?
          </p>

          <p className="mt-2 text-sm text-red-400">
            Their CRM access and login account will be removed. They will need
            a new invitation to access the CRM again.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRemoveMember(null);
            setRemoveError("");
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          ×
        </button>
      </div>

      {removeError && (
        <p className="mt-4 text-sm text-red-400">
          {removeError}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setRemoveMember(null);
            setRemoveError("");
          }}
          className="h-10 rounded-lg border border-slate-700 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleRemoveMember}
          disabled={removeLoading}
          className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {removeLoading ? "Removing..." : "Remove Member"}
        </button>
      </div>
    </div>
  </div>
)}
  {inviteSuccess && (
    <div className="fixed bottom-6 right-6 z-[60] w-[320px] rounded-xl border border-emerald-500/20 bg-slate-950 px-4 py-3 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          ✓
        </div>

        <div>
          <p className="text-sm font-semibold text-white">
            Invitation sent
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {inviteSuccess}
          </p>
        </div>
      </div>
    </div>
  )}

    {/* 3D PROFILE CARD */}
      <div className="order-3 -mt-2 flex items-center gap-1 border-b border-slate-800 lg:col-span-2 lg:row-start-3">
        <button
        type="button"
        onClick={() => setActiveProfileTab("team")}
        className={`flex h-12 items-center gap-2 border-b-2 px-4 text-sm font-medium transition ${
        activeProfileTab === "team"
          ? "border-violet-500 text-violet-400"
          : "border-transparent text-slate-400 hover:text-white"
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
      <div className="order-4 -mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 lg:col-span-2 lg:row-start-4">
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
            onClick={() => {
            setInviteError("");
            setInviteEmail("");
            setInviteFullName("");
            setInviteRole("user");
            setIsInviteOpen(true);
          }}
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

      <div className="relative flex justify-center">
        {isCurrentUser || !canManageTeam ? (
          <span className="text-slate-500">—</span>
        ) : (
          <button
            type="button"
            onClick={() =>
              setOpenMemberMenuId((currentId) =>
                currentId === member.id ? null : member.id
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            •••
          </button>
          
        )}
        {openMemberMenuId === member.id && (
        <div className="absolute right-0 top-9 z-50 w-40 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setRoleEditError("");
              setRoleEditMember(member);
              setRoleEditValue(member.role || "user");
              setOpenMemberMenuId(null);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Change Role
          </button>

          {currentMember?.role === "admin" && (
          <button
            type="button"
            onClick={() => {
              setRemoveError("");
              setRemoveMember(member);
              setOpenMemberMenuId(null);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/10"
          >
            Remove Member
          </button>
        )}
        </div>
      )}
      </div>

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
          <div className="relative z-10 flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6 md:py-5">

            <div className="flex min-w-0 items-center gap-4">

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
                  {(avatarPreview || profile.avatar_url) ? (
                    <img
                      src={avatarPreview || profile.avatar_url || ""}
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
                <button
                type="button"
                onClick={() => document.getElementById("avatar-upload")?.click()}
                disabled={avatarUploading}
                aria-label="Change profile photo"
                title="Change profile photo"
                className="
                  absolute bottom-0 right-0
                  flex h-9 w-9 items-center justify-center
                  rounded-xl
                  border-2 border-slate-900
                  bg-violet-600
                  text-white
                  shadow-lg
                  transition
                  hover:bg-violet-500
                "
              >
                {avatarUploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Camera size={16} />
              )}
              </button>
              <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              disabled={avatarUploading}
              className="hidden"
              onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = "";

              if (!file) return;
              setProfileSaveError("");

              if (!file.type.startsWith("image/")) {
              setProfileSaveError("Please select a valid image file.");
              return;
            }

            if (file.size > 5 * 1024 * 1024) {
              setProfileSaveError("Profile image must be smaller than 5MB.");
              return;
            }

              setAvatarFile(file);
              setAvatarPreview(URL.createObjectURL(file));

              handleAvatarUpload(file);
            }}
            />
              </div>

              {/* Name */}
              {/* Profile Details */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="truncate text-[25px] font-extrabold tracking-[-0.025em] text-white">
                    {profile.full_name || "User"}
                  </h2>

                  <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">
                    {currentMember?.role === "admin"
                      ? "Admin"
                      : currentMember?.role === "sub_admin"
                        ? "Sub Admin"
                        : "Employee"}
                  </span>

                  <span className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>

                <div className="mt-2 space-y-1.5 text-[13px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="shrink-0 text-slate-400" />
                    <span>{profile.email || "—"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone size={14} className="shrink-0 text-slate-400" />
                    <span>{profile.phone || "—"}</span>
                  </div>

                  <div className="text-slate-300">
                    {profile.job_title || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Reference Style Purple Button */}
           <button
              type="button"
              onClick={() => {
                if (isEditingProfile) {
                  handleSaveProfile();
                } else {
                  setProfileSaveError("");
                  setIsEditingProfile(true);
                }
              }}
              disabled={profileSaveLoading}
              className="
                inline-flex shrink-0 items-center justify-center gap-2
                rounded-[15px]
                border border-violet-500/40
                bg-violet-500/15
                px-4 py-2.5
                text-sm font-semibold text-violet-300
                transition
                hover:bg-violet-500/20
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Pencil size={16} />

              {profileSaveLoading
                ? "Saving..."
                : isEditingProfile
                  ? "Save Changes"
                  : "Edit Profile"}
            </button>
            {isEditingProfile && (
            <button
              type="button"
              disabled={profileSaveLoading}
              onClick={() => {
                setProfileForm({
                  email: profile.email || "",
                  phone: profile.phone || "",
                  job_title: profile.job_title || "",
                  bio: profile.bio || "",
                });

                setProfileSaveError("");
                setIsEditingProfile(false);
              }}
              className="
                ml-2
                inline-flex items-center justify-center
                rounded-[15px]
                border border-slate-700
                bg-slate-800/70
                px-4 py-2.5
                text-sm font-semibold text-slate-300
                transition
                hover:bg-slate-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>
          )}
            {profileSaveError && (
            <p className="mt-2 text-sm font-medium text-red-400">
              {profileSaveError}
            </p>
          )}
          </div>

          {/* INNER 3D PANEL */}
          <div className="relative z-10 px-5 pb-5 md:px-7 md:pb-7">
            <div className="relative z-10">

                {/* INFORMATION CARDS */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.18fr_1fr_1fr_1fr]">

                  {/* Email */}
                  <div
                    className="
                    group relative h-[76px] overflow-hidden rounded-[18px]
                    border border-slate-700/70
                    bg-slate-800/50
                    px-4 py-3
                    transition-all duration-300
                    hover:border-slate-600"
                  >

                    <div className="flex h-full items-center gap-3">
                      <div
                        className="
                         flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]
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
                      <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgba(101,105,132,0.62)]">
                        Email Address
                      </p>
                      {isEditingProfile ? (
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-[13px] font-semibold text-slate-200 outline-none focus:border-violet-500"
                      />
                    ) : (
                      <p className="mt-1 whitespace-nowrap text-[13px] font-semibold text-slate-300">
                        {profile.email || "Not provided"}
                      </p>
                    )}
                    </div>
                  </div>
                  </div>

                  {/* Phone */}
                  <div
                    className="
                    group relative h-[76px] overflow-hidden rounded-[18px]
                    border border-slate-700/70
                    bg-slate-800/50
                    px-4 py-3
                    transition-all duration-300
                    hover:border-slate-600
                  "
                  >

                    <div className="flex h-full items-center gap-3">
                      <div
                        className="
                          flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]
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
                      <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgba(101,105,132,0.62)]">
                        Phone
                      </p>

                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-[13px] font-semibold text-slate-200 outline-none focus:border-violet-500"
                        />
                      ) : (
                        <p className="mt-1 text-[13px] font-semibold text-slate-300">
                          {profile.phone || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                  {/* Job Title */}
                  <div
                    className="
                    group relative h-[76px] overflow-hidden rounded-[18px]
                    border border-slate-700/70
                    bg-slate-800/50
                    px-4 py-3
                    transition-all duration-300
                    hover:border-slate-600                    "
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[rgba(241,154,83,0.08)] blur-2xl" />

                    <div className="flex h-full items-center gap-3">
                      <div
                        className="
                          flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]
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
                      <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgba(101,105,132,0.62)]">
                        Job Title
                      </p>

                      {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileForm.job_title}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            job_title: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-[13px] font-semibold text-slate-200 outline-none focus:border-violet-500"
                      />
                    ) : (
                      <p className="mt-1 text-[13px] font-semibold text-slate-300">
                        {profile.job_title || "Not provided"}
                      </p>
                    )}
                    </div>
                  </div>
                  </div>
                <div
                className="
                profile-bio-card
                relative h-[76px] overflow-hidden rounded-[18px]
                border border-[rgba(187,146,239,0.17)]
                bg-[linear-gradient(145deg,rgba(249,243,255,0.82),rgba(255,255,255,0.60))]
                px-4 py-3
                shadow-[0_13px_26px_rgba(139,91,199,0.07),inset_0_1px_2px_rgba(255,255,255,0.94)]">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[rgba(168,108,239,0.08)] blur-2xl" />
              <div className="flex h-full items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-cyan-500/20 bg-cyan-500/15 text-sm font-bold text-cyan-400"> i </div>
              <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Bio
              </span>
              {isEditingProfile ? (
                <textarea
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-[13px] text-slate-200 outline-none focus:border-violet-500"
                />
              ) : (
                <p className="profile-bio-text mt-1 whitespace-pre-wrap text-[14px] leading-7 text-slate-300">
                  {profile.bio || "No bio added yet."}
                </p>
              )}
              </div>
              </div>
                </div>
                </div>  

                {/* BIO */}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>  
);
}