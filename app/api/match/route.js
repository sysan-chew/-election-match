import data from "../../../data/elections.json";

export async function POST(request) {
  try {
    const body = await request.json();

    const election = data.elections.find(
      (item) => item.id === body.electionId
    );

    if (!election) {
      return Response.json(
        {
          error: "選挙が見つかりません"
        },
        {
          status: 404
        }
      );
    }

    const answers = body.answers || {};

    const results = election.candidates
      .map((candidate) => {
        let total = 0;
        let count = 0;

        Object.entries(answers).forEach(
          ([policy, userValue]) => {
            const candidateValue = Number(
              candidate.policies?.[policy] ?? 3
            );

            const userScore = Number(userValue);

            const difference = Math.abs(
              candidateValue - userScore
            );

            const similarity = 1 - difference / 4;

            total += similarity;
            count++;
          }
        );

        const score =
          count > 0
            ? Math.round((total / count) * 100)
            : 0;

        return {
          ...candidate,
          score
        };
      })
      .sort((a, b) => b.score - a.score);

    return Response.json({
      results
    });
  } catch (error) {
    return Response.json(
      {
        error: "データ処理中にエラーが発生しました"
      },
      {
        status: 500
      }
    );
  }
}
