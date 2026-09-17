"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCandidates() {
      try {
        const response = await fetch("/api/candidates");

        if (!response.ok) {
          throw new Error("候補者データを取得できませんでした");
        }

        const data = await response.json();

        setCandidates(data.candidates || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, []);

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "sans-serif",
      }}
    >
      <header
        style={{
          padding: "32px 20px",
          marginBottom: "24px",
          borderRadius: "16px",
          background: "#f3f4f6",
        }}
      >
        <h1>尼崎市選挙比較</h1>

        <p>
          候補者の公表情報を確認・比較できる情報整理サイトです。
        </p>
      </header>

      <section>
        <h2>候補者一覧</h2>

        {loading && <p>候補者情報を読み込んでいます…</p>}

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        {!loading && !error && candidates.length === 0 && (
          <p>
            現在、候補者データが登録されていません。
          </p>
        )}

        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          {candidates.map((candidate) => (
            <article
              key={candidate.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <h3>{candidate.name}</h3>

              <p>
                <strong>所属：</strong>
                {candidate.party || "未登録"}
              </p>

              <h4>プロフィール</h4>
              <p>
                {candidate.profile || "公表情報なし"}
              </p>

              <h4>政策</h4>
              <p>
                {candidate.policy || "公表情報なし"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer
        style={{
          marginTop: "40px",
          paddingTop: "20px",
          borderTop: "1px solid #ddd",
          fontSize: "14px",
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
