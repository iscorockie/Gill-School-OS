"use client";
// New-family application wizard — follows the school's existing 6 steps:
// 1 Basic Information · 2 Parent Details · 3 Emergency Contacts · 4 Documents
// · 5 Payment · 6 Review & Submit.
// Each step is saved to the OS; step 6 submits the application. Once the
// Admissions registrar verifies documents + tuition, the parent gets the
// child's portal link by SMS (see lib/store.js auto-onboarding).
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons.jsx";
import { AppProvider, useApp, Progress, Badge } from "@/components/ui.jsx";
import { ParentProvider, useParent } from "@/components/ParentProvider.jsx";

export default function ApplyPage() {
  return (
    <AppProvider>
      <ParentProvider>
        <ApplyWizard />
      </ParentProvider>
    </AppProvider>
  );
}

const STEPS = [
  { key: "basic", label: "Basic Information", ico: "user" },
  { key: "parent", label: "Parent Details", ico: "users" },
  { key: "emergency", label: "Emergency Contacts", ico: "phone" },
  { key: "documents", label: "Documents", ico: "file" },
  { key: "payment", label: "Payment", ico: "wallet" },
  { key: "review", label: "Review & Submit", ico: "checkCircle" },
];

const CAMPUS_CLASSES = {
  preschool: ["Daycare (1–2 yrs)", "Toddlers (2–3 yrs)", "Nursery (3–4 yrs)", "Reception (4–5 yrs)"],
  main: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "Year 7 (Lower Secondary)", "Year 8 (Lower Secondary)", "Year 9 (Lower Secondary)", "Year 10 (IGCSE)", "Year 11 (IGCSE)", "Year 12 (A Level)", "Year 13 (A Level)"],
};

const DOCS = {
  preschool: [
    { type: "Birth certificate", label: "Birth certificate or affidavit of birth" },
    { type: "Immunisation record", label: "Immunisation record (UPEP / health card)" },
    { type: "Passport photographs", label: "Two passport photographs" },
  ],
  main: [
    { type: "Birth certificate", label: "Birth certificate & immunisation record" },
    { type: "Previous school report", label: "Last two termly school reports" },
    { type: "Passport photograph", label: "Passport photograph" },
    { type: "School reference", label: "Reference from the previous school" },
  ],
};

const EMPTY = {
  basic: { firstName: "", lastName: "", dob: "", gender: "", campus: "preschool", class: "Nursery (3–4 yrs)", intake: "Term 3 2026" },
  parent: { contacts: [{ name: "", relation: "Mother / Guardian", phone: "", email: "", alive: true }, { name: "", relation: "Father", phone: "", email: "", alive: true }] },
  emergency: { contacts: [{ name: "", relation: "", phone: "" }, { name: "", relation: "", phone: "" }] },
  documents: { files: [] },
  payment: { method: "payNow", channel: "MTN Mobile Money", phone: "" },
  review: {},
};

