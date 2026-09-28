"use client";
import { useState } from "react";
import { useApp, Badge, Modal, Field, fmtDate } from "@/components/ui.jsx";
import { SchoolEmailControl } from "@/components/IssueSchoolEmail.jsx";

export default function AdmissionsPage() {
  const { db, act } = useApp();
  const [tab, setTab] = useState("transitions");
  const [trId, setTrId] = useState(null);
  const [class_, setClass] = useState("Primary 1 (Cambridge)");
  const [notes, setNotes] = useState("Teacher recommends progression. Parents confirmed intake.");
  const [busy, setBusy] = useState(false);
  const [retireFor, setRetireFor] = useState(null); // { studentId, name, outcome }
  const [retireNote, setRetireNote] = useState("");
  const [delFam, setDelFam] = useState(null); // familyId
  const [delConfirm, setDelConfirm] = useState("");

  if (!db) return <div className="card">Loading…</div>;
  const transition = db.transitions.find((t) => t.id === trId);
  const docs = db.documents;
  const presKids = [];
  for (const fam of db.families) for (const c of fam.children) if (c.campus === "preschool") presKids.push({ ...c, family: fam });

  async function doEnroll() {
    setBusy(true);
    try {
      await act("enrollTransition", { transitionId: trId, targetClass: class_ }, "Enrolled! Records migrated and invoice created — parent, bursar and admissions notified automatically.");
      setTrId(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Admissions & Pre-School Transition</h2>
        <Badge tone="blue">Mrs. Mary Kyomukama · Admissions</Badge>
      </div>

      <div className="tabs">
        <button className={tab === "transitions" ? "on" : ""} onClick={() => setTab("transitions")}>Transitions</button>
        <button className={tab === "docs" ? "on" : ""} onClick={() => setTab("docs")}>Document vault</button>
        <button className={tab === "onboarding" ? "on" : ""} onClick={() => setTab("onboarding")}>Auto onboarding</button>
        <button className={tab === "applicants" ? "on" : ""} onClick={() => setTab("applicants")}>New applicants</button>
        <button className={tab === "accounts" ? "on" : ""} onClick={() => setTab("accounts")}>Student portal accounts</button>
        <button className={tab === "leavers" ? "on" : ""} onClick={() => setTab("leavers")}>Leavers & alumni</button>
      </div>

      {tab === "transitions" && (
        <div className="grid grid-2">
          {db.transitions.map((t) => {
            const kid = db.studentIndex[t.studentId];
            const fam = db.families.find((f) => f.id === kid?.familyId);
            const done = t.checklist.filter((c) => c.done).length;
            return (
              <div className="card" key={t.id}>
                <div className="spread">
                  <div className="row">
                    <div className="avatar-lg" style={{ background: "var(--peri-l)", color: "var(--maroon)", border: "1px solid var(--peri-2)" }}>{kid?.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                    <div>
                      <h3>{kid?.name}</h3>
                      <div className="small muted">{kid?.class} &gt; <b style={{ color: "var(--maroon)" }}>{t.targetClass}</b> · {fam?.name} family</div>
                    </div>
                  </div>
                  <Badge tone={t.status === "enrolled" ? "green" : "gold"}>{t.status}</Badge>
                </div>
                <div className="small muted" style={{ margin: "0.6rem 0 0.3rem" }}>Records ready: {done}/{t.checklist.length}</div>
                <div className="row" style={{ marginBottom: "0.7rem" }}>
                  {t.checklist.map((c) => (
                    <span className="badge gray" key={c.key}>{c.done ? "✓" : "…"} {c.label}</span>
                  ))}
                </div>
                <div className="row">
                  <button className="btn secondary sm" onClick={() => { setTrId(t.id); setNotes(t.notes || ""); }}>One-click migrate &gt;</button>
                  <button className="btn ghost sm" onClick={() => act("initiateTransition", { studentId: t.studentId, by: "u-admissions", notes: "Manual re-initiation." }, "Transition record re-created.")}>Re-initiate</button>
                </div>
              </div>
            );
          })}

          <div className="card soon">
            <h3>+ Start a new transition</h3>
            <p className="small muted">Pick a Pre-School pupil who is ready for Primary 1. Their records are already on file — this takes one click.</p>
            {presKids.filter((k) => !db.transitions.some((t) => t.studentId === k.id)).map((k) => (
              <div className="list-item row" key={k.id} style={{ justifyContent: "space-between" }}>
                <span>
                   <b style={{ fontFamily: "var(--fpd)" }}>{k.name}</b> · {k.class}{" "}
                  <span className="badge gray">{k.readiness?.assessment || "on track"}</span>
                </span>
                <button className="btn secondary sm" onClick={() => act("initiateTransition", { studentId: k.id, by: "u-admissions", notes }, `Transition initiated for ${k.name}.`)}>Initiate</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "docs" && (
        <div className="card">
          <table>
            <thead><tr><th>Student</th><th>Type</th><th>File</th><th>Uploaded</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {docs.map((d) => {
                const kid = db.studentIndex[d.studentId];
                return (
                  <tr key={d.id}>
                    <td><b style={kid?.campus === "preschool" ? { fontFamily: "var(--fpd)" } : undefined}>{kid?.name}</b><div className="small muted">{kid?.campus === "preschool" ? "Gill Pre-School" : "Main School"}</div></td>
                    <td>{d.type}</td>
                    <td className="mono small">{d.name}</td>
                    <td className="small">{fmtDate(d.uploadedAt)}</td>
                    <td><Badge tone={d.status === "verified" ? "green" : "gold"}>{d.status}</Badge></td>
                    <td>
                      {d.status !== "verified" ? (
                        <button className="btn sm" onClick={() => act("verifyDocument", { docId: d.id, status: "verified" }, "Record verified — no paper copy needed.")}>✓ Verify</button>
                      ) : (
                        <span className="small muted">on file</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="small muted" style={{ marginTop: "0.6rem" }}> Previously these lived in folders and a filing cabinet. Verified records migrate with the pupil at transition — parents never re-submit.
          </p>
        </div>
      )}

      {tab === "onboarding" && (
        <div className="card">
          <div className="spread" style={{ marginBottom: "0.7rem" }}>
            <div>
              <h3>Automatic parent onboarding</h3>
              <p className="small muted" style={{ margin: "0.2rem 0 0" }}>
                When an application's documents are verified <b>and</b> full term tuition is cleared, the family is uploaded
                to the OS automatically and every parent number on the form is sent the portal link by SMS. All parents share one login.
              </p>
            </div>
            <Badge tone={db.activatedNow?.length ? "green" : "gray"}>
              {db.activatedNow?.length ? `Just activated: ${db.activatedNow.map((a) => db.families.find((f) => f.id === db.studentIndex[a.studentId]?.familyId)?.name).join(", ")}` : "Waiting for payments"}
            </Badge>
          </div>

          {db.applications.map((app) => {
            const kid = db.studentIndex[app.studentId];
            const fam = db.families.find((f) => f.id === kid?.familyId);
            const appDocs = db.documents.filter((d) => d.studentId === kid?.id);
            const docsOK = appDocs.length > 0 && appDocs.every((d) => d.status === "verified");
            const inv = db.invoices.find((i) => i.studentId === kid?.id) || db.invoices.find((i) => i.familyId === fam?.id);
            const tuitionOK = inv && inv.total > 0 && inv.paid >= inv.total && inv.balance === 0;
            const fa = db.familyAccountByFamily[fam?.id];
            const parents = (app.parentContacts || []).filter((p) => p.alive !== false);
            return (
              <div className="list-item spread" key={app.id} style={{ alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                  <div className="row" style={{ gap: "0.4rem", flexWrap: "wrap" }}>
                    <b>{fam?.children?.find((c) => c.id === kid?.id)?.name}</b>
                    <span className="badge gray">{kid?.campus === "preschool" ? "Pre-School" : "Main School"}</span>
                    <span className="badge gray">{app.status}</span>
                    {fa && <Badge tone="green">account created</Badge>}
                  </div>
                  <div className="small muted">
                    {kid?.class} · {fam?.name} family · parents: {parents.map((p) => `${p.name} (${p.phone})`).join(" + ")}
                  </div>
                  <div className="row" style={{ marginTop: "0.4rem", gap: "0.4rem", flexWrap: "wrap" }}>
                    <span className={`badge ${docsOK ? "green" : "gold"}`}>{docsOK ? "✓ Documents verified" : `${appDocs.length} doc(s), ${appDocs.filter((d) => d.status === "verified").length} verified`}</span>
                    <span className={`badge ${tuitionOK ? "green" : "gold"}`}>{tuitionOK ? "✓ Tuition cleared" : inv ? `Tuition ${(inv.total - inv.paid).toLocaleString()} UGX outstanding` : "No invoice"}</span>
                    {fa && <span className="badge blue">@{fa.username} · one shared login</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {fa ? (
                    <div className="small muted" style={{ maxWidth: 280 }}>
                      <b className="small">SMS sent to {parents.length} parent number(s)</b>
                      {parents.map((p) => (
                        <div key={p.phone} className="mono" style={{ fontSize: "0.82rem" }}>{p.phone}</div>
                      ))}
                      <div className="row" style={{ marginTop: "0.4rem", justifyContent: "flex-end" }}>
                        <a className="btn ghost sm" href={`/portal/setup?invite=${fa.inviteToken || ""}`}>Open invite setup</a>
                        <button className="btn ghost sm"
                          onClick={async () => {
                            try {
                              await act("resendFamilyInvite", { applicationId: app.id }, `Invite SMS re-sent to ${parents.length} parent number(s).`);
                            } catch (err) {
                              alert(err.message);
                            }
                          }}
                        >Re-send invite SMS</button>
                      </div>
                      <div style={{ marginTop: "0.5rem" }}>
                        <SchoolEmailControl db={db} familyId={fam.id} actor="Admissions — Mrs. Mary Kyomukama" />
                      </div>
                    </div>
                  ) : (
                    <div className="small muted" style={{ maxWidth: 240 }}>
                      {docsOK && tuitionOK ? "Ready — reconcile will create the account." : "Will auto-activate once docs are verified and tuition is cleared."}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "applicants" && (
        <div className="card">
          <h3>Admissions pipeline — applications & enrolments</h3>
          {[...db.applications].reverse().map((app) => {
            const kid = db.studentIndex[app.studentId];
            const fam = db.families.find((f) => f.id === kid?.familyId);
            const appDocs = db.documents.filter((d) => d.studentId === kid?.id);
            const docsOK = appDocs.length > 0 && appDocs.every((d) => d.status === "verified");
            const inv = db.invoices.find((i) => i.familyId === fam?.id && i.term === db.meta.currentTerm);
            const tuitionOK = inv && inv.total > 0 && inv.paid >= inv.total && inv.balance === 0;
            return (
              <div className="list-item spread" key={app.id} style={{ alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                  <div className="row" style={{ gap: "0.4rem", flexWrap: "wrap" }}>
                    <b style={kid?.campus === "preschool" ? { fontFamily: "var(--fpd)" } : undefined}>{kid?.name}</b>
                    <span className="badge gray">{kid?.campus === "preschool" ? "Pre-School" : "Main School"}</span>
                    {app.channel === "register" && <span className="badge blue">OS application</span>}
                    <Badge tone={app.status === "activated" ? "green" : app.status === "applied" ? "gold" : "gray"}>{app.status}</Badge>
                  </div>
                  <div className="small muted">{kid?.schoolId} · {kid?.class} · {app.intake} · {fam?.name} family</div>
                  <div className="row" style={{ marginTop: "0.4rem", gap: "0.4rem", flexWrap: "wrap" }}>
                    <span className={`badge ${docsOK ? "green" : "gold"}`}>{docsOK ? "✓ Documents verified" : `${appDocs.filter((d) => d.status === "verified").length}/${appDocs.length} documents verified`}</span>
                    <span className={`badge ${tuitionOK ? "green" : "gold"}`}>{tuitionOK ? "✓ Tuition cleared" : inv ? `${(inv.total - inv.paid).toLocaleString()} UGX outstanding` : "No invoice yet"}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="row" style={{ justifyContent: "flex-end", gap: "0.5rem" }}>
                    {appDocs.some((d) => d.status !== "verified") && (
                      <button className="btn secondary sm" onClick={() => setTab("docs")} title="Open the Document vault to verify records">Verify documents</button>
                    )}
                    {app.status === "in_progress" && <span className="small muted">Wizard in progress — family is still filling the form</span>}
                    {app.status === "applied" && !tuitionOK && inv && (
                      <a className="btn ghost sm" href="/admin/fees" title="Open fees to record payment">Collect fees</a>
                    )}
                  </div>
                  {fam && app.status !== "in_progress" && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <SchoolEmailControl db={db} familyId={fam.id} actor="Admissions — Mrs. Mary Kyomukama" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <p className="small muted" style={{ marginTop: "0.6rem" }}>
            New applications arrive here with automatic profile creation — parents fill the form once and the platform builds the records.
            Verify the document vault, then clear tuition: the family account and the child's portal link activate automatically (see Auto onboarding).
          </p>
        </div>
      )}

      {tab === "accounts" && (
        <div className="card">
          <table>
            <thead><tr><th>Student</th><th>Username</th><th>Supervised by</th><th>Created</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {db.studentAccounts.map((a) => {
                const kid = db.studentIndex[a.studentId];
                const fam = db.families.find((f) => f.id === kid?.familyId);
                return (
                  <tr key={a.id}>
                    <td><b>{kid?.name}</b><div className="small muted">{kid?.class}</div></td>
                    <td className="mono small">@{a.username}</td>
                    <td className="small">{fam?.name} family</td>
                    <td className="small">{fmtDate(a.createdAt)}</td>
                    <td><Badge tone={a.status === "active" ? "green" : "gold"}>{a.status}</Badge></td>
                    <td>
                      <button className="btn ghost sm"
                        onClick={() => act("updateStudentAccount", { accountId: a.id, status: a.status === "active" ? "paused" : "active" }, a.status === "active" ? "Account paused." : "Account resumed.")}
                      >
                        {a.status === "active" ? "Pause" : "Resume"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {db.studentAccounts.length === 0 && (
                <tr><td colSpan={6} className="muted small">No student accounts yet — parents create them from Parent Portal &gt; Student Accounts.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "leavers" && (
        <div className="card">
          <div className="spread" style={{ marginBottom: "0.6rem" }}>
            <div>
              <h3 style={{ margin: 0 }}>Leavers & alumni — account lifecycle</h3>
              <p className="small muted" style={{ margin: "0.25rem 0 0" }}>
                Accounts are created <b>once</b> (the family at first registration, one supervised account per student) and stay open for the
                student's entire time at the school — <b>an outstanding balance never locks anyone out of the OS</b>. When a student leaves or
                completes their academic years their accounts close; you then <b>delete the accounts</b> here — invoices, receipts and academic
                records are always retained.
              </p>
            </div>
            <Badge tone="blue">Admin action</Badge>
          </div>
          <table>
            <thead><tr><th>Student</th><th>Family</th><th>Tenure</th><th>Accounts</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>
              {db.families.flatMap((f) => f.children.map((c) => ({ c, f }))).map(({ c, f }) => {
                const sa = db.accountByStudent?.[c.id];
                const fa = db.familyAccountByFamily?.[f.id];
                const done = !!c.retirement;
                const allDone = f.children.every((x) => x.retirement);
                return (
                  <tr key={c.id}>
                    <td><b style={c.campus === "preschool" ? { fontFamily: "var(--fpd)" } : undefined}>{c.name}</b><div className="small muted">{c.schoolId} · {c.class}</div></td>
                    <td className="small">{f.name} family</td>
                    <td>
                      {done ? (
                        <Badge tone={c.retirement.outcome === "completed" ? "green" : "gray"}>
                          {c.retirement.outcome === "completed" ? "✓ completed academic years" : "left the school"} · {String(c.retirement.at).slice(0, 10)}
                        </Badge>
                      ) : (
                        <Badge tone="blue">enrolled</Badge>
                      )}
                    </td>
                    <td className="small">
                      {fa ? <div>family login <span className="mono">@{fa.username}</span> <Badge tone={fa.status === "closed" ? "gray" : "green"}>{fa.status}</Badge></div> : <div className="muted">family login deleted</div>}
                      {sa ? <div>student <span className="mono">@{sa.username}</span> <Badge tone={sa.status === "closed" ? "gray" : "green"}>{sa.status}</Badge></div> : <div className="muted">no student account</div>}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {!done ? (
                        <div className="row" style={{ justifyContent: "flex-end", gap: "0.4rem" }}>
                          <button className="btn secondary sm" onClick={() => { setRetireFor({ studentId: c.id, name: c.name, outcome: "completed" }); setRetireNote(""); }} title="Student finished their academic years">Mark completed</button>
                          <button className="btn ghost sm" onClick={() => { setRetireFor({ studentId: c.id, name: c.name, outcome: "left" }); setRetireNote(""); }} title="Student departed the school">Mark left</button>
                        </div>
                      ) : fa ? (
                        allDone ? (
                          <button className="btn sm" style={{ background: "var(--red, #b3261e)" }} onClick={() => { setDelFam(f.id); setDelConfirm(""); }}>Delete accounts</button>
                        ) : (
                          <span className="small muted" style={{ display: "inline-block", maxWidth: 220 }}>accounts stay open while siblings are still at school</span>
                        )
                      ) : (
                        <Badge tone="gray">accounts deleted · records kept</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {transition && (
        <Modal title={`Migrate ${db.studentIndex[transition.studentId]?.name} > Main School`} onClose={() => setTrId(null)}>
          <div className="quote" style={{ marginBottom: "0.9rem" }}>
            <b>What migrates automatically:</b> progress records, immunisation records, medical history, parent contacts, and birth certificate.
            <div className="small muted">No re-typing for Admissions, no re-filling forms for parents.</div>
          </div>
          <Field label="Target class">
            <input value={class_} onChange={(e) => setClass(e.target.value)} />
          </Field>
          <Field label="Notes (optional)">
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="quote" style={{ background: "var(--peri-l)", borderColor: "var(--maroon-2)" }}>
            <b>On enrolment the system will:</b>
            <div className="small">① move the pupil to the Main School campus · ② create a first-term invoice (tuition + records fee) ·
            ③ notify the Bursar and Admissions · ④ log everything in the audit trail.</div>
          </div>
          <button className="btn" style={{ width: "100%", marginTop: "0.9rem" }} disabled={busy} onClick={doEnroll}>
            {busy ? "Migrating…" : "Enrol & migrate records"}
          </button>
        </Modal>
      )}

      {retireFor && (
        <Modal title={`${retireFor.outcome === "completed" ? "Mark completed" : "Mark left"} — ${retireFor.name}`} onClose={() => setRetireFor(null)}>
          <div className="quote" style={{ marginBottom: "0.9rem" }}>
            {retireFor.outcome === "completed"
              ? `${retireFor.name} has finished their academic years at Gill.`
              : `${retireFor.name} is leaving the school.`}
            <div className="small muted" style={{ marginTop: "0.35rem" }}>
              Their student portal account closes immediately. If every child in the family is done, the family login closes too —
              you can then delete the accounts from this screen. Invoices, receipts and academic records are retained either way.
            </div>
          </div>
          <Field label="Note (optional — kept on the record)">
            <textarea rows={3} value={retireNote} onChange={(e) => setRetireNote(e.target.value)} placeholder="e.g. Graduated Year 6 · transferred to boarding school in Entebbe" />
          </Field>
          <button
            className="btn"
            style={{ width: "100%", marginTop: "0.9rem" }}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await act(
                  "retireStudent",
                  { studentId: retireFor.studentId, outcome: retireFor.outcome, note: retireNote, actor: "Admissions — Mrs. Mary Kyomukama" },
                  `${retireFor.name} marked ${retireFor.outcome === "completed" ? "completed" : "left"} — accounts closed, records retained.`
                );
                setRetireFor(null);
              } catch (e) {
                alert(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Confirm & close accounts"}
          </button>
        </Modal>
      )}

      {delFam && (
        <Modal title={`Delete accounts — ${db.families.find((f) => f.id === delFam)?.name} family`} onClose={() => setDelFam(null)}>
          <div className="quote" style={{ background: "#fdecea", borderColor: "var(--red, #b3261e)", marginBottom: "0.9rem" }}>
            <b>This deletes the login accounts — not the records.</b>
            <div className="small muted" style={{ marginTop: "0.35rem" }}>
              The family login (and any personalised school mailbox record) and all student portal accounts for this family are removed.
              Invoices, receipts, applications and academic records stay with the school office.
            </div>
          </div>
          <Field label={`Type the family name to confirm (${db.families.find((f) => f.id === delFam)?.name})`}>
            <input value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} spellCheck={false} />
          </Field>
          <button
            className="btn"
            style={{ width: "100%", marginTop: "0.9rem", background: "var(--red, #b3261e)" }}
            disabled={busy || delConfirm.trim() !== db.families.find((f) => f.id === delFam)?.name}
            onClick={async () => {
              setBusy(true);
              try {
                await act(
                  "deleteFamilyAccounts",
                  { familyId: delFam, confirm: delConfirm.trim(), actor: "Admissions — Mrs. Mary Kyomukama" },
                  "Accounts deleted — financial & academic records retained."
                );
                setDelFam(null);
              } catch (e) {
                alert(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Deleting…" : "Permanently delete accounts"}
          </button>
        </Modal>
      )}
    </div>
  );
}
