import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate caller is admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: uerr } = await userClient.auth.getUser();
    if (uerr || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: rolesData } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const roles = (rolesData ?? []).map(r => r.role);
    if (!roles.includes("super_admin") && !roles.includes("manager")) {
      return json({ error: "Forbidden: admin only" }, 403);
    }

    const body = await req.json();
    const { email, full_name, specialty } = body ?? {};
    if (!email || !full_name) return json({ error: "email and full_name required" }, 400);

    // Invite via email (Supabase sends the invite email using default or configured templates)
    const redirectTo = (body.redirect_to as string) || `${new URL(req.url).origin.replace("supabase.co", "lovable.app")}/auth`;

    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role: "technician" },
      redirectTo,
    });

    if (inviteErr || !invited?.user) {
      // If already exists, look up user
      const { data: existing } = await admin.auth.admin.listUsers();
      const found = existing?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!found) return json({ error: inviteErr?.message || "Invite failed" }, 400);
      await ensureTechnician(admin, found.id, full_name, specialty, user.id);
      return json({ ok: true, user_id: found.id, reused: true });
    }

    await ensureTechnician(admin, invited.user.id, full_name, specialty, user.id);
    return json({ ok: true, user_id: invited.user.id });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

async function ensureTechnician(admin: any, userId: string, fullName: string, specialty: string | undefined, invitedBy: string) {
  await admin.from("profiles").upsert({ id: userId, full_name: fullName, approved: true }, { onConflict: "id" });
  // Remove default 'client' role, add 'technician'
  await admin.from("user_roles").delete().eq("user_id", userId).eq("role", "client");
  await admin.from("user_roles").upsert({ user_id: userId, role: "technician" }, { onConflict: "user_id,role" });
  await admin.from("technician_profiles").upsert({
    user_id: userId,
    specialty: specialty || "general",
    invited_by: invitedBy,
    active: true,
  }, { onConflict: "user_id" });
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
