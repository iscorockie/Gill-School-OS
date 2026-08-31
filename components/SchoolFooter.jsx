"use client";
// Shared school footer — keeps the landing, register and every public page in
// perfect sync. Content is the approved, final footer (contacts, portals,
// copyright, Lubech.tech). "Gill Pre-School" links to the pre-school campus
// site and "Gill International School" links to the main school site; both
// respond on every breakpoint.
import Icon from "./icons.jsx";

export default function SchoolFooter() {
  return (
    <footer className="footer-dark" style={{ marginTop: "2.8rem", padding: "2.6rem 0 1.6rem" }}>
      <div className="container">
        <div className="footer-grid">
          <div className="f-brand">
            <div className="row" style={{ gap: "0.8rem" }}>
              <img src="/logo.png" alt="Gill International School logo" style={{ height: 54, borderRadius: 10, background: "#fff", padding: "4px 8px" }} />
              <div>
                <b style={{ fontFamily: "var(--fd)", fontSize: "1.1rem", display: "block", color: "#fff" }}>Gill School OS</b>
                <span className="small" style={{ color: "#cbb9bb" }}>
                  <a href="https://www.gill.ac.ug/#home" target="_blank" rel="noreferrer" className="footer-site-link" title="Gill International School website">Gill International School</a>
                  {" & "}
                  <a href="https://preschool.gillschool.ac.ug" target="_blank" rel="noreferrer" className="footer-site-link" title="Gill Pre-School website">Gill Pre-School</a>
                </span>
              </div>
            </div>
            <p className="small" style={{ margin: "1rem 0 0", color: "#cbb9bb", maxWidth: 340 }}>
              One campus platform — parents, staff and students each work in their own portal.
            </p>
          </div>

          <div>
            <b className="f-title">Call or WhatsApp</b>
            <div className="f-links" style={{ marginTop: "0.7rem", gap: "0.55rem" }}>
              {["+256 771 648 684", "+256 755 071 456", "+256 783 003 231"].map((n) => {
                const digits = n.replace(/\s/g, "");
                return (
                  <span className="row" key={n} style={{ gap: "0.5rem" }}>
                    <a href={`tel:${digits}`} className="row" style={{ gap: "0.5rem", color: "#efe4e5" }}>
                      <Icon name="phone" size={15} /> {n}
                    </a>
                    <a href={`https://wa.me/${digits.slice(1)}`} target="_blank" rel="noreferrer" title={`WhatsApp ${n}`} style={{ color: "var(--leaf)", opacity: 0.85 }}>
                      <Icon name="chat" size={14} /> WhatsApp
                    </a>
                  </span>
                );
              })}
              <a href="mailto:info.gillschool@gmail.com" className="row" style={{ gap: "0.5rem", color: "#efe4e5", marginTop: "0.25rem" }}>
                <Icon name="mail" size={15} /> info.gillschool@gmail.com
              </a>
            </div>
          </div>

          <div>
            <b className="f-title">Portals</b>
            <div className="f-links" style={{ marginTop: "0.7rem" }}>
              <a href="/portal/login" className="row" style={{ gap: "0.5rem" }}><Icon name="users" size={15} /> Parents&rsquo; Portal</a>
              <a href="/staff" className="row" style={{ gap: "0.5rem" }}><Icon name="grad" size={15} /> Staff Portal</a>
              <a href="/student/login" className="row" style={{ gap: "0.5rem" }}><Icon name="user" size={15} /> Student Portal</a>
              <a href="/api/ics?campus=all" className="row" style={{ gap: "0.5rem" }}><Icon name="calendar" size={15} /> School calendar (.ics)</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Gill International School · Excellence, Integrity, Service — Gill School OS. All rights reserved.</span>
          <span>Powered by <a href="https://lubech.tech" target="_blank" rel="noreferrer">Lubech.tech</a></span>
        </div>
      </div>
    </footer>
  );
}
