“use client”;

import { useEffect, useMemo, useState } from “react”;

export default function Home() {
const [candidates, setCandidates] = useState([]);
const [policies, setPolicies] = useState([]);
const [candidatePolicies, setCandidatePolicies] = useState([]);
const [elections, setElections] = useState([]);

const [selectedPrefecture, setSelectedPrefecture] =
useState(””);
const [selectedMunicipality, setSelectedMunicipality] =
useState(””);
const [selectedElection, setSelectedElection] =
useState(””);

const [search, setSearch] = useState(””);
const [selectedParty, setSelectedParty] =
useState(“すべて”);

const [loading, setLoading] = useState(true);
const [error, setError] = useState(””);

/*

* データ取得
    */
    useEffect(() => {
    async function loadData() {
    try {
    setLoading(true);
    setError(””);
    const [
    candidatesResponse,
    policiesResponse,
    candidatePoliciesResponse,
    electionsResponse,
    ] = await Promise.all([
    fetch(”/api/candidates”),
    fetch(”/api/policies”),
    fetch(”/api/candidate-policies”),
    fetch(”/api/elections”),
    ]);
    if (!candidatesResponse.ok) {
    throw new Error(
    “候補者データを取得できませんでした”
    );
    }
    if (!policiesResponse.ok) {
    throw new Error(
    “政策データを取得できませんでした”
    );
    }
    if (!candidatePoliciesResponse.ok) {
    throw new Error(
    “候補者政策データを取得できませんでした”
    );
    }
    if (!electionsResponse.ok) {
    throw new Error(
    “選挙データを取得できませんでした”
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
    “データの取得中にエラーが発生しました”
    );
    } finally {
    setLoading(false);
    }
    }

loadData();

}, []);

/*

* 都道府県一覧
    */
    const prefectures = useMemo(() => {
    return [
    …new Set(
    elections
    .map((election) => election.prefecture)
    .filter(Boolean)
    ),
    ];
    }, [elections]);

/*

* 市区町村一覧
    */
    const municipalities = useMemo(() => {
    return [
    …new Set(
    elections
    .filter(
    (election) =>
    !selectedPrefecture ||
    election.prefecture ===
    selectedPrefecture
    )
    .map(
    (election) => election.municipality
    )
    .filter(Boolean)
    ),
    ];
    }, [elections, selectedPrefecture]);

/*

* 選挙一覧
    */
    const filteredElections = useMemo(() => {
    return elections.filter((election) => {
    const prefectureMatch =
    !selectedPrefecture ||
    election.prefecture ===
    selectedPrefecture;
    const municipalityMatch =
    !selectedMunicipality ||
    election.municipality ===
    selectedMunicipality;
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

/*

* 選択された選挙
    */
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
return [
  "すべて",
  ...Array.from(partySet),
];

}, [candidates]);

/*

* 候補者の政策
    */
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

/*

* 候補者を選挙で絞り込み
    */
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

/*

* 検索・政党で絞り込み
    */
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
      candidate.party ===
        selectedParty;
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

/*

* 都道府県変更
    */
    function handlePrefectureChange(value) {
    setSelectedPrefecture(value);
    setSelectedMunicipality(””);
    setSelectedElection(””);
    }

/*

* 市区町村変更
    */
    function handleMunicipalityChange(value) {
    setSelectedMunicipality(value);
    setSelectedElection(””);
    }

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
borderBottom:
“1px solid #e5e7eb”,
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
        {/* 都道府県 */}
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
        {/* 市区町村 */}
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
        {/* 選挙 */}
        <select
          value={selectedElection}
          onChange={(e) =>
            setSelectedElection(
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
      {/* 選択中の選挙 */}
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
            {selectedElectionData.prefecture}
            {" "}
            {selectedElectionData.municipality}
          </p>
        </div>
      )}
    </section>
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
        候補者
    ========================= */}
    {!loading && !error && (
      <>
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
              fontSize: "22px",
            }}
          >
            {selectedElectionData
              ? `${selectedElectionData.name}の候補者`
              : "候補者一覧"}
          </h2>
          <p
            style={{
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            {selectedElection
              ? "選択した選挙に登録されている候補者を表示しています。"
              : "選挙を選択すると、その選挙の候補者だけを表示できます。"}
          </p>
          {/* 検索 */}
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
              border:
                "1px solid #d1d5db",
              borderRadius: "10px",
              fontSize: "15px",
            }}
          />
          {/* 政党 */}
          <select
            value={selectedParty}
            onChange={(e) =>
              setSelectedParty(
                e.target.value
              )
            }
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "12px",
              border:
                "1px solid #d1d5db",
              borderRadius: "10px",
              background: "#ffffff",
              fontSize: "15px",
            }}
          >
            {parties.map((party) => (
              <option
                key={party}
                value={party}
              >
                {party === "すべて"
                  ? "すべての政党・所属"
                  : party}
              </option>
            ))}
          </select>
        </section>
        {filteredCandidates.length ===
          0 && (
          <section
            style={{
              background: "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#6b7280",
              }}
            >
              条件に一致する候補者が
              ありません。
            </p>
          </section>
        )}
        {/* =========================
            候補者カード
        ========================= */}
        <div
          style={{
            display: "grid",
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
                  key={candidate.id}
                  style={{
                    background:
                      "#ffffff",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "16px",
                    padding: "22px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
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
                  {/* プロフィール */}
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
                  {/* 政策 */}
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
                  {/* マッチング */}
                  <div
                    style={{
                      marginTop:
                        "22px",
                      padding:
                        "18px",
                      borderRadius:
                        "12px",
                      background:
                        "#f9fafb",
                      border:
                        "1px dashed #d1d5db",
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
                          "#6b7280",
                      }}
                    >
                      政策について回答すると、
                      候補者の公表情報との一致度を確認できる機能を追加予定です。
                    </p>
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
