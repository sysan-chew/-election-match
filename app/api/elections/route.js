import { createClient } from “@supabase/supabase-js”;

export async function GET() {
const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_ANON_KEY
);

const { data, error } = await supabase
.from(“elections”)
.select(
“id, prefecture, municipality, election_type, election_date, name”
)
.order(“election_date”, { ascending: true });

if (error) {
console.error(“Supabase elections error:”, error);

return Response.json(
  {
    elections: [],
    error: error.message,
  },
  { status: 500 }
);

}

return Response.json({
elections: data || [],
});
}
