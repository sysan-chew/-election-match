import data from "../../../data/elections.json";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area");

  const elections = area
    ? data.elections.filter(
        (election) => election.areaId === area
      )
    : [];

  return Response.json({
    areas: data.areas,
    elections
  });
}
