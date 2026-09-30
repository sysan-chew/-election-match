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
          全国の
