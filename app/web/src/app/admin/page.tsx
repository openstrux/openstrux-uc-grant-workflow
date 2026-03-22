/**
 * /admin — Review administrator dashboard.
 *
 * Lists all submissions with status, date, and action links.
 * Server component — calls submissionService directly.
 */

import Link from "next/link";
import { listSubmissions } from "@/server/services/submissionService";

function statusBadgeClass(status: string): string {
  if (status === "eligible") return "badge badge-eligible";
  if (status === "eligibility_failed") return "badge badge-ineligible";
  return "badge badge-pending";
}

export default async function AdminPage() {
  const submissions = await listSubmissions();

  return (
    <main>
      <h1>Review Administrator</h1>

      <h2>Submissions</h2>
      {submissions.length === 0 ? (
        <div className="empty-state">
          <p>No submissions yet.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Alias</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td>
                  <code>{s.id.slice(0, 8)}</code>
                </td>
                <td>{s.applicantAlias}</td>
                <td>
                  <span className={statusBadgeClass(s.status)}>{s.status}</span>
                </td>
                <td>{new Date(s.submittedAt).toLocaleDateString()}</td>
                <td>
                  <Link href={`/admin/proposals/${s.id}`}>View</Link>
                  {" · "}
                  <Link href={`/admin/proposals/${s.id}/eligibility`}>Eligibility</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
