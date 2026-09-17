"use client";

import { useEffect, useMemo, useState } from "react";

const POLICY_CATEGORIES = [
  ["economy", "経済・雇用"],
  ["tax", "税・税負担"],
  ["childcare", "子育て・教育"],
  ["welfare", "社会保障・福祉"],
  ["disaster", "防災・インフラ"],
  ["environment", "環境・脱炭素"],
  ["reform", "行政改革"],
  ["security", "治安・安全"],
];

function getCandidateName(candidate) {
  return (
    candidate?.name ||
    candidate?.candidateName ||
    candidate?.candidate_name ||
    "候補者名未登録"
  );
}

function getParty(candidate) {
  return (
    candidate?.party ||
    candidate?.partyName ||
    candidate?.party_name ||
    "所属情報未登録"
  );
}

function getPolicy(candidate, key) {
  const policies =
    candidate?.policies ||
    candidate?.policy ||
    candidate?.policyData ||
    {};

  if (typeof policies === "string") {
    return policies;
  }

  return (
    policies?.[key] ||
    candidate?.[key] ||
    candidate?.[`policy_${key}`] ||
    "公表情報なし"
  );
}

export default function Home() {
  const [areas, setAreas] = useState([]);
  const [elections, setElections] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const [area, setArea] = useState("");
  const [election, setElection] = useState("");

  const [selectedCandidates, setSelectedCandidates] = useState([]);

  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const [error, setError] = useState("");

  // 地域一覧
  useEffect(() => {
    async function loadAreas() {
      try {
        setLoadingAreas(true);

        const response = await fetch("/api/elections");

        if (!response.ok) {
          throw new Error("地域情報を取得できませんでした");
        }

        const data = await response.json();

        setAreas(data?.areas || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingAreas(false);
      }
    }

    loadAreas();
  }, []);

  // 選挙一覧
  useEffect(() => {
    async function loadElections() {
      if (!area) {
        setElections([]);
        setElection("");
        return;
      }

      try {
        setError("");

        const response = await fetch(
          `/api/elections?area=${encodeURIComponent(area)}`
        );

        if (!response.ok) {
          throw new Error("選挙情報を取得できませんでした");
        }

        const data = await response.json();

        setElections(data?.elections || []);
        setElection("");
        setCandidates([]);
        setSelectedCandidates([]);
      } catch (err) {
        setError(err.message);
      }
    }

    loadElections();
  }, [area]);

  // 候補者一覧
  useEffect(() => {
    async function loadCandidates() {
      if (!election) {
        setCandidates([]);
        setSelectedCandidates([]);
        return;
      }

      try {
        setLoadingCandidates(true);
        setError("");

        const response = await fetch(
          `/api/candidates?electionId=${encodeURIComponent(election)}`
        );

        if (!response.ok) {
          throw new Error("候補者情報を取得できませんでした");
        }

        const data = await response.json();

        setCandidates(data?.candidates || []);
        setSelectedCandidates([]);
      } catch (err) {
        setCandidates([]);
        setError(
          "候補者データを取得できませんでした。Supabaseの候補者データとAPI設定を確認してください。"
        );
      } finally {
        setLoadingCandidates(false);
      }
    }

    loadCandidates();
  }, [election]);

  const selectedCandidateObjects = useMemo(() => {
    return candidates.filter((candidate) =>
      selectedCandidates.includes(String(candidate.id))
    );
  }, [candidates, selectedCandidates]);

  function toggleCandidate(candidateId) {
    const id = String(candidateId);

    setSelectedCandidates((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, id];
    });
  }

  return (
    <main className="page">
      <header className="hero">
        <div className="heroInner">
          <p className="label">ELECTION INFORMATION</p>

          <h1>尼崎市選挙比較</h1>

          <p className="lead">
            候補者が公表している政策や情報を、
            <br />
            利用者自身が確認・比較できる情報整理サイトです。
          </p>
        </div>
      </header>

      <section className="container">
        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <div className="card">
          <h2>① 地域を選択</h2>

          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="select"
            disabled={loadingAreas}
          >
            <option value="">
              {loadingAreas
                ? "読み込み中..."
                : "都道府県・地域を選択"}
            </option>

            {areas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="card">
          <h2>② 選挙を選択</h2>

          <select
            value={election}
            onChange={(e) => setElection(e.target.value)}
            className="select"
            disabled={!area}
          >
            <option value="">
              {area
                ? "選挙を選択してください"
                : "先に地域を選択してください"}
            </option>

            {elections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {election && (
          <div className="card">
            <div className="sectionHeader">
              <div>
                <h2>③ 比較する候補者を選択</h2>
                <p>
                  2〜3人を選択すると、政策を横並びで比較できます。
                </p>
              </div>

              <span className="count">
                {selectedCandidates.length}/3
              </span>
            </div>

            {loadingCandidates ? (
              <div className="loading">
                候補者を読み込んでいます…
              </div>
            ) : candidates.length === 0 ? (
              <div className="empty">
                候補者データがまだ登録されていません。
              </div>
            ) : (
              <div className="candidateList">
                {candidates.map((candidate) => {
                  const id = String(candidate.id);
                  const selected = selectedCandidates.includes(id);

                  return (
                    <button
                      type="button"
                      key={id}
                      className={`candidateButton ${
                        selected ? "selected" : ""
                      }`}
                      onClick={() => toggleCandidate(candidate.id)}
                    >
                      <span className="check">
                        {selected ? "✓" : ""}
                      </span>

                      <span>
                        <strong>
                          {getCandidateName(candidate)}
                        </strong>

                        <small>
                          {getParty(candidate)}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedCandidateObjects.length >= 2 && (
          <section className="card comparison">
            <div className="sectionHeader">
              <div>
                <h2>政策を比較</h2>
                <p>
                  各候補者が公表している情報を横並びで確認できます。
                </p>
              </div>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>政策分野</th>

                    {selectedCandidateObjects.map((candidate) => (
                      <th key={candidate.id}>
                        <strong>
                          {getCandidateName(candidate)}
                        </strong>

                        <small>
                          {getParty(candidate)}
                        </small>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {POLICY_CATEGORIES.map(([key, label]) => (
                    <tr key={key}>
                      <th>{label}</th>

                      {selectedCandidateObjects.map((candidate) => (
                        <td key={`${candidate.id}-${key}`}>
                          {getPolicy(candidate, key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sourceNote">
              <strong>情報について</strong>

              <p>
                このページでは、候補者等が公表した情報を整理して表示します。
                内容については各候補者の公式情報・選挙公報などの原資料を
                ご確認ください。
              </p>
            </div>
          </section>
        )}

        {selectedCandidateObjects.length === 1 && (
          <div className="notice">
            もう1人以上候補者を選択すると比較できます。
          </div>
        )}

        <section className="about card">
          <h2>このサイトについて</h2>

          <p>
            「尼崎市選挙比較」は、選挙に関する情報を利用者自身が
            確認・比較できるように整理することを目的としたサイトです。
          </p>

          <p>
            特定の候補者への投票を推奨するものではありません。
            政策の内容や出典を確認したうえで、ご自身で判断してください。
          </p>
        </section>

        <footer>
          <p>
            尼崎市選挙比較
          </p>

          <p>
            政策情報の出典・更新日時を確認できる設計を目指しています。
          </p>
        </footer>
      </section>
    </main>
  );
}
