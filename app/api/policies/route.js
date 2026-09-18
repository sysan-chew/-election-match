import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from("policies")
    .select("id, election_id, title, description, category, created_at")
    .order("id", { ascending: true });

  if (error) {
    console.error("Supabase policies error:", error);

    return Response.json(
      {
        policies: [],
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
      { status: 500 }
    );
  }

  return Response.json({
    policies: data || [],
  });
}
