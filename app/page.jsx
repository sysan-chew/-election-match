"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [candidates, setCandidates] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [candidatePolicies, setCandidatePolicies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [candidatesResponse, policiesResponse, candidatePoliciesResponse] =
          await Promise.all([
            fetch("/api/candidates"),
            fetch("/api/policies"),
            fetch("/api/candidate-policies"),
          ]);

        if (!candidatesResponse.ok) {
          throw new Error("候補者データを取得できませんでした");
        }

        if (!policiesResponse.ok) {
          throw new Error("政策データを取得できませんでした");
        }

        if (!candidatePoliciesResponse.ok) {
          throw new Error("候補者政策データを取得できませんでした");
        }

        const candidatesData = await candidatesResponse.json();
        const policiesData = await policiesResponse.json();
        const candidatePoliciesData =
          await candidatePoliciesResponse.json();

        setCandidates(candidatesData.candidates || []);
        setPolicies(policiesData.policies || []);
        setCandidatePolicies(
          candidatePoliciesData.candidatePolicies || []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function getPoliciesForCandidate(candidateId) {
    const links = candidatePolicies.filter(
      (item) => item.candidate_id === candidateId
    );

    return links.map((link) => {
      const policy = policies.find(
        (item) => item.id === link.policy_id
      );

      return {
        ...policy,
        position: link.position,
        stance: link.stance,
        source_url: link.source_url,
      };
    });
  }

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "sans-serif",
        background: "#ffffff",
        color: "#111827",
      }}
    >
      {/* ヘッダー */}
      <header
        style={{
          padding: "32px 20px",
          marginBottom: "28px",
          borderRadius: "16px",
          background: "#f3f4f6",
        }}
      >
        <h1
          style={{
            marginTop: 0,
            marginBottom: "12px",
            fontSize: "30px",
          }}
        >
          全国候補者マッチング
        </h1>

        <p
          style={{
            lineHeight: 1.8,
            marginBottom: 0,
          }}
        >
          全国の選挙・候補者・政策に関する公表情報を確認・比較し、
          自分の考えとの一致度を確認できる情報整理サイトです。
        </p>
      </header>

      {/* 説明 */}
      <section
        style={{
          marginBottom: "28px",
          padding: "20px",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>選挙・候補者・政策</h2>

        <p style={{ lineHeight: 1.8 }}>
          現在登録されている候補者と、その候補者に紐づけられた政策を表示しています。
        </p>
      </section>

      {/* ローディング */}
      {loading && (
        <section>
          <p>候補者・政策情報を読み込んでいます…</p>
        </section>
      )}

      {/* エラー */}
      {error && (
        <section
          style={{
            padding: "16px",
            borderRadius: "10px",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          <strong>エラー</strong>
          <p>{error}</p>
        </section>
      )}

      {/* データなし */}
      {!loading && !error && candidates.length === 0 && (
        <section>
          <p>現在、候補者データが登録されていません。</p>
        </section>
      )}

      {/* 候補者一覧 */}
      {!loading && !error && candidates.length > 0 && (
        <section>
          <h2>候補者一覧</h2>

          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            {candidates.map((candidate) => {
              const candidatePolicyList =
                getPoliciesForCandidate(candidate.id);

              return (
                <article
                  key={candidate.id}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "16px",
                    padding: "20px",
                    background: "#ffffff",
                  }}
                >
                  {/* 候補者名 */}
                  <h3
                    style={{
                      fontSize: "24px",
                      marginTop: 0,
                      marginBottom: "8px",
                    }}
                  >
                    {candidate.name}
                  </h3>

                  {/* 所属 */}
                  <p>
                    <strong>所属：</strong>
                    {candidate.party || "未登録"}
                  </p>

                  {/* プロフィール */}
                  <div
                    style={{
                      marginTop: "20px",
                    }}
                  >
                    <h4>プロフィール</h4>

                    <p
                      style={{
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {candidate.profile || "公表情報なし"}
                    </p>
                  </div>

                  {/* 政策 */}
                  <div
                    style={{
                      marginTop: "24px",
                    }}
                  >
                    <h4>政策・立場</h4>

                    {candidatePolicyList.length === 0 ? (
                      <p>政策情報はまだ登録されていません。</p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gap: "12px",
                        }}
                      >
                        {candidatePolicyList.map((policy, index) => (
                          <div
                            key={`${candidate.id}-${policy.id}-${index}`}
                            style={{
                              padding: "16px",
                              borderRadius: "10px",
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "12px",
                                flexWrap: "wrap",
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: "17px",
                                }}
                              >
                                {policy.title || "政策名未登録"}
                              </strong>

                              {policy.stance && (
                                <span
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "999px",
                                    background: "#e5e7eb",
                                    fontSize: "14px",
                                  }}
                                >
                                  {policy.stance}
                                </span>
                              )}
                            </div>

                            {policy.category && (
                              <p
                                style={{
                                  marginBottom: "8px",
                                  fontSize: "13px",
                                  color: "#6b7280",
                                }}
                              >
                                分野：{policy.category}
                              </p>
                            )}

                            <p
                              style={{
                                lineHeight: 1.7,
                                marginBottom: 0,
                              }}
                            >
                              {policy.description ||
                                "政策の詳細情報はありません。"}
                            </p>

                            {policy.source_url && (
                              <p style={{ marginBottom: 0 }}>
                                <a
                                  href={policy.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  出典・公式情報を見る
                                </a>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* フッター */}
      <footer
        style={{
          marginTop: "50px",
          paddingTop: "20px",
          borderTop: "1px solid #ddd",
          fontSize: "14px",
          color: "#555",
          lineHeight: 1.7,
        }}
      >
        <p>
          このサイトは候補者等が公表した情報を整理して表示するものです。
        </p>

        <p>
          特定の候補者への投票を推奨するものではありません。
        </p>
      </footer>
    </main>
  );
}
