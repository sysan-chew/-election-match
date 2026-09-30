“use client”;

import { useEffect, useMemo, useState } from “react”;

export default function Home() {
const [candidates, setCandidates] = useState([]);
const [policies, setPolicies] = useState([]);
const [candidatePolicies, setCandidatePolicies] = useState([]);

const [loading, setLoading] = useState(true);
const [error, setError] = useState(””);

const [search, setSearch] = useState(””);
const [selectedParty, setSelectedParty] = useState(“すべて”);

useEffect(() => {
async function loadData() {
try {
setLoading(true);
setError(””);

    const [
      candidatesResponse,
      policiesResponse,
      candidatePoliciesResponse,
    ] = await Promise.all([
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
      throw new Error(
        "候補者と政策の紐付けデータを取得できませんでした"
      );
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
    console.error(err);
    setError(
      err.message || "データの取得中にエラーが発生しました"
    );
  } finally {
    setLoading(false);
  }
}
loadData();

}, []);

/*

* 候補者に紐づく政策を取得
    */
    function getPoliciesForCandidate(candidateId) {
    const links = candidatePolicies.filter(
    (item) =>
    Number(item.candidate_id) === Number(candidateId)
    );

return links
  .map((link) => {
    const policy = policies.find(
      (item) =>
        Number(item.id) === Number(link.policy_id)
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

/*

* 政党一覧
    */
    const parties = useMemo(() => {
    const partySet = new Set();

candidates.forEach((candidate) => {
  if (candidate.party) {
    partySet.add(candidate.party);
  }
});
return ["すべて", ...Array.from(partySet)];

}, [candidates]);

/*

* 候補者検索・政党絞り込み
    */
    const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

return candidates.filter((candidate) => {
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
  return matchesSearch && matchesParty;
});

}, [candidates, search, selectedParty]);

return (
<main
style={{
minHeight: “100vh”,
background: “#f8fafc”,
color: “#111827”,
fontFamily:
‘-apple-system, BlinkMacSystemFont, “Segoe UI”, sans-serif’,
}}
>
{/* =========================
ヘッダー
========================= */}
<header
style={{
background: “#ffffff”,
borderBottom: “1px solid #e5e7eb”,
}}
>
<div
style={{
maxWidth: “1000px”,
margin: “0 auto”,
padding: “28px 16px”,
}}
>
<h1
style={{
margin: 0,
fontSize: “30px”,
fontWeight: 700,
letterSpacing: “-0.02em”,
}}
>
全国候補者マッチング
      <p
        style={{
          marginTop: "12px",
          marginBottom: 0,
          color: "#4b5563",
          lineHeight: 1.8,
        }}
      >
        全国の選挙・候補者・政策に関する公表情報を確認・比較し、
        自分の考えとの一致度を確認できる情報整理サイトです。
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
        選挙検索
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
          marginBottom: "8px",
          fontSize: "20px",
        }}
      >
        選挙を探す
      </h2>
      <p
        style={{
          color: "#6b7280",
          lineHeight: 1.7,
        }}
      >
        都道府県・市区町村・選挙を選択して、
        確認したい候補者を探せるようにしていきます。
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
          disabled
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            background: "#f9fafb",
            color: "#6b7280",
            fontSize: "15px",
          }}
        >
          <option>都道府県</option>
        </select>
        <select
          disabled
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            background: "#f9fafb",
            color: "#6b7280",
            fontSize: "15px",
          }}
        >
          <option>市区町村</option>
        </select>
        <select
          disabled
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            background: "#f9fafb",
            color: "#6b7280",
            fontSize: "15px",
          }}
        >
          <option>選挙</option>
        </select>
      </div>
      <p
        style={{
          marginBottom: 0,
          marginTop: "12px",
          fontSize: "13px",
          color: "#9ca3af",
        }}
      >
        ※全国の選挙データ連携機能は順次追加予定です。
      </p>
    </section>
    {/* =========================
        サイト説明
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
        このサイトについて
      </h2>
      <p
        style={{
          lineHeight: 1.8,
          color: "#374151",
          marginBottom: 0,
        }}
      >
        候補者が公表しているプロフィールや政策などの情報を整理し、
        候補者同士を比較しやすくすることを目的としています。
      </p>
    </section>
    {/* =========================
        ローディング
    ========================= */}
    {loading && (
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <p style={{ margin: 0 }}>
          候補者・政策情報を読み込んでいます…
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
          border: "1px solid #fecaca",
          color: "#b91c1c",
          marginBottom: "24px",
        }}
      >
        <strong>データ取得エラー</strong>
        <p
          style={{
            marginBottom: 0,
            marginTop: "8px",
          }}
        >
          {error}
        </p>
      </section>
    )}
    {/* =========================
        候補者一覧
    ========================= */}
    {!loading && !error && (
      <>
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
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
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                }}
              >
                候補者一覧
              </h2>
              <p
                style={{
                  marginBottom: 0,
                  marginTop: "6px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                登録されている候補者を表示しています。
              </p>
            </div>
            <strong
              style={{
                fontSize: "14px",
                color: "#4b5563",
              }}
            >
              {filteredCandidates.length}人
            </strong>
          </div>
          {/* 検索 */}
          <div
            style={{
              marginTop: "20px",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="候補者名・政党・プロフィールから検索"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>
          {/* 政党フィルター */}
          <div
            style={{
              marginTop: "12px",
            }}
          >
            <select
              value={selectedParty}
              onChange={(e) =>
                setSelectedParty(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#ffffff",
                fontSize: "15px",
              }}
            >
              {parties.map((party) => (
                <option key={party} value={party}>
                  {party === "すべて"
                    ? "すべての政党・所属"
                    : party}
                </option>
              ))}
            </select>
          </div>
        </section>
        {/* データなし */}
        {candidates.length === 0 && (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              候補者データがありません
            </h3>
            <p style={{ marginBottom: 0 }}>
              現在、Supabaseに候補者データが登録されていません。
            </p>
          </section>
        )}
        {/* 検索結果なし */}
        {candidates.length > 0 &&
          filteredCandidates.length === 0 && (
            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <p style={{ margin: 0 }}>
                条件に一致する候補者が見つかりませんでした。
              </p>
            </section>
          )}
        {/* 候補者カード */}
        {filteredCandidates.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            {filteredCandidates.map((candidate) => {
              const candidatePolicyList =
                getPoliciesForCandidate(candidate.id);
              return (
                <article
                  key={candidate.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    padding: "22px",
                    boxShadow:
                      "0 1px 2px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  {/* 候補者情報 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "24px",
                        }}
                      >
                        {candidate.name ||
                          "候補者名未登録"}
                      </h3>
                      <p
                        style={{
                          marginTop: "8px",
                          marginBottom: 0,
                          color: "#4b5563",
                        }}
                      >
                        <strong>所属：</strong>
                        {candidate.party ||
                          "未登録"}
                      </p>
                    </div>
                    {candidate.official_url && (
                      <a
                        href={candidate.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          padding: "9px 14px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          color: "#111827",
                          textDecoration: "none",
                          fontSize: "14px",
                          background: "#ffffff",
                        }}
                      >
                        公式情報 ↗
                      </a>
                    )}
                  </div>
                  {/* プロフィール */}
                  <div
                    style={{
                      marginTop: "22px",
                      paddingTop: "18px",
                      borderTop:
                        "1px solid #f0f0f0",
                    }}
                  >
                    <h4
                      style={{
                        marginTop: 0,
                        marginBottom: "8px",
                      }}
                    >
                      プロフィール
                    </h4>
                    <p
                      style={{
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                        marginBottom: 0,
                        color: "#374151",
                      }}
                    >
                      {candidate.profile ||
                        "公表情報なし"}
                    </p>
                  </div>
                  {/* 政策 */}
                  <div
                    style={{
                      marginTop: "24px",
                    }}
                  >
                    <h4
                      style={{
                        marginTop: 0,
                        marginBottom: "12px",
                      }}
                    >
                      政策・立場
                    </h4>
                    {candidatePolicyList.length ===
                    0 ? (
                      <div
                        style={{
                          padding: "14px",
                          borderRadius: "10px",
                          background: "#f9fafb",
                          color: "#6b7280",
                        }}
                      >
                        政策情報はまだ登録されていません。
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gap: "12px",
                        }}
                      >
                        {candidatePolicyList.map(
                          (policy, index) => (
                            <div
                              key={`${candidate.id}-${policy.id}-${index}`}
                              style={{
                                padding: "16px",
                                borderRadius: "12px",
                                background: "#f9fafb",
                                border:
                                  "1px solid #e5e7eb",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems: "center",
                                  gap: "10px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: "17px",
                                  }}
                                >
                                  {policy.title ||
                                    "政策名未登録"}
                                </strong>
                                {policy.stance && (
                                  <span
                                    style={{
                                      padding:
                                        "5px 10px",
                                      borderRadius:
                                        "999px",
                                      background:
                                        "#e5e7eb",
                                      fontSize:
                                        "13px",
                                    }}
                                  >
                                    {policy.stance}
                                  </span>
                                )}
                              </div>
                              {policy.category && (
                                <p
                                  style={{
                                    marginTop: "8px",
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                    color: "#6b7280",
                                  }}
                                >
                                  分野：
                                  {policy.category}
                                </p>
                              )}
                              <p
                                style={{
                                  lineHeight: 1.7,
                                  marginBottom: 0,
                                  color: "#374151",
                                }}
                              >
                                {policy.description ||
                                  "政策の詳細情報はありません。"}
                              </p>
                              {policy.source_url && (
                                <p
                                  style={{
                                    marginTop:
                                      "12px",
                                    marginBottom: 0,
                                  }}
                                >
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
                  {/* マッチング機能 */}
                  <div
                    style={{
                      marginTop: "22px",
                      padding: "18px",
                      borderRadius: "12px",
                      background: "#f9fafb",
                      border:
                        "1px dashed #d1d5db",
                      textAlign: "center",
                    }}
                  >
                    <strong>
                      自分の考えとの一致度を確認
                    </strong>
                    <p
                      style={{
                        marginTop: "7px",
                        marginBottom: "12px",
                        fontSize: "14px",
                        color: "#6b7280",
                        lineHeight: 1.6,
                      }}
                    >
                      政策について質問に回答すると、
                      候補者の公表情報との一致度を確認できる機能を追加予定です。
                    </p>
                    <button
                      disabled
                      style={{
                        padding: "10px 18px",
                        border: "none",
                        borderRadius: "8px",
                        background: "#e5e7eb",
                        color: "#6b7280",
                        fontSize: "14px",
                        cursor: "not-allowed",
                      }}
                    >
                      政策診断（準備中）
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </>
    )}
    {/* =========================
        フッター
    ========================= */}
    <footer
      style={{
        marginTop: "50px",
        paddingTop: "22px",
        borderTop: "1px solid #e5e7eb",
        fontSize: "13px",
        color: "#6b7280",
        lineHeight: 1.8,
      }}
    >
      <p>
        このサイトは、候補者等が公表した情報を整理して表示するものです。
      </p>
      <p>
        掲載情報については、各候補者・政党・自治体等の公式情報もあわせてご確認ください。
      </p>
      <p>
        特定の候補者への投票を推奨するものではありません。
      </p>
    </footer>
  </div>
</main>

);
}
