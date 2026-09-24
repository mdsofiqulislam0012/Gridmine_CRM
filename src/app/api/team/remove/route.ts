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

export async function DELETE(request: Request) {
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

  if (requesterProfile.role !== "admin") {
    return NextResponse.json(
      { error: "Only Admins can remove team members" },
      { status: 403 }
    );
  }

  const body = await request.json();

const memberId =
  typeof body.memberId === "string"
    ? body.memberId
    : "";

if (!memberId) {
  return NextResponse.json(
    { error: "Member ID is required" },
    { status: 400 }
  );
}

if (memberId === user.id) {
  return NextResponse.json(
    { error: "You cannot remove your own account" },
    { status: 403 }
  );
}

  const { data: targetMember, error: targetError } =
  await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, role")
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

const { error: authDeleteError } =
  await supabaseAdmin.auth.admin.deleteUser(memberId);

if (authDeleteError) {
  return NextResponse.json(
    { error: authDeleteError.message },
    { status: 500 }
  );
}

const { error: profileDeleteError } =
  await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("id", memberId);

if (profileDeleteError) {
  return NextResponse.json(
    {
      error:
        "Authentication access was removed, but profile cleanup failed: " +
        profileDeleteError.message,
    },
    { status: 500 }
  );
}

return NextResponse.json({
  message: "Team member removed successfully",
  memberId,
});
}