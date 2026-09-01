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
  });

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

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
  <div className="profile-page-enter min-h-[calc(100vh-60px)] bg-[rgba(247,248,252,1)] px-5 py-8 md:px-8 md:py-10">
    <div className="mx-auto max-w-5xl">

      {/* Error */}
      {error && (
        <div className="mx-auto mb-5 max-w-4xl rounded-2xl border border-[rgba(239,68,68,0.16)] bg-[rgba(255,245,245,0.92)] px-4 py-3 text-sm text-red-600 shadow-sm">
          {error}
        </div>
      )}

      <div className="mx-auto mb-4 max-w-4xl">
 <h1 className="profile-title-enter text-[22px] font-extrabold tracking-[-0.02em] text-[rgba(28,24,46,0.95)]">
  My Profile
</h1>
</div>

      {/* 3D PROFILE CARD */}
      <div className="profile-card-enter relative mx-auto max-w-4xl [perspective:1400px]">

        {/* Card Depth */}
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

                    <p className="mt-3 whitespace-pre-wrap text-[14px] leading-7 text-[rgba(65,60,82,0.84)]">
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