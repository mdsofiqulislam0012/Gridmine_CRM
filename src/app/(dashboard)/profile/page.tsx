"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Camera,
  Mail,
  Phone,
  Briefcase,
  Save,
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
  const [profileSaveSuccess, setProfileSaveSuccess] = useState("");

const [profileForm, setProfileForm] = useState({
  email: "",
  phone: "",
  job_title: "",
  bio: "",
});

const hasProfileChanges =
  profileForm.email.trim() !== (profile.email || "").trim() ||
  profileForm.phone.trim() !== (profile.phone || "").trim() ||
  profileForm.job_title.trim() !== (profile.job_title || "").trim() ||
  profileForm.bio.trim() !== (profile.bio || "").trim();


  useEffect(() => {
  const handleOutsideClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (!target.closest("[data-member-menu]")) {
      setOpenMemberMenuId(null);
    }
  };

  document.addEventListener("mousedown", handleOutsideClick);

  return () => {
    document.removeEventListener("mousedown", handleOutsideClick);
  };
}, []);

useEffect(() => {
  if (!profileSaveSuccess) return;

  const timer = setTimeout(() => {
    setProfileSaveSuccess("");
  }, 3000);

  return () => clearTimeout(timer);
}, [profileSaveSuccess]);

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
    return " Online ";
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
  if (!hasProfileChanges) return;
  if (!currentUserId) return;

  const email = profileForm.email.trim();

if (!email) {
  setProfileSaveError("Email address is required.");
  return;
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  setProfileSaveError("Please enter a valid email address.");
  return;
}

const phone = profileForm.phone.trim();

if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
  setProfileSaveError("Please enter a valid phone number.");
  return;
}

const jobTitle = profileForm.job_title.trim();

if (!jobTitle) {
  setProfileSaveError("Job title is required.");
  return;
}

if (jobTitle.length > 60) {
  setProfileSaveError("Job title must be 60 characters or less.");
  return;
}

const bio = profileForm.bio.trim();

