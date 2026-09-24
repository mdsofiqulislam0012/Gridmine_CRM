import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase server environment variables.");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const accessToken = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }

  const { data: requesterProfile, error: profileError } =
  await supabaseAdmin
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

if (profileError) {
  console.error("Invite requester profile error:", profileError);

  return NextResponse.json(
    { error: "Unable to verify user role" },
    { status: 403 }
  );
}

if (!requesterProfile) {
  console.error("No profile found for auth user:", user.id);

  return NextResponse.json(
    { error: "No CRM profile found for your account" },
    { status: 403 }
  );
}

const canInvite =
  requesterProfile.role === "admin" ||
  requesterProfile.role === "sub_admin";

if (!canInvite) {
  return NextResponse.json(
    { error: "You do not have permission to invite team members" },
    { status: 403 }
  );
}

const body = await request.json();
const fullName =
  typeof body.fullName === "string"
    ? body.fullName.trim()
    : "";
const email =
  typeof body.email === "string"
    ? body.email.trim().toLowerCase()
    : "";

const role =
  typeof body.role === "string"
    ? body.role
    : "";

    if (!fullName) {
  return NextResponse.json(
    { error: "Full name is required" },
    { status: 400 }
  );
}

if (!email) {
  return NextResponse.json(
    { error: "Email address is required" },
    { status: 400 }
  );
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(email)) {
  return NextResponse.json(
    { error: "Invalid email address" },
    { status: 400 }
  );
}

const allowedRoles = ["admin", "sub_admin", "user"];

if (!allowedRoles.includes(role)) {
  return NextResponse.json(
    { error: "Invalid team member role" },
    { status: 400 }
  );
}

if (
  requesterProfile.role === "sub_admin" &&
  role !== "user"
) {
  return NextResponse.json(
    {
      error: "Sub Admins can only invite Employees",
    },
    { status: 403 }
  );
}

const { data: existingMember } = await supabaseAdmin
  .from("profiles")
  .select("id")
  .eq("email", email)
  .maybeSingle();

if (existingMember) {
  return NextResponse.json(
    { error: "This email is already a team member" },
    { status: 409 }
  );
}

  const { data: inviteData, error: inviteError } =
  await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
  data: {
    full_name: fullName,
    role,
  },
});

if (inviteError) {
  return NextResponse.json(
    { error: inviteError.message },
    { status: 400 }
  );
}
const invitedUser = inviteData.user;

if (!invitedUser) {
  return NextResponse.json(
    { error: "Invitation was sent but invited user could not be created" },
    { status: 500 }
  );
}

const { error: profileUpsertError } = await supabaseAdmin
  .from("profiles")
  .upsert(
   {
  id: invitedUser.id,
  full_name: fullName,
  email,
  role,
  last_seen_at: null,
},
    {
      onConflict: "id",
    }
  );

if (profileUpsertError) {
  return NextResponse.json(
    { error: profileUpsertError.message },
    { status: 500 }
  );
}

return NextResponse.json({
  message: "Invitation sent successfully",
  invitedUserId: invitedUser.id,
});
}