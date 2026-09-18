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
    console.error(error);

    return Response.json(
      {
        policies: [],
        error: "政策データの取得に失敗しました。",
      },
      { status: 500 }
    );
  }

  return Response.json({
    policies: data || [],
  });
}
