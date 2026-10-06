import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("candidate_policies")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("candidate_policies error:", error);

      return Response.json(
        {
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
  } catch (error) {
    console.error("Unexpected error:", error);

    return Response.json(
      {
        error:
          error.message ||
          "候補者政策データの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
