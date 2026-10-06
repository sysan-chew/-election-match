"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [candidates, setCandidates] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [candidatePolicies, setCandidatePolicies] = useState([]);
  const [elections, setElections] = useState([]);

  const [selectedPrefecture, setSelectedPrefecture] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedElection, setSelectedElection] = useState("");

  const [search, setSearch] = useState("");
  const [selectedParty, setSelectedParty] = useState("すべて");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // 政策診断
  // =========================
  const [diagnosisMode, setDiagnosisMode] = useState(false);
  const [diagnosisFinished, setDiagnosisFinished] = useState(false);
  const [answers, setAnswers] = useState({});

  // =========================
  // データ取得
  // =========================
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          candidatesResponse,
          policiesResponse,
          candidatePoliciesResponse,
          electionsResponse,
        ] = await Promise.all([
          fetch("/api/candidates"),
          fetch("/api/policies"),
          fetch("/api/candidate-policies"),
          fetch("/api/elections"),
        ]);

        if (!candidatesResponse.ok) {
          throw new Error("候補者データを取得できませんでした");
        }

        if (!policiesResponse.ok) {
          throw new Error("政策データを取得できませんでした");
        }

        if (!candidatePoliciesResponse.ok) {
          throw new Error(
            "候補者政策データを取得できませんでした"
          );
        }

        if (!electionsResponse.ok) {
          throw new Error("選挙データを取得できませんでした");
        }

        const candidatesData =
          await candidatesResponse.json();

        const policiesData =
          await policiesResponse.json();

        const candidatePoliciesData =
          await candidatePoliciesResponse.json();

        const electionsData =
          await electionsResponse.json();

        setCandidates(
          candidatesData.candidates || []
        );

        setPolicies(
          policiesData.policies || []
        );

        setCandidatePolicies(
          candidatePoliciesData.candidatePolicies || []
        );

        setElections(
          electionsData.elections || []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "データの取得中にエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // =========================
  // 都道府県一覧
  // =========================
  const prefectures = useMemo(() => {
    return [
      ...new Set(
        elections
          .map((election) => election.prefecture)
          .filter(Boolean)
      ),
    ];
  }, [elections]);

  // =========================
  // 市区町村一覧
  // =========================
  const municipalities = useMemo(() => {
    return [
      ...new Set(
        elections
          .filter(
            (election) =>
              !selectedPrefecture ||
              election.prefecture === selectedPrefecture
          )
          .map((election) => election.municipality)
          .filter(Boolean)
      ),
    ];
  }, [elections, selectedPrefecture]);

  // =========================
  // 選挙一覧
  // =========================
  const filteredElections = useMemo(() => {
    return elections.filter((election) => {
      const prefectureMatch =
        !selectedPrefecture ||
        election.prefecture === selectedPrefecture;

      const municipalityMatch =
        !selectedMunicipality ||
        election.municipality === selectedMunicipality;

      return prefectureMatch && municipalityMatch;
    });
  }, [
    elections,
    selectedPrefecture,
    selectedMunicipality,
  ]);

  // =========================
  // 選択された選挙
  // =========================
  const selectedElectionData = useMemo(() => {
    if (!selectedElection) {
      return null;
    }

    return (
      elections.find(
        (election) =>
          String(election.id) ===
          String(selectedElection)
      ) || null
    );
  }, [elections, selectedElection]);

  // =========================
  // 政党一覧
  // =========================
  const parties = useMemo(() => {
    const partySet = new Set();

    candidates.forEach((candidate) => {
      if (candidate.party) {
        partySet.add(candidate.party);
      }
    });

    return [
      "すべて",
      ...Array.from(partySet),
    ];
  }, [candidates]);

  // =========================
  // 候補者の政策
  // =========================
  function getPoliciesForCandidate(candidateId) {
    const links = candidatePolicies.filter(
      (item) =>
        Number(item.candidate_id) ===
        Number(candidateId)
    );

    return links
      .map((link) => {
        const policy = policies.find(
          (item) =>
            Number(item.id) ===
            Number(link.policy_id)
        );

        if (!policy) {
          return null;
        }

        return {
          ...policy,
          position: link.position,
          stance: link.stance,
          source_url: link.source_url,
        };
      })
      .filter(Boolean);
  }

  // =========================
  // 候補者を選挙で絞り込み
  // =========================
  const electionCandidates = useMemo(() => {
    if (!selectedElection) {
      return candidates;
    }

    return candidates.filter(
      (candidate) =>
        String(candidate.election_id) ===
        String(selectedElection)
    );
  }, [candidates, selectedElection]);

  // =========================
  // 検索・政党で絞り込み
  // =========================
  const filteredCandidates = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return electionCandidates.filter(
      (candidate) => {
        const matchesSearch =
          keyword === "" ||
          String(candidate.name || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.party || "")
            .toLowerCase()
            .includes(keyword) ||
          String(candidate.profile || "")
            .toLowerCase()
            .includes(keyword);

        const matchesParty =
          selectedParty === "すべて" ||
          candidate.party === selectedParty;

        return (
          matchesSearch &&
          matchesParty
        );
      }
    );
  }, [
    electionCandidates,
    search,
    selectedParty,
  ]);

  // =========================
  // 現在の選挙の政策
  // =========================
  const diagnosisPolicies = useMemo(() => {
    if (!selectedElection) {
      return [];
    }

    return policies.filter(
      (policy) =>
        String(policy.election_id) ===
        String(selectedElection)
    );
  }, [policies, selectedElection]);

  // =========================
  // 政策診断対象候補者
  // =========================
  const diagnosisCandidates = useMemo(() => {
    if (!selectedElection) {
      return [];
    }

    return candidates.filter(
      (candidate) =>
        String(candidate.election_id) ===
        String(selectedElection)
    );
  }, [candidates, selectedElection]);

  // =========================
  // 候補者の立場を数値化
  // =========================
  function convertPositionToScore(position) {
    const text = String(position || "");

    if (
      text.includes("やや賛成")
    ) {
      return 1;
    }

    if (
      text.includes("賛成")
    ) {
      return 2;
    }

    if (
      text.includes("やや反対")
    ) {
      return -1;
    }

    if (
      text.includes("反対")
    ) {
      return -2;
    }

    if (
      text.includes("中立") ||
      text.includes("どちらとも")
    ) {
      return 0;
    }

    return null;
  }

  // =========================
  // 一致率計算
  // =========================
  const diagnosisResults = useMemo(() => {
    if (
      !diagnosisFinished ||
      diagnosisCandidates.length === 0
    ) {
      return [];
    }

    const results = diagnosisCandidates.map(
      (candidate) => {
        const candidatePolicyList =
          getPoliciesForCandidate(
            candidate.id
          );

        let totalScore = 0;
        let matchedCount = 0;

        diagnosisPolicies.forEach((policy) => {
          const userAnswer =
            answers[policy.id];

          if (
            userAnswer === undefined ||
            userAnswer === null
          ) {
            return;
          }

          const candidatePolicy =
            candidatePolicyList.find(
              (item) =>
                Number(item.id) ===
                Number(policy.id)
            );

          if (!candidatePolicy) {
            return;
          }

          const candidatePosition =
            convertPositionToScore(
              candidatePolicy.position
            );

          if (
            candidatePosition === null
          ) {
            return;
          }

          const difference = Math.abs(
            Number(userAnswer) -
              candidatePosition
          );

          const matchScore =
            Math.max(
              0,
              100 - difference * 25
            );

          totalScore += matchScore;
          matchedCount++;
        });

        const matchRate =
          matchedCount > 0
            ? Math.round(
                totalScore /
                  matchedCount
              )
            : null;

        return {
          ...candidate,
          matchRate,
          matchedCount,
        };
      }
    );

    return results
      .filter(
        (candidate) =>
          candidate.matchRate !== null
      )
      .sort(
        (a, b) =>
          b.matchRate - a.matchRate
      );
  }, [
    diagnosisFinished,
    diagnosisCandidates,
    diagnosisPolicies,
    answers,
  ]);

  // =========================
  // 都道府県変更
  // =========================
  function handlePrefectureChange(value) {
    setSelectedPrefecture(value);
    setSelectedMunicipality("");
    setSelectedElection("");
    setDiagnosisMode(false);
    setDiagnosisFinished(false);
    setAnswers({});
  }

  // =========================
  // 市区町村変更
  // =========================
  function handleMunicipalityChange(value) {
    setSelectedMunicipality(value);
    setSelectedElection("");
    setDiagnosisMode(false);
    setDiagnosisFinished(false);
    setAnswers({});
  }

  // =========================
  // 選挙変更
  // =========================
  function handleElectionChange(value) {
    setSelectedElection(value);
    setDiagnosisMode(false);
    setDiagnosisFinished(false);
    setAnswers({});
    setSearch("");
    setSelectedParty("すべて");
  }

  // =========================
  // 診断開始
  // =========================
  function startDiagnosis() {
    setAnswers({});
    setDiagnosisFinished(false);
    setDiagnosisMode(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================
  // 回答
  // =========================
  function handleAnswer(policyId, value) {
    setAnswers((current) => ({
      ...current,
      [policyId]: Number(value),
    }));
  }

  // =========================
  // 診断完了
  // =========================
  function finishDiagnosis() {
    const unanswered =
      diagnosisPolicies.filter(
        (policy) =>
          answers[policy.id] === undefined
      );

    if (unanswered.length > 0) {
      alert(
        `まだ${unanswered.length}問回答していません。`
      );
      return;
    }

    setDiagnosisFinished(true);
    setDiagnosisMode(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================
  // 診断をやり直す
  // =========================
  function restartDiagnosis() {
    setAnswers({});
    setDiagnosisFinished(false);
    setDiagnosisMode(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#111827",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* =========================
          ヘッダー
      ========================= */}
      <header
        style={{
          background: "#ffffff",
          borderBottom:
            "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "28px 16px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: 700,
            }}
          >
            全国候補者マッチング
          </h1>

          <p
            style={{
              marginTop: "12px",
              marginBottom: 0,
              color: "#4b5563",
              lineHeight: 1.8,
            }}
          >
            全国の選挙・候補者・政策に関する
            公表情報を確認・比較し、
            自分の考えとの一致度を確認できる
            情報整理サイトです。
          </p>
        </div>
      </header>

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "24px 16px 60px",
        }}
      >
        {/* =========================
            選挙選択
        ========================= */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: "20px",
            }}
          >
            選挙を選ぶ
          </h2>

          <p
            style={{
              color: "#6b7280",
              lineHeight: 1.7,
            }}
          >
            都道府県・市区町村・選挙を選択すると、
            その選挙の候補者を表示できます。
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <select
              value={selectedPrefecture}
              onChange={(e) =>
                handlePrefectureChange(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#ffffff",
                fontSize: "15px",
              }}
            >
              <option value="">
                都道府県を選択
              </option>

              {prefectures.map(
                (prefecture) => (
                  <option
                    key={prefecture}
                    value={prefecture}
                  >
                    {prefecture}
                  </option>
                )
              )}
            </select>

            <select
              value={selectedMunicipality}
              onChange={(e) =>
                handleMunicipalityChange(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#ffffff",
                fontSize: "15px",
              }}
              disabled={!selectedPrefecture}
            >
              <option value="">
                市区町村を選択
              </option>

              {municipalities.map(
                (municipality) => (
                  <option
                    key={municipality}
                    value={municipality}
                  >
                    {municipality}
                  </option>
                )
              )}
            </select>

            <select
              value={selectedElection}
              onChange={(e) =>
                handleElectionChange(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#ffffff",
                fontSize: "15px",
              }}
              disabled={
                filteredElections.length === 0
              }
            >
              <option value="">
                選挙を選択
              </option>

              {filteredElections.map(
                (election) => (
                  <option
                    key={election.id}
                    value={election.id}
                  >
                    {election.name}
                  </option>
                )
              )}
            </select>
          </div>

          {selectedElectionData && (
            <div
              style={{
                marginTop: "18px",
                padding: "16px",
                borderRadius: "12px",
                background: "#f9fafb",
                border:
                  "1px solid #e5e7eb",
              }}
            >
              <strong>
                {selectedElectionData.name}
              </strong>

              <p
                style={{
                  marginBottom: 0,
                  marginTop: "6px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                {
                  selectedElectionData.prefecture
                }{" "}
                {
                  selectedElectionData.municipality
                }
              </p>
            </div>
          )}
        </section>

        {/* =========================
            政策診断
        ========================= */}
        {selectedElection &&
          !loading &&
          !error &&
          diagnosisPolicies.length > 0 &&
          !diagnosisMode &&
          !diagnosisFinished && (
            <section
              style={{
                background: "#ffffff",
                border:
                  "2px solid #2563eb",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  fontSize: "23px",
                }}
              >
                自分の考えと候補者の政策を比較する
              </h2>

              <p
                style={{
                  color: "#4b5563",
                  lineHeight: 1.8,
                }}
              >
                {selectedElectionData?.name}
                に登録されている政策について回答すると、
                あなたの考えと候補者の公表政策が
                どのくらい一致しているかを確認できます。
              </p>

              <p
                style={{
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                全{diagnosisPolicies.length}
                問・5段階で回答します。
              </p>

              <button
                onClick={startDiagnosis}
                style={{
                  width: "100%",
                  padding: "15px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                政策診断を始める
              </button>
            </section>
          )}

        {/* =========================
            政策診断画面
        ========================= */}
        {diagnosisMode &&
          selectedElection &&
          !loading &&
          !error && (
            <section
              style={{
                background: "#ffffff",
                border:
                  "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  fontSize: "24px",
                }}
              >
                政策診断
              </h2>

              <p
                style={{
                  color: "#6b7280",
                  lineHeight: 1.7,
                }}
              >
                あなたの考えに最も近いものを
                選んでください。
              </p>

              <div
                style={{
                  display: "grid",
                  gap: "18px",
                  marginTop: "22px",
                }}
              >
                {diagnosisPolicies.map(
                  (policy, index) => (
                    <div
                      key={policy.id}
                      style={{
                        padding: "18px",
                        borderRadius: "14px",
                        background:
                          "#f9fafb",
                        border:
                          "1px solid #e5e7eb",
                      }}
                    >
                      <p
                        style={{
                          marginTop: 0,
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        Q{index + 1}
                      </p>

                      <h3
                        style={{
                          marginTop: "4px",
                          marginBottom: "10px",
                          fontSize: "18px",
                        }}
                      >
                        {policy.title ||
                          "政策"}
                      </h3>

                      {policy.category && (
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                          }}
                        >
                          分野：
                          {
                            policy.category
                          }
                        </p>
                      )}

                      <p
                        style={{
                          lineHeight: 1.8,
                        }}
                      >
                        {policy.description ||
                          "この政策について、あなたの考えを選択してください。"}
                      </p>

                      <div
                        style={{
                          display: "grid",
                          gap: "8px",
                          marginTop: "16px",
                        }}
                      >
                        {[
                          {
                            value: 2,
                            label: "賛成",
                          },
                          {
                            value: 1,
                            label: "やや賛成",
                          },
                          {
                            value: 0,
                            label:
                              "どちらともいえない",
                          },
                          {
                            value: -1,
                            label: "やや反対",
                          },
                          {
                            value: -2,
                            label: "反対",
                          },
                        ].map((option) => {
                          const checked =
                            answers[
                              policy.id
                            ] ===
                            option.value;

                          return (
                            <button
                              key={
                                option.value
                              }
                              onClick={() =>
                                handleAnswer(
                                  policy.id,
                                  option.value
                                )
                              }
                              style={{
                                padding:
                                  "13px",
                                borderRadius:
                                  "10px",
                                border: checked
                                  ? "2px solid #2563eb"
                                  : "1px solid #d1d5db",
                                background:
                                  checked
                                    ? "#eff6ff"
                                    : "#ffffff",
                                color:
                                  "#111827",
                                textAlign:
                                  "left",
                                fontSize:
                                  "15px",
                                cursor:
                                  "pointer",
                                fontWeight:
                                  checked
                                    ? 700
                                    : 400,
                              }}
                            >
                              {checked
                                ? "✓ "
                                : ""}
                              {
                                option.label
                              }
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>

              <button
                onClick={
                  finishDiagnosis
                }
                style={{
                  width: "100%",
                  marginTop: "24px",
                  padding: "15px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#111827",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                診断結果を見る
              </button>
            </section>
          )}

        {/* =========================
            診断結果
        ========================= */}
        {diagnosis