if (bio.length > 300) {
  setProfileSaveError("Bio must be 300 characters or less.");
  return;
}

  setProfileSaveError("");
  setProfileSaveSuccess("");
  setProfileSaveLoading(true);

  try {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
      email,
      phone,
      job_title: jobTitle,
      bio,
    })
      .eq("id", currentUserId);

    if (updateError) {
      setProfileSaveError(updateError.message);
      return;
    }

    setProfile((prev) => ({
    ...prev,
    email,
    phone,
    job_title: jobTitle,
    bio,
  }));

    setTeamMembers((members) =>
      members.map((member) =>
        member.id === currentUserId
          ? {
              ...member,
              email,
              phone,
              job_title: jobTitle,
            }
          : member
      )
    );

    setProfileSaveSuccess("Profile updated successfully.");

    setIsEditingProfile(false);
  } catch (error) {
  console.error("Profile save error:", error);
  setProfileSaveError("Unable to save profile changes.");
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
  <div className="profile-team-overview h-[255px] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4">
    {/* Header */}
    <div className="flex items-start justify-between">
      <div>
        <h3 className="profile-team-overview-title text-[17px] font-bold leading-tight">
        Team Overview
      </h3>

      <p className="profile-team-overview-subtitle mt-0.5 text-[12px] leading-4">
        Total employees and their roles
      </p>
      </div>

      <div className="profile-team-overview-icon flex h-11 w-11 items-center justify-center rounded-xl text-lg">
        ♙
      </div>
    </div>

    {/* Total Members */}
    <div className="profile-team-total mt-2 flex h-[62px] items-center justify-between rounded-[14px] px-4">
      <p className="profile-team-total-number text-3xl font-bold">
        {teamMembers.length}
      </p>

      <div className="flex items-center gap-2 text-xs text-slate-400">
      <span className="profile-team-active-now text-xs" />
      <span>{activeMemberCount} Online </span>
      </div>
      </div>

    {/* Role Cards */}
    <div className="mt-2 grid grid-cols-3 gap-3">
      <div className="profile-role-admin rounded-xl p-4 text-center">
        <p className="profile-role-count text-xl font-bold">
          {adminCount}
        </p>
        <p className="profile-role-admin-label text-xs font-medium">
          Admin
        </p>
      </div>

      <div className="profile-role-subadmin rounded-xl p-4 text-center">
        <p className="profile-role-count text-xl font-bold">
          {subAdminCount}
        </p>
        <p className="profile-role-subadmin-label text-xs font-medium">
          Sub Admins
        </p>
      </div>

      <div className="profile-role-employee rounded-xl p-4 text-center">
        <p className="profile-role-count text-xl font-bold">
          {employeeCount}
        </p>
        <p className="profile-role-employee-label text-xs font-medium">
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
          <h1 className="profile-page-title text-[22px] font-semibold tracking-[-0.015em]">
            My Profile
          </h1> 

          <p className="profile-page-subtitle mt-1 text-sm">
            Manage your profile and view your team members
          </p>
        </div>

        <div className="profile-breadcrumb flex items-center gap-2 text-xs">
        <span>Home</span>
        <span>›</span>
        <span className="profile-breadcrumb-current font-medium">Profile</span>
      </div>
      </div>
        <div className="team-overview-section self-start lg:col-start-2 lg:row-start-2">
          {teamOverviewCard}
        </div>

        {isInviteOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <div className="profile-invite-modal w-full max-w-lg rounded-2xl p-6 shadow-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="profile-invite-modal-title text-lg font-semibold">
            Invite Team Member
          </h2>

          <p className="profile-invite-modal-subtitle mt-1 text-sm">
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
    className="profile-invite-cancel ml-2 inline-flex items-center justify-center rounded-[15px] px-4 py-2.5 text-[14px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
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
      <div className="profile-tabs order-3 -mt-2 flex items-center gap-1 lg:col-span-2 lg:row-start-3">
        <button
        type="button"
        onClick={() => setActiveProfileTab("team")}
        className={`profile-tab-button flex h-12 items-center gap-2 border-b-2 px-4 text-sm font-medium transition ${
        activeProfileTab === "team"
          ? "profile-tab-active"
          : "profile-tab-idle"
      }`}
      >
        Team Members
      </button>

        <button
        type="button"
        onClick={() => setActiveProfileTab("activity")}
        className={`profile-tab-button border-b-2 px-1 py-3 text-sm font-medium transition ${
        activeProfileTab === "activity"
          ? "profile-tab-active"
          : "profile-tab-idle"
      }`}
      >
        My Activity
      </button>

        <button
          type="button"
          onClick={() => setActiveProfileTab("security")}
          className={`profile-tab-button border-b-2 px-1 py-3 text-sm font-medium transition ${
          activeProfileTab === "security"
            ? "profile-tab-active"
            : "profile-tab-idle"
        }`}
        >
          Security
        </button>

        <button
        type="button"
        onClick={() => setActiveProfileTab("notifications")}
        className={`profile-tab-button border-b-2 px-1 py-3 text-sm font-medium transition ${
        activeProfileTab === "notifications"
          ? "profile-tab-active"
          : "profile-tab-idle"
      }`}
      >
        Notifications
      </button>
      </div>
      {activeProfileTab === "team" && (
      <div className="profile-team-list-card order-4 -mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 lg:col-span-2 lg:row-start-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="profile-team-list-title text-lg font-semibold">
            All Team Members
          </h2>

          <p className="profile-team-list-subtitle mt-1 text-sm">
            View all members in your company and their roles
          </p>  
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search team members..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="profile-team-search h-10 w-full rounded-lg px-3 text-sm outline-none sm:w-64"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="profile-team-role-filter h-10 rounded-lg px-3 text-sm outline-none"
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
          className="profile-invite-button inline-flex h-10 items-center justify-center gap-2 rounded-[12px] px-4 text-[13px] font-semibold transition-all duration-200"
          >
            + Invite Member
          </button>
        )}
        </div>
      </div>
      

      <div className="profile-team-table mt-5 overflow-hidden rounded-xl">
        <div className="profile-team-table-head grid grid-cols-[40px_1.6fr_1fr_1.6fr_1.2fr_0.8fr_1fr_60px] items-center px-4 py-3 text-xs font-medium">
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
      className="profile-team-table-row grid grid-cols-[40px_1.6fr_1fr_1.6fr_1.2fr_0.8fr_1fr_60px] items-center px-4 py-3 text-sm"
    >
      <span className="profile-team-row-index">{index + 1}</span>

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
            <span className="profile-team-member-name truncate font-medium">
              {member.full_name || "Unnamed Member"}
            </span>

            {isCurrentUser && (
              <span className="profile-team-you-badge rounded px-1.5 py-0.5 text-[10px]">
                You
              </span>
            )}
          </div>
        </div>
      </div>

      <span
        className={`profile-team-role-badge w-fit rounded-md px-2 py-1 text-xs font-medium ${
          member.role === "admin"
            ? "profile-team-role-admin-badge"
            : member.role === "sub_admin"
              ? "profile-team-role-subadmin-badge"
              : "profile-team-role-employee-badge"
        }`}
      >
        {getRoleLabel(member.role)}
      </span>

      <span className="profile-team-member-email truncate">
        {member.email || "—"}
      </span>

      <span className="profile-team-member-phone">
        {member.phone || "—"}
      </span>

      <span>—</span>

      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            isActive ? "bg-emerald-500" : "bg-slate-500"
          }`}
        />

        <span
        className={
          isActive
            ? "profile-team-status-active"
            : "profile-team-status-offline"
        }
      >
          {getMemberStatus(member.last_seen_at)}
        </span>
      </div>

      <div className="relative flex justify-center" data-member-menu>
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
            className="profile-team-action-button flex h-8 w-8 items-center justify-center rounded-md transition-all"
          >
            •••
          </button>
          
        )}
        {openMemberMenuId === member.id && (
        <div className="profile-team-action-menu absolute right-0 top-9 z-50 w-40 overflow-hidden rounded-lg">
          <button
            type="button"
            onClick={() => {
              setRoleEditError("");
              setRoleEditMember(member);
              setRoleEditValue(member.role || "user");
              setOpenMemberMenuId(null);
            }}
            className="profile-team-action-change-role block w-full px-3 py-2 text-left text-sm transition-all"
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
            className="profile-team-action-remove block w-full px-3 py-2 text-left text-sm transition-all"
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
    <p className="profile-team-empty-title text-sm font-medium">
      No team members found
    </p>

    <p className="profile-team-empty-subtitle mt-1 text-xs">
      Try changing your search or role filter.
    </p>
  </div>
)}

<div className="profile-team-table-footer flex items-center justify-between px-4 py-3 text-xs">
  <span className="profile-team-table-summary">
    Showing {filteredTeamMembers.length} of {totalMembers} members
  </span>

  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
      disabled={currentPage === 1}
      className="profile-team-pagination-nav flex h-8 w-8 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-40"
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
          className={`profile-team-pagination-page flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium ${
          currentPage === pageNumber
            ? "profile-team-pagination-page-active"
            : "profile-team-pagination-page-idle"
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
      className="profile-team-pagination-nav flex h-8 w-8 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-40"
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
          transition-all duration-300
        "
        >

          {/* Soft internal RGBA light */}
          <div className="
            pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full
            bg-[rgba(59,130,246,0.05)] blur-[80px]
            dark:bg-[rgba(59,130,246,0.07)]
          " />

          <div className="
            pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full
            bg-[rgba(139,92,246,0.05)] blur-[90px]
            dark:bg-[rgba(139,92,246,0.08)]
          " />

          <div className="
            pointer-events-none absolute bottom-0 left-1/3 h-56 w-72 rounded-full
            bg-[rgba(6,182,212,0.035)] blur-[90px]
            dark:bg-[rgba(6,182,212,0.06)]
          " />

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
                  <h2 className="profile-main-name truncate text-[24px] font-semibold tracking-[-0.015em]">
                    {profile.full_name || "User"}
                  </h2>

                  <span className="profile-main-role-badge rounded-full px-3 py-1 text-xs font-semibold">
                    {currentMember?.role === "admin"
                      ? "Admin"
                      : currentMember?.role === "sub_admin"
                        ? "Sub Admin"
                        : "Employee"}
                  </span>

                  <span className="profile-main-status flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>

                <div className="profile-main-meta mt-2 space-y-1.5 text-[13px]">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="shrink-0 text-slate-500" />
                    <span>{profile.email || "—"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone size={14} className="shrink-0 text-slate-500" />
                    <span>{profile.phone || "—"}</span>
                  </div>

                  <div className="text-slate-700">
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
                  setProfileSaveSuccess("");
                  setIsEditingProfile(true);
                }
              }}
              disabled={
              profileSaveLoading ||
              (isEditingProfile && !hasProfileChanges)
            }
              className="
              inline-flex shrink-0 items-center justify-center gap-2
              rounded-[12px]
              !border !border-[rgba(59,130,246,0.75)]
              !bg-[rgba(37,99,235,1)]
              px-5 py-2.5
              text-[13px] font-semibold !text-[rgba(255,255,255,1)]
              shadow-[0_8px_24px_rgba(37,99,235,0.35)]
              transition-all duration-200
              hover:-translate-y-[1px]
              hover:!border-[rgba(147,197,253,1)]
              hover:!bg-[rgba(59,130,246,1)]
              hover:shadow-[0_12px_30px_rgba(37,99,235,0.45)]
              active:translate-y-0
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            >
              {profileSaveLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300/40 border-t-violet-300" />
              ) : isEditingProfile ? (
                <Save size={16} />
              ) : (
                <Pencil size={16} />
              )}

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
              className="profile-edit-cancel ml-2 inline-flex items-center justify-center rounded-[15px] px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          )}
            {profileSaveError && (
            <p className="mt-2 text-sm font-medium text-red-400">
              {profileSaveError}
            </p>
          )}

          {profileSaveSuccess && (
          <p className="mt-2 text-sm font-medium text-emerald-400">
            {profileSaveSuccess}
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
                    !border !border-[rgba(59,130,246,0.38)]
                    !bg-[rgba(59,130,246,0.10)]
                    px-4 py-3
                    shadow-[0_8px_22px_rgba(0,0,0,0.16)]
                    transition-all duration-200
                    hover:-translate-y-[1px]
                    hover:!border-[rgba(59,130,246,0.72)]
                    hover:!bg-[rgba(59,130,246,0.16)]
                    hover:shadow-[0_10px_28px_rgba(37,99,235,0.18)]
                  "
                  >

                    <div className="flex h-full items-center gap-3">
                      <div
                       className="
                        flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]
                        !border !border-[rgba(59,130,246,0.55)]
                        !bg-[rgba(59,130,246,0.20)]
                        shadow-[0_6px_18px_rgba(37,99,235,0.20)]
                      "
                      >
                        <Mail
                          size={17}
                          className="!text-[rgba(96,165,250,1)]"
                        />
                      </div>
                      <div className="min-w-0">
                      <p className="profile-info-label text-[10px] font-bold uppercase tracking-[0.12em]">
                        Email Address
                      </p>
                      {isEditingProfile ? (
                      <input
                        type="email"
                        autoComplete="email"
                        value={profileForm.email}
                        maxLength={254}
                        disabled={profileSaveLoading}
                        onChange={(e) => {
                          setProfileSaveError("");
                          setProfileForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }}
                       className="profile-edit-input mt-1 w-full rounded-lg px-2 py-1 text-[13px] font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    ) : (
                      <p className="profile-info-value mt-1 whitespace-nowrap text-[13px] font-semibold">
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
                    !border !border-[rgba(16,185,129,0.38)]
                    !bg-[rgba(16,185,129,0.10)]
                    px-4 py-3
                    shadow-[0_8px_22px_rgba(0,0,0,0.16)]
                    transition-all duration-200
                    hover:-translate-y-[1px]
                    hover:!border-[rgba(16,185,129,0.72)]
                    hover:!bg-[rgba(16,185,129,0.16)]
                    hover:shadow-[0_10px_28px_rgba(16,185,129,0.18)]
                  "
                  >

                    <div className="flex h-full items-center gap-3">
                      <div
                        className="
                        flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]
                        !border !border-[rgba(16,185,129,0.55)]
                        !bg-[rgba(16,185,129,0.20)]
                        shadow-[0_6px_18px_rgba(16,185,129,0.20)]
                      "
                      >
                        <Phone
                          size={17}
                          className="!text-[rgba(52,211,153,1)]"
                        />
                      </div>
                      <div className="min-w-0">
                      <p className="profile-info-label text-[10px] font-bold uppercase tracking-[0.12em]">
                        Phone
                      </p>

                      {isEditingProfile ? (
                        <input
                          type="text"
                          inputMode="tel"
                          autoComplete="tel"
                          value={profileForm.phone}
                          disabled={profileSaveLoading}
                          maxLength={20}
                          onChange={(e) => {
                            setProfileSaveError("");
                            setProfileForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }}
                          className="profile-edit-input mt-1 w-full rounded-lg px-2 py-1 text-[13px] font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      ) : (
                        <p className="profile-info-value mt-1 text-[13px] font-semibold">
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
                    !border !border-[rgba(245,158,11,0.38)]
                    !bg-[rgba(245,158,11,0.10)]
                    px-4 py-3
                    shadow-[0_8px_22px_rgba(0,0,0,0.16)]
                    transition-all duration-200
                    hover:-translate-y-[1px]
                    hover:!border-[rgba(245,158,11,0.72)]
                    hover:!bg-[rgba(245,158,11,0.16)]
                    hover:shadow-[0_10px_28px_rgba(245,158,11,0.18)]
                  "
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[rgba(241,154,83,0.08)] blur-2xl" />

                    <div className="flex h-full items-center gap-3">
                      <div
                        className="
                        flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]
                        !border !border-[rgba(245,158,11,0.55)]
                        !bg-[rgba(245,158,11,0.20)]
                        shadow-[0_6px_18px_rgba(245,158,11,0.20)]
                      "
                      >
                        <Briefcase
                          size={17}
                          className="!text-[rgba(251,191,36,1)]"
                        />
                      </div>
                      <div className="min-w-0">
                      <p className="profile-info-label text-[10px] font-bold uppercase tracking-[0.12em]">
                        Job Title
                      </p>

                      {isEditingProfile ? (
                      <input
                        type="text"
                        autoComplete="organization-title"
                        value={profileForm.job_title}
                        disabled={profileSaveLoading}
                        maxLength={60}
                        onChange={(e) => {
                          setProfileSaveError("");
                          setProfileForm((prev) => ({
                            ...prev,
                            job_title: e.target.value,
                          }))
                        }}
                        className="profile-edit-input mt-1 w-full rounded-lg px-2 py-1 text-[13px] font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    ) : (
                      <p className="profile-info-value mt-1 text-[13px] font-semibold">
                        {profile.job_title || "Not provided"}
                      </p>
                    )}
                    </div>
                  </div>
                  </div>
                <div
                className={`
                profile-bio-card
                group relative rounded-[18px]
                ${isEditingProfile ? "min-h-[120px]" : "h-[76px] overflow-hidden"}
                !border !border-[rgba(6,182,212,0.38)]
                !bg-[rgba(6,182,212,0.10)]
                px-4 py-3
                shadow-[0_8px_22px_rgba(0,0,0,0.16)]
                transition-all duration-200
                hover:-translate-y-[1px]
                hover:!border-[rgba(6,182,212,0.72)]
                hover:!bg-[rgba(6,182,212,0.16)]
                hover:shadow-[0_10px_28px_rgba(6,182,212,0.18)]
              `}
              >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[rgba(168,108,239,0.08)] blur-2xl" />
              <div className="flex h-full items-center gap-3">
                <div className="
                  flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]
                  !border !border-[rgba(6,182,212,0.55)]
                  !bg-[rgba(6,182,212,0.20)]
                  text-sm font-bold
                  !text-[rgba(34,211,238,1)]
                  shadow-[0_6px_18px_rgba(6,182,212,0.20)]
                "> i </div>
              <div className="min-w-0">
              <span className="profile-info-label text-[10px] font-bold uppercase tracking-[0.12em]">
              Bio
              </span>
              {isEditingProfile ? (
                <>
                <textarea
                  value={profileForm.bio}
                  disabled={profileSaveLoading}
                  maxLength={300}
                  onChange={(e) => {
                    setProfileSaveError("");
                    setProfileForm((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }}
                  rows={3}
                  className="profile-edit-input mt-1 w-full resize-none rounded-lg px-3 py-2 text-[13px] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="profile-bio-counter mt-1 text-right text-[11px]">
                {profileForm.bio.length}/300
              </p>
              </>
              ) : (
                <p className="profile-bio-text profile-info-value mt-1 whitespace-pre-wrap text-[14px] leading-7">
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