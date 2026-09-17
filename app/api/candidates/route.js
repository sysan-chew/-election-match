import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("candidates")
    .select("id, name, party, profile, policy")
    .order("id");

  if (error) {
    console.error(error);

    return Response.json(
      {
        candidates: [],
        error: "候補者データの取得に失敗しました。",
      },
      { status: 500 }
    );
  }

  return Response.json({
    candidates: data || [],
  });
}
