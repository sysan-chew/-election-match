import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from("candidates")
    .select("*");

  if (error) {
    console.error("Supabase candidates error:", error);

    return Response.json(
      {
        candidates: [],
        error: error.message,
      },
      { status: 500 }
    );
  }

  return Response.json({
    candidates: data || [],
  });
}
