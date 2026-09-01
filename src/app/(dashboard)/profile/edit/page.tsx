"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, X } from "lucide-react";

type Profile = {
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  bio: string;
  avatar_url: string | null;
};

export default function EditProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const { refreshUser } = useAuth();

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    job_title: "",
    bio: "",
    avatar_url: null,
  });

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Auto hide success message
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  // Load profile
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

      setUserId(user.id);

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, phone, job_title, bio, avatar_url")
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
        avatar_url: data.avatar_url ?? null,
      });

      setLoading(false);
    };

    loadProfile();
  }, [supabase]);

  // Upload profile photo
  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    const filePath = `${userId}/avatar`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
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
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    setProfile((current) => ({
      ...current,
      avatar_url: avatarUrl,
    }));

    await refreshUser();

    setMessage("Profile photo updated successfully.");
    setUploading(false);
  };

  // Save profile
  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setMessage("");
    setError("");

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        job_title: profile.job_title.trim(),
        bio: profile.bio.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    await supabase.auth.updateUser({
      data: {
        full_name: profile.full_name.trim(),
      },
    });

    await refreshUser();

    setMessage("Profile updated successfully.");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

 return (
  <div className="profile-page-enter min-h-[calc(100vh-60px)] bg-[rgba(247,248,252,1)] px-5 py-6 md:px-8">
    <div className="mx-auto max-w-5xl">

      {/* Compact Title */}
      <div className="mx-auto mb-4 max-w-4xl">
        <h1 className="profile-title-enter text-[22px] font-extrabold tracking-[-0.02em] text-[rgba(28,24,46,0.95)]">
        Edit Profile
      </h1>
      </div>

      {/* Success Toast */}
      {message && (
        <div
          className="
            profile-toast fixed right-6 top-20 z-50
            min-w-[330px] overflow-hidden rounded-[18px]
            border border-[rgba(255,255,255,0.85)]
            bg-[rgba(255,255,255,0.94)]
            shadow-[0_22px_55px_rgba(57,45,100,0.18)]
            backdrop-blur-xl
          "
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[rgba(76,201,140,0.12)]">
              <CheckCircle2
                size={20}
                className="text-[rgba(35,167,103,0.95)]"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[rgba(28,24,46,0.95)]">
                Changes saved
              </p>

              <p className="mt-0.5 text-xs text-[rgba(91,83,116,0.68)]">
                {message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="rounded-lg p-1.5 text-[rgba(100,93,120,0.65)] transition hover:bg-[rgba(120,100,180,0.08)]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="h-[3px] bg-[rgba(76,201,140,0.08)]">
            <div className="profile-toast-progress h-full bg-[rgba(48,183,113,0.88)]" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-auto mb-4 max-w-4xl rounded-2xl border border-[rgba(239,68,68,0.15)] bg-[rgba(255,245,245,0.92)] px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 3D EDIT PROFILE CARD */}
      <div className="profile-card-enter relative mx-auto max-w-4xl [perspective:1400px]">

        {/* Depth */}
        <div className="absolute inset-x-8 -bottom-5 h-16 rounded-[40px] bg-[rgba(119,89,210,0.16)] blur-2xl" />

        <div className="absolute inset-0 translate-x-[7px] translate-y-[10px] rounded-[34px] bg-[rgba(177,157,244,0.20)]" />

        {/* Main Card */}
        <div
          className="
            relative overflow-hidden rounded-[34px]
            border border-[rgba(255,255,255,0.85)]
            bg-[linear-gradient(145deg,rgba(248,244,255,0.98)_0%,rgba(239,234,255,0.96)_48%,rgba(247,243,255,0.98)_100%)]
            shadow-[0_32px_75px_rgba(94,72,160,0.18),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-3px_8px_rgba(117,85,205,0.07)]
            [transform:rotateX(1.5deg)]
            transition-all duration-500
            hover:[transform:rotateX(0deg)_translateY(-3px)]
          "
        >
          {/* Internal Glow */}
          <div className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-[rgba(255,255,255,0.72)] blur-[70px]" />

          <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[rgba(164,112,255,0.12)] blur-[80px]" />

          {/* PROFILE PHOTO AREA */}
          <div className="relative z-10 flex items-center gap-5 px-7 pb-6 pt-8 md:px-9">

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
                "
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
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

            <div>
              {/* Upload button */}
              <label
                className="
                  inline-flex cursor-pointer items-center justify-center
                  rounded-[15px]
                  border border-[rgba(255,255,255,0.24)]
                  bg-[linear-gradient(135deg,rgba(137,80,247,0.98),rgba(111,68,232,0.98))]
                  px-5 py-2.5
                  text-[13px] font-bold text-white
                  shadow-[0_14px_28px_rgba(124,76,232,0.27),inset_0_1px_2px_rgba(255,255,255,0.24)]
                  transition-all duration-300
                  hover:-translate-y-0.5
                  hover:shadow-[0_18px_34px_rgba(124,76,232,0.34)]
                "
              >
                {uploading ? "Uploading..." : "Upload Photo"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <p className="mt-2 text-[11px] text-[rgba(91,83,116,0.62)]">
                JPG, PNG or WebP. Maximum 5 MB.
              </p>
            </div>
          </div>

          {/* INNER EDIT PANEL */}
          <div className="relative z-10 px-5 pb-5 md:px-7 md:pb-7">
            <div
              className="
                relative overflow-hidden rounded-[28px]
                border border-[rgba(255,255,255,0.78)]
                bg-[rgba(255,255,255,0.48)]
                p-6
                shadow-[0_20px_45px_rgba(91,69,151,0.10),inset_0_2px_3px_rgba(255,255,255,0.90)]
                backdrop-blur-2xl
                md:p-7
              "
            >
              <div className="pointer-events-none absolute left-10 top-0 h-28 w-80 rounded-full bg-[rgba(255,255,255,0.60)] blur-3xl" />

              <div className="relative z-10">
                <h2 className="text-[19px] font-extrabold tracking-[-0.02em] text-[rgba(36,29,55,0.94)]">
                  Personal Information
                </h2>

                <p className="mt-1 text-[12px] text-[rgba(104,93,128,0.68)]">
                  Update your account information
                </p>

                {/* Fields */}
                <div className="mt-6 grid gap-5 md:grid-cols-2">

                  {/* Full Name */}
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(101,95,124,0.70)]">
                      Full Name
                    </span>

                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          full_name: e.target.value,
                        })
                      }
                      className="
                        w-full rounded-[16px]
                        border border-[rgba(149,126,215,0.16)]
                        bg-[rgba(255,255,255,0.66)]
                        px-4 py-3
                        text-[14px] font-medium
                        text-[rgba(36,30,52,0.94)]
                        shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)]
                        outline-none
                        transition-all duration-300
                        focus:border-[rgba(137,80,247,0.38)]
                        focus:bg-[rgba(255,255,255,0.92)]
                        focus:ring-4
                        focus:ring-[rgba(137,80,247,0.08)]
                      "
                    />
                  </label>

                  {/* Email */}
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(101,95,124,0.70)]">
                      Email Address
                    </span>

                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="
                        w-full cursor-not-allowed rounded-[16px]
                        border border-[rgba(150,140,180,0.12)]
                        bg-[rgba(241,240,247,0.62)]
                        px-4 py-3
                        text-[14px]
                        text-[rgba(102,96,120,0.65)]
                      "
                    />
                  </label>

                  {/* Phone */}
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(101,95,124,0.70)]">
                      Phone
                    </span>

                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          phone: e.target.value,
                        })
                      }
                      className="
                        w-full rounded-[16px]
                        border border-[rgba(93,201,151,0.17)]
                        bg-[rgba(246,253,249,0.64)]
                        px-4 py-3
                        text-[14px] font-medium
                        text-[rgba(36,30,52,0.94)]
                        outline-none
                        transition-all duration-300
                        focus:border-[rgba(55,181,120,0.38)]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-[rgba(55,181,120,0.07)]
                      "
                    />
                  </label>

                  {/* Job Title */}
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(101,95,124,0.70)]">
                      Job Title
                    </span>

                    <input
                      type="text"
                      value={profile.job_title}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          job_title: e.target.value,
                        })
                      }
                      className="
                        w-full rounded-[16px]
                        border border-[rgba(241,167,101,0.18)]
                        bg-[rgba(255,250,244,0.66)]
                        px-4 py-3
                        text-[14px] font-medium
                        text-[rgba(36,30,52,0.94)]
                        outline-none
                        transition-all duration-300
                        focus:border-[rgba(232,135,66,0.38)]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-[rgba(232,135,66,0.07)]
                      "
                    />
                  </label>
                </div>

                {/* Bio */}
                <label className="mt-5 block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(101,95,124,0.70)]">
                    Bio
                  </span>

                  <textarea
                    rows={5}
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        bio: e.target.value,
                      })
                    }
                    className="
                      w-full resize-none rounded-[18px]
                      border border-[rgba(181,135,231,0.17)]
                      bg-[rgba(251,246,255,0.66)]
                      px-4 py-3
                      text-[14px] leading-6
                      text-[rgba(36,30,52,0.94)]
                      outline-none
                      transition-all duration-300
                      focus:border-[rgba(153,91,224,0.38)]
                      focus:bg-white
                      focus:ring-4
                      focus:ring-[rgba(153,91,224,0.07)]
                    "
                  />
                </label>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="
                      inline-flex min-w-[150px] items-center justify-center
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
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
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