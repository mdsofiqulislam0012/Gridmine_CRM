import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

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

export async function PATCH(request: Request) {
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
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

if (profileError || !requesterProfile) {
  return NextResponse.json(
    { error: "Unable to verify user role" },
    { status: 403 }
  );
}

const canManageTeam =
  requesterProfile.role === "admin" ||
  requesterProfile.role === "sub_admin";

if (!canManageTeam) {
return NextResponse.json(

{ error: "You do not have permission to change member roles" },

{ status: 403 }
);
}

  const body = await request.json();

const memberId =
  typeof body.memberId === "string"
    ? body.memberId
    : "";

const role =
  typeof body.role === "string"
    ? body.role
    : "";

if (!memberId) {
  return NextResponse.json(
    { error: "Member ID is required" },
    { status: 400 }
  );
}
if (memberId === user.id) {
  return NextResponse.json(
    { error: "You cannot change your own role" },
    { status: 403 }
  );
}

const allowedRoles = ["admin", "sub_admin", "user"];

if (!allowedRoles.includes(role)) {
  return NextResponse.json(
    { error: "Invalid member role" },
    { status: 400 }
  );
}

const { data: targetMember, error: targetError } =
  await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", memberId)
    .maybeSingle();

if (targetError) {
  return NextResponse.json(
    { error: "Unable to load team member" },
    { status: 500 }
  );
}

if (!targetMember) {
  return NextResponse.json(
    { error: "Team member not found" },
    { status: 404 }
  );
}  

if (
  requesterProfile.role === "sub_admin" &&
  (targetMember.role === "admin" || targetMember.role === "sub_admin")
) {
  return NextResponse.json(
    { error: "Sub Admins cannot manage Admin or Sub Admin roles" },
    { status: 403 }
  );
}

if (
  requesterProfile.role === "sub_admin" &&
  role !== "user"
) {
  return NextResponse.json(
    { error: "Sub Admins can only manage Employees" },
    { status: 403 }
  );
}

const { error: updateProfileError } = await supabaseAdmin
  .from("profiles")
  .update({
    role,
  })
  .eq("id", memberId);

if (updateProfileError) {
  return NextResponse.json(
    { error: updateProfileError.message },
    { status: 500 }
  );
}

const { error: updateAuthError } =
  await supabaseAdmin.auth.admin.updateUserById(
    memberId,
    {
      user_metadata: {
        role,
      },
    }
  );

if (updateAuthError) {
  return NextResponse.json(
    { error: updateAuthError.message },
    { status: 500 }
  );
}

  return NextResponse.json({
    message: "Authenticated role update API ready",
    userId: user.id,
  });
}