function ApplyWizard() {
  const { db, act, load } = useApp();
  const { session, ready } = useParent();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => JSON.parse(JSON.stringify(EMPTY)));
  const [appId, setAppId] = useState(null);
  const [banner, setBanner] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/register");
      return;
    }
    if (db) {
      const app = db.applications.find(
        (a) => a.studentId && db.studentIndex[a.studentId]?.familyId === session.familyId && a.status === "in_progress"
      );
      if (app) {
        setAppId(app.id);
        const merged = JSON.parse(JSON.stringify(EMPTY));
        const kid = db.studentIndex[app.studentId];
        if (kid) {
          merged.basic = {
            firstName: kid.name.split(" ")[0] || "", lastName: kid.name.split(" ").slice(1).join(" "),
            dob: kid.dob || "", gender: kid.gender || "", campus: kid.campus, class: kid.class,
            intake: app.intake,
          };
        }
        if (app.parentContacts?.length) merged.parent.contacts = app.parentContacts.map((c) => ({ ...c, email: c.email || "" }));
        if (app.emergencyContacts?.length) merged.emergency.contacts = [...app.emergencyContacts, ...EMPTY.emergency.contacts].slice(0, 2);
        if (app.documents?.length) merged.documents.files = app.documents.map((f) => ({ type: f.type, label: "", name: f.name, size: f.size }));
        if (app.payment) merged.payment = { ...merged.payment, ...app.payment };
        const idx = STEPS.findIndex((s) => !app.steps?.[s.key]);
        setData(merged);
        setStep(idx === -1 ? 5 : idx);
      } else if (db.applications.some((a) => a.studentId && db.studentIndex[a.studentId]?.familyId === session.familyId && (a.status === "applied" || a.status === "activated"))) {
        setSubmitted(true); // already submitted / verified — show status
      }
      setLoaded(true);
    }
  }, [db, ready, session, router]);

  const fee = useMemo(() => {
    const c = data.basic.campus;
    if (!c) return { total: 0, lines: [] };
    const isPre = c === "preschool";
    return isPre
      ? { total: 500000, lines: [{ label: "Pre-School Tuition (term)", amount: 450000 }, { label: "Registration & first-term materials", amount: 50000 }] }
      : { total: 1000000, lines: [{ label: "Main School Tuition (term)", amount: 850000 }, { label: "Entrance assessment fee", amount: 150000 }] };
  }, [data.basic.campus]);

  async function save(goNext = true) {
    setError("");
    if (step === 0 && (!data.basic.firstName || !data.basic.lastName || !data.basic.dob)) return setError("Please fill the child's name and date of birth.");
    if (step === 1) {
      const valid = data.parent.contacts.filter((c) => c.name && c.phone);
      if (!valid.length) return setError("Add at least one parent / guardian with a phone number.");
    }
    if (step === 2) {
      const valid = data.emergency.contacts.filter((c) => c.name && c.phone);
      if (!valid.length) return setError("Add at least one emergency contact with a phone number.");
    }
    if (step === 3) {
      const req = DOCS[data.basic.campus] || [];
      const needed = req.filter((d) => !data.documents.files.some((f) => f.type === d.type));
      if (needed.length) return setError(`Please attach: ${needed.map((d) => d.label).join(" · ")}`);
    }
    if (step === 4 && data.payment.method === "payNow" && !data.payment.phone) return setError("Add the mobile-money number that will pay.");
    setBusy(true);
    try {
      const payload = { familyId: session.familyId, step: STEPS[step].key, data: data[STEPS[step].key] };
      if (step === 5) {
        const r = await act("submitApplication", { applicationId: appId }, "Application submitted!");
        setAppId(r.application.id);
        setSubmitted(true);
        return;
      }
      const r = await act("saveApplication", payload, "Saved");
      if (!appId) setAppId(r.application.id);
      if (step === 1) setBanner("Parent/guardian details saved successfully! Please continue with emergency contacts.");
      if (goNext) setStep((s) => Math.min(5, s + 1));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !loaded) return <div className="auth-wrap"><div className="auth-card">Loading application…</div></div>;

  if (submitted) {
    const app = db?.applications?.find((a) => a.id === appId) || db?.applications?.find((a) => a.studentId && db.studentIndex[a.studentId]?.familyId === session.familyId);
    const kid = app && db.studentIndex[app.studentId];
    return (
      <div className="auth-wrap">
        <div className="auth-card" style={{ maxWidth: 560 }}>
          <div style={{ textAlign: "center", marginBottom: "1.1rem" }}>
            <div className="big-avatar" style={{ margin: "0 auto 0.8rem" }}><Icon name="checkCircle" size={30} /></div>
            <h1>Application received</h1>
            <p className="small muted" style={{ margin: "0.4rem 0 0" }}>
              Thank you — {kid?.name || "your application"} ({kid?.schoolId || "ref pending"}) is with our Admissions team for {app?.intake || "the next intake"}.
            </p>
          </div>
          <div className="card" style={{ background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none" }}>
            <b className="small">What happens next</b>
            <ol className="small" style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem", display: "grid", gap: "0.4rem" }}>
              <li>Our Admissions registrar reviews {app?.documents?.length || 0} document(s) and the term invoice.</li>
              <li>Once records are verified and tuition is cleared, both parents on the form receive an <b>SMS</b>.</li>
              <li>The SMS carries your shared family login <b>and the link to {kid?.name?.split(" ")[0] || "your child"}'s portal</b>.</li>
            </ol>
          </div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: "1.1rem" }}>
            <a href="/portal/login" className="btn secondary sm">Open Parent Portal →</a>
            <a href="/" className="small">School home</a>
          </div>
        </div>
      </div>
    );
  }

  const s = STEPS[step];
  return (
    <main className="apply-shell">
      <nav className="land-nav">
        <div className="container inner">
          <a href="/" aria-label="Gill School OS home" className="nav-badge"><img src="/logo.png" alt="" /></a>
          <div className="links">
            <a href="/#platform">Platform</a>
            <a href="/#find-us">Find Us</a>
          </div>
          <div className="cta"><a href="/portal" className="btn gold" style={{ padding: "0.55rem 1.3rem", fontSize: "0.85rem" }}>Parent Portal</a></div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
        <div className="section-head" style={{ marginBottom: "1.2rem" }}>
          <div>
            <span className="kicker-sm">{session.familyName} family · {session.username}</span>
            <h2><Icon name="file" size={24} /> Application for admission</h2>
          </div>
          <span className="muted small">6 steps — each one saves automatically</span>
        </div>

        <Progress pct={((step + 1) / 6) * 100} />
        <div className="wizard-grid">
          <ol className="wizard-steps">
            {STEPS.map((st, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={st.key} className={`${active ? "active" : ""} ${done ? "done" : ""}`} onClick={() => i < step && setStep(i)}>
                  <span className="wiz-num">{done ? <Icon name="check" size={14} /> : i + 1}</span>
                  <span><b>{st.label}</b><br /><span className="small">{st.ico ? "" : ""}{done ? "Complete" : active ? "Current — fill below" : "Up next"}</span></span>
                </li>
              );
            })}
          </ol>

          <div className="card wizard-card">
            <div className="spread" style={{ marginBottom: "0.8rem" }}>
              <h3 style={{ margin: 0 }}><Icon name={s.ico} size={20} /> {s.label}</h3>
              <Badge tone="blue">Step {step + 1} of 6</Badge>
            </div>

            {step === 0 && (
              <div className="form-grid">
                <label className="field"><span className="small fw700">Child's first name</span>
                  <input value={data.basic.firstName} onChange={(e) => setData((d) => ({ ...d, basic: { ...d.basic, firstName: e.target.value } }))} placeholder="e.g. Kirabo" /></label>
                <label className="field"><span className="small fw700">Last name</span>
                  <input value={data.basic.lastName} onChange={(e) => setData((d) => ({ ...d, basic: { ...d.basic, lastName: e.target.value } }))} placeholder="Family name" /></label>
                <label className="field"><span className="small fw700">Date of birth</span>
                  <input type="date" value={data.basic.dob} onChange={(e) => setData((d) => ({ ...d, basic: { ...d.basic, dob: e.target.value } }))} /></label>
                <label className="field"><span className="small fw700">Gender</span>
                  <select value={data.basic.gender} onChange={(e) => setData((d) => ({ ...d, basic: { ...d.basic, gender: e.target.value } }))}>
                    <option value="">—</option><option>F</option><option>M</option>
                  </select></label>
                <label className="field"><span className="small fw700">Campus</span>
                  <select value={data.basic.campus} onChange={(e) => {
                    const campus = e.target.value;
                    setData((d) => ({ ...d, basic: { ...d.basic, campus, class: CAMPUS_CLASSES[campus][0] } }));
                  }}>
                    <option value="preschool">Gill Pre-School (Early Years)</option>
                    <option value="main">Gill International School</option>
                  </select></label>
                <label className="field"><span className="small fw700">Class / level</span>
                  <select value={data.basic.class} onChange={(e) => setData((d) => ({ ...d, basic: { ...d.basic, class: e.target.value } }))}>
                    {CAMPUS_CLASSES[data.basic.campus].map((c) => <option key={c}>{c}</option>)}
                  </select></label>
                <label className="field" style={{ gridColumn: "1 / -1" }}><span className="small fw700">Proposed intake</span>
                  <select value={data.basic.intake} onChange={(e) => setData((d) => ({ ...d, basic: { ...d.basic, intake: e.target.value } }))}>
                    <option>Term 3 2026</option><option>January 2027</option><option>April 2027</option><option>September 2027</option>
                  </select></label>
              </div>
            )}

            {step === 1 && (
              <div>
                {banner && (
                  <div className="save-banner"><Icon name="checkCircle" size={17} /> {banner}</div>
                )}
                <p className="small muted">Both parents on this form share ONE family login. Enter every surviving parent / guardian of the child.</p>
                {data.parent.contacts.map((c, i) => (
                  <div className="card sub" key={i}>
                    <div className="spread"><b className="small">Parent / guardian {i + 1}</b>
                      <label className="row" style={{ gap: "0.4rem" }}><input type="checkbox" checked={c.alive !== false} onChange={(e) => setData((d) => {
                        const contacts = [...d.parent.contacts]; contacts[i] = { ...contacts[i], alive: e.target.checked }; return { ...d, parent: { ...d.parent, contacts } };
                      })} /><span className="small">Alive</span></label>
                    </div>
                    <div className="form-grid">
                      <label className="field"><span className="small fw700">Full name</span>
                        <input value={c.name} onChange={(e) => setData((d) => { const contacts = [...d.parent.contacts]; contacts[i] = { ...contacts[i], name: e.target.value }; return { ...d, parent: { ...d.parent, contacts } }; })} /></label>
                      <label className="field"><span className="small fw700">Relation</span>
                        <select value={c.relation} onChange={(e) => setData((d) => { const contacts = [...d.parent.contacts]; contacts[i] = { ...contacts[i], relation: e.target.value }; return { ...d, parent: { ...d.parent, contacts } }; })}>
                          <option>Mother / Guardian</option><option>Father</option><option>Other guardian</option>
                        </select></label>
                      <label className="field"><span className="small fw700">Mobile (SMS)</span>
                        <input value={c.phone} onChange={(e) => setData((d) => { const contacts = [...d.parent.contacts]; contacts[i] = { ...contacts[i], phone: e.target.value }; return { ...d, parent: { ...d.parent, contacts } }; })} placeholder="+2567…" /></label>
                      <label className="field"><span className="small fw700">Email</span>
                        <input value={c.email} onChange={(e) => setData((d) => { const contacts = [...d.parent.contacts]; contacts[i] = { ...contacts[i], email: e.target.value }; return { ...d, parent: { ...d.parent, contacts } }; })} /></label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="small muted">Who should we contact if we cannot reach you during school hours?</p>
                {data.emergency.contacts.map((c, i) => (
                  <div className="card sub" key={i}>
                    <b className="small">Emergency contact {i + 1}</b>
                    <div className="form-grid">
                      <label className="field"><span className="small fw700">Full name</span>
                        <input value={c.name} onChange={(e) => setData((d) => { const contacts = [...d.emergency.contacts]; contacts[i] = { ...contacts[i], name: e.target.value }; return { ...d, emergency: { ...d.emergency, contacts } }; })} /></label>
                      <label className="field"><span className="small fw700">Relation</span>
                        <input value={c.relation} onChange={(e) => setData((d) => { const contacts = [...d.emergency.contacts]; contacts[i] = { ...contacts[i], relation: e.target.value }; return { ...d, emergency: { ...d.emergency, contacts } }; })} placeholder="e.g. Aunt, neighbour" /></label>
                      <label className="field"><span className="small fw700">Phone</span>
                        <input value={c.phone} onChange={(e) => setData((d) => { const contacts = [...d.emergency.contacts]; contacts[i] = { ...contacts[i], phone: e.target.value }; return { ...d, emergency: { ...d.emergency, contacts } }; })} placeholder="+2567…" /></label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="small muted">Attach the required records for {data.basic.campus === "preschool" ? "Gill Pre-School" : "the Main School"}. They're verified once, then never re-typed.</p>
                {DOCS[data.basic.campus].map((d) => {
                  const f = data.documents.files.find((x) => x.type === d.type);
                  return (
                    <div className="list-item spread" key={d.type}>
                      <div>
                        <b className="small">{d.label}</b>
                        <div className="small muted">{f ? `${f.name} · ${f.size || "—"}` : "Not attached yet"}</div>
                      </div>
                      <label className="btn secondary sm" style={{ cursor: "pointer" }}>
                        {f ? "Replace" : "Attach"}
                        <input type="file" style={{ display: "none" }} onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setData((dd) => {
                            const rest = dd.documents.files.filter((x) => x.type !== d.type);
                            return { ...dd, documents: { files: [...rest, { type: d.type, label: d.label, name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB` }] } };
                          });
                        }} />
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="card sub">
                  <b className="small">Term invoice preview</b>
                  {fee.lines.map((l) => (
                    <div className="spread small" key={l.label}><span>{l.label}</span><b>{l.amount.toLocaleString()} UGX</b></div>
                  ))}
                  <div className="spread" style={{ borderTop: "1px solid var(--line)", paddingTop: "0.4rem", marginTop: "0.3rem" }}>
                    <b>Total due</b><b style={{ fontFamily: "var(--fd)", fontSize: "1.05rem" }}>{fee.total.toLocaleString()} UGX</b>
                  </div>
                </div>
                <div className="row" style={{ gap: "0.5rem", margin: "0.9rem 0" }}>
                  <label className={`perm ${data.payment.method === "payNow" ? "" : "off"}`}><input type="radio" checked={data.payment.method === "payNow"} onChange={() => setData((d) => ({ ...d, payment: { ...d.payment, method: "payNow" } }))} /> <span><b>Pay now by mobile money</b><br /><span className="small muted">Instant receipt, admission processed faster</span></span></label>
                  <label className={`perm ${data.payment.method === "atSchool" ? "" : "off"}`}><input type="radio" checked={data.payment.method === "atSchool"} onChange={() => setData((d) => ({ ...d, payment: { ...d.payment, method: "atSchool" } }))} /> <span><b>Pay at the school office</b><br /><span className="small muted">Bursar desk, weekdays 8:00 am – 4:00 pm</span></span></label>
                </div>
                {data.payment.method === "payNow" && (
                  <div className="form-grid">
                    <label className="field"><span className="small fw700">Channel</span>
                      <select value={data.payment.channel} onChange={(e) => setData((d) => ({ ...d, payment: { ...d.payment, channel: e.target.value } }))}>
                        <option>MTN Mobile Money</option><option>Airtel Money</option>
                      </select></label>
                    <label className="field"><span className="small fw700">Paying from (phone)</span>
                      <input value={data.payment.phone} onChange={(e) => setData((d) => ({ ...d, payment: { ...d.payment, phone: e.target.value } }))} placeholder="+2567…" /></label>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div>
                <div className="review-grid">
                  <div className="card sub"><b className="small">Child</b>
                    <div>{data.basic.firstName} {data.basic.lastName} · {data.basic.gender || "—"}</div>
                    <div className="small muted">{data.basic.class} · {data.basic.campus === "preschool" ? "Gill Pre-School" : "Main School"} · {data.basic.intake}</div>
                  </div>
                  <div className="card sub"><b className="small">Parents (one shared login)</b>
                    {data.parent.contacts.filter((c) => c.name).map((c) => <div className="small" key={c.phone}>{c.name} · {c.relation} · {c.phone}</div>)}
                  </div>
                  <div className="card sub"><b className="small">Emergency contacts</b>
                    {data.emergency.contacts.filter((c) => c.name).map((c) => <div className="small" key={c.phone}>{c.name} · {c.relation} · {c.phone}</div>)}
                  </div>
                  <div className="card sub"><b className="small">Documents</b>
                    {data.documents.files.map((f) => <div className="small" key={f.type}>{f.name}</div>)}
                  </div>
                  <div className="card sub"><b className="small">Payment</b>
                    <div className="small">{fee.total.toLocaleString()} UGX — {data.payment.method === "payNow" ? `${data.payment.channel} (${data.payment.phone})` : "to be paid at the school office"}</div>
                  </div>
                  <div className="card sub"><b className="small">Submission</b>
                    <div className="small">Submitting creates the application and a term invoice; the Admissions registrar reviews the documents.</div>
                  </div>
                </div>
                <label className="row" style={{ gap: "0.5rem", margin: "0.3rem 0 0.9rem", alignItems: "flex-start" }}>
                  <input type="checkbox" required style={{ marginTop: 2 }} /> <span className="small">I confirm the information above is correct. The application form is one per family; documents may be verified by the school.</span>
                </label>
              </div>
            )}

            {error && <p className="small" style={{ color: "var(--red)", margin: "0.4rem 0 0" }}>{error}</p>}

            <div className="row" style={{ justifyContent: "space-between", marginTop: "1.1rem" }}>
              <button className="btn ghost" disabled={busy || step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>← Back</button>
              <button className="btn" disabled={busy} onClick={() => save()}>
                {busy ? "Saving…" : step === 5 ? "Submit application" : "Save & continue →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
