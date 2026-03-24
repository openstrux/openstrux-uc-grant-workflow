import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Grant Workflow</h1>
      <p>Privacy-first grant review system — EU open-source fund MVP</p>

      <h2>Actions</h2>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/submit" className="btn">
          Submit a new proposal
        </Link>
        <Link href="/admin" className="btn secondary">
          Admin dashboard
        </Link>
      </div>

      <h2>Phases (v0.6.0)</h2>
      <div className="card">
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--color-border)" }}>
            <strong>P0</strong> — Canonical domain model
          </li>
          <li style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--color-border)" }}>
            <strong>P1</strong> — Submission intake
          </li>
          <li style={{ padding: "0.5rem 0" }}>
            <strong>P2</strong> — Eligibility gate
          </li>
        </ul>
      </div>
    </main>
  );
}
