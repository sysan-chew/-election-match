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
          throw new Error(
            "候補者データを取得できませんでした"
          );
        }

        if (!policiesResponse.ok) {
          throw new Error(
            "政策データを取得できませんでした"
          );
        }

        if (!candidatePoliciesResponse.ok) {
          throw new Error(
            "候補者政策データを取得できませんでした"
          );
        }

        if (!electionsResponse.ok) {
          throw new Error(
            "選挙データを取得できませんでした"
          );
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
          .map(
            (election) =>
              election.municipality
          )
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

      return (
        prefectureMatch &&
        municipalityMatch
      );
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
  function getPoliciesForCandidate(
    candidateId
  ) {
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
  function convertPositionToScore(
    position
  ) {
    const text = String(position || "");

    if (text.includes("やや賛成")) {
      return 1;
    }

    if (text.includes("賛成")) {
      return 2;
    }

    if (text.includes("やや反対")) {
      return -1;
    }

    if (text.includes("反対")) {
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

    const results =
      diagnosisCandidates.map(
        (candidate) => {
          const candidatePolicyList =
            getPoliciesForCandidate(
              candidate.id
            );

          let totalScore = 0;
          let matchedCount = 0;

          const matchedPolicies = [];
          const closePolicies = [];
          const differentPolicies = [];

          diagnosisPolicies.forEach(
            (policy) => {
              const userAnswer =
                answers[policy.id];

              if (
                userAnswer ===
                  undefined ||
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

              const difference =
                Math.abs(
                  Number(userAnswer) -
                    candidatePosition
                );

              const matchScore =
                Math.max(
                  0,
                  100 -
                    difference * 25
                );

              totalScore +=
                matchScore;

              matchedCount++;

              const answerLabels = {
                2: "賛成",
                1: "やや賛成",
                0: "どちらともいえない",
                "-1": "やや反対",
                "-2": "反対",
              };

              const policyResult = {
                id: policy.id,
                title:
                  policy.title ||
                  "政策名未登録",
                category:
                  policy.category || "",
                userAnswer:
                  answerLabels[
                    userAnswer
                  ],
                candidateAnswer:
                  candidatePolicy.position ||
                  "立場不明",
                matchScore,
              };

              if (difference === 0) {
                matchedPolicies.push(
                  policyResult
                );
              } else if (
                difference === 1
              ) {
                closePolicies.push(
                  policyResult
                );
              } else {
                differentPolicies.push(
                  policyResult
                );
              }
            }
          );

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
            matchedPolicies,
            closePolicies,
            differentPolicies,
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
          b.matchRate -
          a.matchRate
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
  function handlePrefectureChange(
    value
  ) {
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
  function handleMunicipalityChange(
    value
  ) {
    setSelectedMunicipality(value);
    setSelectedElection("");
    setDiagnosisMode(false);
    setDiagnosisFinished(false);
    setAnswers({});
  }

  // =========================
  // 選挙変更
  // =========================
  function handleElectionChange(
    value
  ) {
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
  function handleAnswer(
    policyId,
    value
  ) {
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
          answers[policy.id] ===
          undefined
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
            border:
              "1px solid #e5e7eb",
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
              disabled={
                !selectedPrefecture
              }
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
                filteredElections.length ===
                0
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
                {
                  selectedElectionData.name
                }
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
            政策診断開始
        ========================= */}
        {selectedElection &&
          !loading &&
          !error &&
          diagnosisPolicies.length >
            0 &&
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
                {
                  selectedElectionData?.name
                }
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
                全
                {
                  diagnosisPolicies.length
                }
                問・5段階で回答します。
              </p>

              <button
                onClick={
                  startDiagnosis
                }
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
                        borderRadius:
                          "14px",
                        background:
                          "#f9fafb",
                        border:
                          "1px solid #e5e7eb",
                      }}
                    >
                      <p
                        style={{
                          marginTop: 0,
                          fontSize:
                            "13px",
                          color:
                            "#6b7280",
                        }}
                      >
                        Q{index + 1}
                      </p>

                      <h3
                        style={{
                          marginTop:
                            "4px",
                          marginBottom:
                            "10px",
                          fontSize:
                            "18px",
                        }}
                      >
                        {policy.title ||
                          "政策"}
                      </h3>

                      {policy.category && (
                        <p
                          style={{
                            fontSize:
                              "13px",
                            color:
                              "#6b7280",
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
                          lineHeight:
                            1.8,
                        }}
                      >
                        {policy.description ||
                          "この政策について、あなたの考えを選択してください。"}
                      </p>

                      <div
                        style={{
                          display:
                            "grid",
                          gap: "8px",
                          marginTop:
                            "16px",
                        }}
                      >
                        {[
                          {
                            value: 2,
                            label:
                              "賛成",
                          },
                          {
                            value: 1,
                            label:
                              "やや賛成",
                          },
                          {
                            value: 0,
                            label:
                              "どちらともいえない",
                          },
                          {
                            value: -1,
                            label:
                              "やや反対",
                          },
                          {
                            value: -2,
                            label:
                              "反対",
                          },
                        ].map(
                          (option) => {
                            const checked =
                              answers[
                                policy
                                  .id
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
                                  border:
                                    checked
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
                          }
                        )}
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
        {diagnosisFinished &&
          !loading &&
          !error && (
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
                  fontSize: "24px",
                }}
              >
                あなたと考えが近い候補者
              </h2>

              <p
                style={{
                  color: "#6b7280",
                  lineHeight: 1.7,
                }}
              >
                {
                  selectedElectionData?.name
                }
                の公表政策と、あなたの回答を比較した結果です。
              </p>

              {diagnosisResults.length ===
              0 ? (
                <div
                  style={{
                    padding: "18px",
                    borderRadius:
                      "12px",
                    background:
                      "#fff7ed",
                    border:
                      "1px solid #fed7aa",
                    color:
                      "#9a3412",
                  }}
                >
                  比較できる候補者の政策情報が
                  まだ十分に登録されていません。
                  <br />
                  候補者の政策を登録すると、
                  一致率を表示できるようになります。
                </div>
              ) : (
                <div
                  style={{
                    display:
                      "grid",
                    gap: "14px",
                    marginTop:
                      "20px",
                  }}
                >
                  {diagnosisResults.map(
                    (
                      candidate,
                      index
                    ) => (
                      <div
                        key={
                          candidate.id
                        }
                        style={{
                          padding:
                            "20px",
                          borderRadius:
                            "14px",
                          border:
                            index ===
                            0
                              ? "2px solid #2563eb"
                              : "1px solid #e5e7eb",
                          background:
                            index ===
                            0
                              ? "#eff6ff"
                              : "#f9fafb",
                        }}
                      >
                        {/* 候補者 */}
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize:
                                  "13px",
                                color:
                                  "#6b7280",
                              }}
                            >
                              {index +
                                1}
                              位
                            </div>

                            <h3
                              style={{
                                margin:
                                  "4px 0",
                                fontSize:
                                  "21px",
                              }}
                            >
                              {
                                candidate.name
                              }
                            </h3>

                            <p
                              style={{
                                margin:
                                  0,
                                color:
                                  "#4b5563",
                              }}
                            >
                              {candidate.party ||
                                "無所属・未登録"}
                            </p>
                          </div>

                          <div
                            style={{
                              textAlign:
                                "right",
                            }}
                          >
                            <div
                              style={{
                                fontSize:
                                  "32px",
                                fontWeight:
                                  800,
                                color:
                                  "#2563eb",
                              }}
                            >
                              {
                                candidate.matchRate
                              }
                              %
                            </div>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#6b7280",
                              }}
                            >
                              一致率
                            </div>
                          </div>
                        </div>

                        {/* 比較件数 */}
                        <p
                          style={{
                            marginTop:
                              "14px",
                            fontSize:
                              "13px",
                            color:
                              "#6b7280",
                          }}
                        >
                          比較できた政策：
                          {
                            candidate.matchedCount
                          }
                          件
                        </p>

                        {/* 一致した政策 */}
                        {candidate
                          .matchedPolicies
                          .length >
                          0 && (
                          <div
                            style={{
                              marginTop:
                                "18px",
                              padding:
                                "16px",
                              borderRadius:
                                "12px",
                              background:
                                "#ecfdf5",
                              border:
                                "1px solid #a7f3d0",
                            }}
                          >
                            <h4
                              style={{
                                marginTop: 0,
                                color:
                                  "#047857",
                              }}
                            >
                              🟢 考えが一致した政策
                            </h4>

                            <div
                              style={{
                                display:
                                  "grid",
                                gap:
                                  "10px",
                              }}
                            >
                              {candidate.matchedPolicies.map(
                                (
                                  policy
                                ) => (
                                  <div
                                    key={
                                      policy.id
                                    }
                                    style={{
                                      padding:
                                        "12px",
                                      background:
                                        "#ffffff",
                                      borderRadius:
                                        "8px",
                                    }}
                                  >
                                    <strong>
                                      {
                                        policy.title
                                      }
                                    </strong>

                                    {policy.category && (
                                      <div
                                        style={{
                                          fontSize:
                                            "12px",
                                          color:
                                            "#6b7280",
                                          marginTop:
                                            "4px",
                                        }}
                                      >
                                        {
                                          policy.category
                                        }
                                      </div>
                                    )}

                                    <p
                                      style={{
                                        margin:
                                          "8px 0 0",
                                        fontSize:
                                          "13px",
                                      }}
                                    >
                                      あなた：
                                      {
                                        policy.userAnswer
                                      }
                                      <br />
                                      候補者：
                                      {
                                        policy.candidateAnswer
                                      }
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* 近い政策 */}
                        {candidate
                          .closePolicies
                          .length >
                          0 && (
                          <div
                            style={{
                              marginTop:
                                "14px",
                              padding:
                                "16px",
                              borderRadius:
                                "12px",
                              background:
                                "#fffbeb",
                              border:
                                "1px solid #fde68a",
                            }}
                          >
                            <h4
                              style={{
                                marginTop: 0,
                                color:
                                  "#92400e",
                              }}
                            >
                              🟡 考えが近い政策
                            </h4>

                            <div
                              style={{
                                display:
                                  "grid",
                                gap:
                                  "10px",
                              }}
                            >
                              {candidate.closePolicies.map(
                                (
                                  policy
                                ) => (
                                  <div
                                    key={
                                      policy.id
                                    }
                                    style={{
                                      padding:
                                        "12px",
                                      background:
                                        "#ffffff",
                                      borderRadius:
                                        "8px",
                                    }}
                                  >
                                    <strong>
                                      {
                                        policy.title
                                      }
                                    </strong>

                                    <p
                                      style={{
                                        margin:
                                          "8px 0 0",
                                        fontSize:
                                          "13px",
                                      }}
                                    >
                                      あなた：
                                      {
                                        policy.userAnswer
                                      }
                                      <br />
                                      候補者：
                                      {
                                        policy.candidateAnswer
                                      }
                                      <br />
                                      一致度：
                                      {
                                        policy.matchScore
                                      }
                                      %
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* 意見が異なる政策 */}
                        {candidate
                          .differentPolicies
                          .length >
                          0 && (
                          <div
                            style={{
                              marginTop:
                                "14px",
                              padding:
                                "16px",
                              borderRadius:
                                "12px",
                              background:
                                "#fef2f2",
                              border:
                                "1px solid #fecaca",
                            }}
                          >
                            <h4
                              style={{
                                marginTop: 0,
                                color:
                                  "#b91c1c",
                              }}
                            >
                              🔴 考えが異なる政策
                            </h4>

                            <div
                              style={{
                                display:
                                  "grid",
                                gap:
                                  "10px",
                              }}
                            >
                              {candidate.differentPolicies.map(
                                (
                                  policy
                                ) => (
                                  <div
                                    key={
                                      policy.id
                                    }
                                    style={{
                                      padding:
                                        "12px",
                                      background:
                                        "#ffffff",
                                      borderRadius:
                                        "8px",
                                    }}
                                  >
                                    <strong>
                                      {
                                        policy.title
                                      }
                                    </strong>

                                    <p
                                      style={{
                                        margin:
                                          "8px 0 0",
                                        fontSize:
                                          "13px",
                                      }}
                                    >
                                      あなた：
                                      {
                                        policy.userAnswer
                                      }
                                      <br />
                                      候補者：
                                      {
                                        policy.candidateAnswer
                                      }
                                      <br />
                                      一致度：
                                      {
                                        policy.matchScore
                                      }
                                      %
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              <button
                onClick={
                  restartDiagnosis
                }
                style={{
                  width: "100%",
                  marginTop: "20px",
                  padding: "13px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius: "10px",
                  background:
                    "#ffffff",
                  color: "#111827",
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                もう一度診断する
              </button>
            </section>
          )}

        {/* =========================
            ローディング
        ========================= */}
        {loading && (
          <section
            style={{
              background: "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <p style={{ margin: 0 }}>
              情報を読み込んでいます…
            </p>
          </section>
        )}

        {/* =========================
            エラー
        ========================= */}
        {error && (
          <section
            style={{
              padding: "18px",
              borderRadius: "12px",
              background: "#fef2f2",
              border:
                "1px solid #fecaca",
              color: "#b91c1c",
            }}
          >
            <strong>
              データ取得エラー
            </strong>

            <p
              style={{
                marginBottom: 0,
              }}
            >
              {error}
            </p>
          </section>
        )}

        {/* =========================
            候補者一覧
        ========================= */}
        {!loading &&
          !error &&
          !diagnosisMode &&
          !diagnosisFinished && (
            <>
              <section
                style={{
                  background:
                    "#ffffff",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius:
                    "16px",
                  padding: "20px",
                  marginBottom:
                    "24px",
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                    fontSize:
                      "22px",
                  }}
                >
                  {selectedElectionData
                    ? `${selectedElectionData.name}の候補者`
                    : "候補者一覧"}
                </h2>

                <p
                  style={{
                    color:
                      "#6b7280",
                    fontSize:
                      "14px",
                  }}
                >
                  {selectedElection
                    ? "選択した選挙に登録されている候補者を表示しています。"
                    : "選挙を選択すると、その選挙の候補者だけを表示できます。"}
                </p>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="候補者名・政党・プロフィールから検索"
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "13px 14px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "10px",
                    fontSize:
                      "15px",
                  }}
                />

                <select
                  value={
                    selectedParty
                  }
                  onChange={(e) =>
                    setSelectedParty(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    marginTop:
                      "12px",
                    padding:
                      "12px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "10px",
                    background:
                      "#ffffff",
                    fontSize:
                      "15px",
                  }}
                >
                  {parties.map(
                    (party) => (
                      <option
                        key={party}
                        value={
                          party
                        }
                      >
                        {party ===
                        "すべて"
                          ? "すべての政党・所属"
                          : party}
                      </option>
                    )
                  )}
                </select>
              </section>

              {filteredCandidates.length ===
                0 && (
                <section
                  style={{
                    background:
                      "#ffffff",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "16px",
                    padding:
                      "24px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color:
                        "#6b7280",
                    }}
                  >
                    条件に一致する候補者が
                    ありません。
                  </p>
                </section>
              )}

              <div
                style={{
                  display:
                    "grid",
                  gap: "18px",
                }}
              >
                {filteredCandidates.map(
                  (candidate) => {
                    const candidatePolicyList =
                      getPoliciesForCandidate(
                        candidate.id
                      );

                    return (
                      <article
                        key={
                          candidate.id
                        }
                        style={{
                          background:
                            "#ffffff",
                          border:
                            "1px solid #e5e7eb",
                          borderRadius:
                            "16px",
                          padding:
                            "22px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap: "16px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <div>
                            <h3
                              style={{
                                margin: 0,
                                fontSize:
                                  "24px",
                              }}
                            >
                              {candidate.name ||
                                "候補者名未登録"}
                            </h3>

                            <p
                              style={{
                                marginTop:
                                  "8px",
                                marginBottom:
                                  0,
                                color:
                                  "#4b5563",
                              }}
                            >
                              <strong>
                                所属：
                              </strong>

                              {candidate.party ||
                                "未登録"}
                            </p>
                          </div>

                          {candidate.official_url && (
                            <a
                              href={
                                candidate.official_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding:
                                  "9px 14px",
                                borderRadius:
                                  "8px",
                                border:
                                  "1px solid #d1d5db",
                                color:
                                  "#111827",
                                textDecoration:
                                  "none",
                                fontSize:
                                  "14px",
                              }}
                            >
                              公式情報 ↗
                            </a>
                          )}
                        </div>

                        <div
                          style={{
                            marginTop:
                              "22px",
                            paddingTop:
                              "18px",
                            borderTop:
                              "1px solid #f0f0f0",
                          }}
                        >
                          <h4>
                            プロフィール
                          </h4>

                          <p
                            style={{
                              lineHeight:
                                1.8,
                              whiteSpace:
                                "pre-wrap",
                              color:
                                "#374151",
                            }}
                          >
                            {candidate.profile ||
                              "公表情報なし"}
                          </p>
                        </div>

                        <div
                          style={{
                            marginTop:
                              "24px",
                          }}
                        >
                          <h4>
                            政策・立場
                          </h4>

                          {candidatePolicyList.length ===
                          0 ? (
                            <p
                              style={{
                                color:
                                  "#6b7280",
                              }}
                            >
                              政策情報はまだ登録されていません。
                            </p>
                          ) : (
                            <div
                              style={{
                                display:
                                  "grid",
                                gap:
                                  "12px",
                              }}
                            >
                              {candidatePolicyList.map(
                                (
                                  policy,
                                  index
                                ) => (
                                  <div
                                    key={`${candidate.id}-${policy.id}-${index}`}
                                    style={{
                                      padding:
                                        "16px",
                                      borderRadius:
                                        "12px",
                                      background:
                                        "#f9fafb",
                                      border:
                                        "1px solid #e5e7eb",
                                    }}
                                  >
                                    <strong>
                                      {policy.title ||
                                        "政策名未登録"}
                                    </strong>

                                    {policy.category && (
                                      <p
                                        style={{
                                          fontSize:
                                            "13px",
                                          color:
                                            "#6b7280",
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
                                        lineHeight:
                                          1.7,
                                      }}
                                    >
                                      {policy.description ||
                                        "政策の詳細情報はありません。"}
                                    </p>

                                    {policy.stance && (
                                      <p
                                        style={{
                                          marginBottom:
                                            0,
                                          fontSize:
                                            "14px",
                                        }}
                                      >
                                        <strong>
                                          立場：
                                        </strong>{" "}
                                        {
                                          policy.stance
                                        }
                                      </p>
                                    )}

                                    {policy.source_url && (
                                      <p>
                                        <a
                                          href={
                                            policy.source_url
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          出典・公式情報を見る ↗
                                        </a>
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            marginTop:
                              "22px",
                            padding:
                              "18px",
                            borderRadius:
                              "12px",
                            background:
                              "#eff6ff",
                            border:
                              "1px solid #bfdbfe",
                            textAlign:
                              "center",
                          }}
                        >
                          <strong>
                            自分の考えとの一致度
                          </strong>

                          <p
                            style={{
                              marginTop:
                                "7px",
                              marginBottom:
                                "12px",
                              fontSize:
                                "14px",
                              color:
                                "#4b5563",
                            }}
                          >
                            政策診断に回答すると、
                            この候補者との一致率を確認できます。
                          </p>

                          {selectedElection &&
                          diagnosisPolicies.length >
                            0 ? (
                            <button
                              onClick={
                                startDiagnosis
                              }
                              style={{
                                padding:
                                  "10px 18px",
                                border:
                                  "none",
                                borderRadius:
                                  "8px",
                                background:
                                  "#2563eb",
                                color:
                                  "#ffffff",
                                fontSize:
                                  "14px",
                                fontWeight:
                                  700,
                                cursor:
                                  "pointer",
                              }}
                            >
                              政策診断を始める
                            </button>
                          ) : (
                            <button
                              disabled
                              style={{
                                padding:
                                  "10px 18px",
                                border:
                                  "none",
                                borderRadius:
                                  "8px",
                                background:
                                  "#e5e7eb",
                                color:
                                  "#6b7280",
                              }}
                            >
                              政策診断（準備中）
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </>
          )}

        {/* =========================
            フッター
        ========================= */}
        <footer
          style={{
            marginTop: "50px",
            paddingTop: "22px",
            borderTop:
              "1px solid #e5e7eb",
            fontSize: "13px",
            color: "#6b7280",
            lineHeight: 1.8,
          }}
        >
          <p>
            このサイトは、候補者等が公表した情報を整理して表示するものです。
          </p>

          <p>
            掲載情報については、
            各候補者・政党・自治体等の公式情報もあわせてご確認ください。
          </p>

          <p>
            特定の候補者への投票を推奨するものではありません。
          </p>
        </footer>
      </div>
    </main>
  );
}
