"use client";

import { useEffect, useState } from "react";

const QUESTIONS = [
  ["economy", "景気・雇用対策を重視する"],
  ["tax", "減税・税負担の軽減を重視する"],
  ["childcare", "子育て・教育への公的支出を増やす"],
  ["welfare", "社会保障・福祉を重視する"],
  ["disaster", "防災・インフラ整備を重視する"],
  ["environment", "環境・脱炭素政策を重視する"],
  ["reform", "行政改革・無駄の削減を重視する"],
  ["security", "治安・安全保障を重視する"]
];

export default function Home() {
  const [areas, setAreas] = useState([]);
  const [area, setArea] = useState("");
  const [elections, setElections] = useState([]);
  const [election, setElection] = useState("");
  const [answers, setAnswers] = useState(
    Object.fromEntries(QUESTIONS.map(([key]) => [key, 3]))
  );
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/elections")
      .then((res) => res.json())
      .then((data) => {
        setAreas(data.areas || []);
      });
  }, []);

  useEffect(() => {
    if (!area) {
      setElections([]);
      return;
    }

    fetch("/api/elections?area=" + encodeURIComponent(area))
      .then((res) => res.json())
      .then((data) => {
        setElections(data.elections || []);
      });
  }, [area]);

  async function matchCandidates() {
    if (!election) {
      alert("選挙を選択してください");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        electionId: election,
        answers
      })
    });

    const data = await response.json();

    setResults(data.results || []);
    setLoading(false);
  }

  return (
    <main className="wrap">
      <section className="hero">
        <h1>全国選挙比較</h1>

        <p className="muted">
          あなたの政策に対する考えと、
          候補者が公表している政策を比較します。
        </p>

        <div className="grid grid2">
          <select
            className="select"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            <option value="">都道府県・地域を選択</option>

            {areas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={election}
            onChange={(e) => setElection(e.target.value)}
            disabled={!area}
          >
            <option value="">選挙を選択</option>

            {elections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}（投票日 {item.voteDate}）
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="card">
        <h2>あなたの考え</h2>

        {QUESTIONS.map(([key, label]) => (
          <div className="policy" key={key}>
            <span>{label}</span>

            <select
              className="select"
              style={{ maxWidth: 220 }}
              value={answers[key]}
              onChange={(e) =>
                setAnswers({
                  ...answers,
                  [key]: Number(e.target.value)
                })
              }
            >
              <option value="1">全く重視しない</option>
              <option value="2">あまり重視しない</option>
              <option value="3">どちらともいえない</option>
              <option value="4">重視する</option>
              <option value="5">とても重視する</option>
            </select>
          </div>
        ))}

        <button
          className="btn"
          onClick={matchCandidates}
          disabled={loading}
        >
          {loading
            ? "計算中…"
            : "候補者との一致度を見る"}
        </button>
      </section>

      {results.length > 0 && (
        <section className="card">
          <h2>あなたとの一致度</h2>

          {results.map((candidate, index) => (
            <div
              className="card"
              style={{ marginTop: 12 }}
              key={candidate.id}
            >
              <div className="row">
                <span className="rank">
                  #{index + 1}
                </span>

                <div>
                  <h3 style={{ margin: "2px 0" }}>
                    {candidate.name}
                  </h3>

                  <span className="muted">
                    {candidate.party || "無所属"}
                  </span>
                </div>

                <span
                  className="score"
                  style={{ marginLeft: "auto" }}
                >
                  {candidate.score}%
                </span>
              </div>

              <div className="scale">
                <div
                  className="bar"
                  style={{
                    width: candidate.score + "%"
                  }}
                />
              </div>

              <p className="muted">
                候補者が公開した政策データとの一致度です。
              </p>
            </div>
          ))}
        </section>
      )}

      <p className="footer">
        このサービスは特定の候補者への投票を推奨するものではありません。
        政策情報の出典・更新日時を表示し、
        利用者自身が原典を確認できる設計を前提とします。
      </p>
    </main>
  );
}
