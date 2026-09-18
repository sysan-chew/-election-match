import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from("candidate_policies")
    .select(
      "id, candidate_id, policy_id, position, stance, source_url, created_at"
    )
    .order("id", { ascending: true });

  if (error) {
    console.error("Supabase candidate_policies error:", error);

    return Response.json(
      {
        candidatePolicies: [],
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
      { status: 500 }
    );
  }

  return Response.json({
    candidatePolicies: data || [],
  });
}
