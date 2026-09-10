"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/icons.jsx";

const STORAGE_KEY = "gill_privacy_choice";

export default function PrivacyBanner() {
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);

  useEffect(() => {
    try {
      setVisible(!localStorage.getItem(STORAGE_KEY));
    } catch {
      setVisible(true);
    }
  }, []);

  function choose(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Consent still applies for this browser session when storage is blocked.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="privacy-banner" role="dialog" aria-modal="false" aria-labelledby="privacy-title">
      <div className="privacy-copy">
        <span className="privacy-icon"><Icon name="shield" size={21} /></span>
        <div>
          <h2 id="privacy-title">Your privacy matters</h2>
          <p>
            We use essential cookies to keep Gill School OS secure and remember your session. With your permission,
            optional cookies help us understand and improve the platform.
          </p>
          {details && (
            <p className="privacy-details">
              Declining keeps only cookies required for sign-in, security and core school services. We do not sell
              family or student information.
            </p>
          )}
          <button className="privacy-link" type="button" onClick={() => setDetails((open) => !open)} aria-expanded={details}>
            {details ? "Hide details" : "Learn about your choices"}
          </button>
        </div>
      </div>
      <div className="privacy-actions">
        <button className="btn privacy-decline" type="button" onClick={() => choose("essential")}>Essential only</button>
        <button className="btn gold" type="button" onClick={() => choose("accepted")}>Accept all</button>
      </div>
    </aside>
  );
}
