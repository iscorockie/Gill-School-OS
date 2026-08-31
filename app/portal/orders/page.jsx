"use client";
import { useState } from "react";
import { useApp, Badge, Field, fmtUGX } from "@/components/ui.jsx";
import { currentFamily } from "@/lib/client.js";

export default function OrdersPage() {
  const { db, act } = useApp();
  const [studentId, setStudentId] = useState("");
  const [cart, setCart] = useState({});
  const [busy, setBusy] = useState(false);
  if (!db) return <div className="card">Loading…</div>;

  const family = currentFamily(db, "u-parent-1");
  const student = db.studentIndex[studentId || family.children[0]?.id];
  const items = Object.values(cart);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const myOrders = db.orders.filter((o) => student && o.studentId === student.id);

  function add(sku) {
    const c = db.catalog.find((x) => x.sku === sku);
    setCart((prev) => ({ ...prev, [sku]: { ...c, qty: (prev[sku]?.qty || 0) + 1 } }));
  }
  function sub(sku) {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[sku]) return prev;
      next[sku].qty -= 1;
      if (next[sku].qty <= 0) delete next[sku];
      return next;
    });
  }

  async function placeOrder() {
    setBusy(true);
    try {
      await act("placeOrder", {
        studentId: student.id,
        items: items.map(({ sku, name, type, size, price, qty }) => ({ sku, name, type, size, price, qty })),
      }, `Pre-order placed for ${student.name} — the school has already reserved exact quantities. Pay online or at front office.`);
      setCart({});
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Uniform & Book Pre-Orders</h2>
        <span className="muted small">Order exact quantities before term start — no dead stock, no last-minute shortages</span>
      </div>

      <div className="card gips" style={{ marginBottom: "1.2rem" }}>
        <b>⏰ Order for {db.meta.currentTerm} closes Friday 4 September.</b>
        <p className="small muted" style={{ margin: "0.2rem 0 0" }}>
          Items are collected on the first day of term. Payment online (Mobile Money / card) or at the Bursar's office.
        </p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="spread">
            <h3>🛒 Catalogue</h3>
            <Field label="Ordering for">
              <select value={student?.id} onChange={(e) => setStudentId(e.target.value)}>
                {family.children.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.class}</option>)}
              </select>
            </Field>
          </div>
          <div className="spread" style={{ display: "block" }}>
            {db.catalog.map((c) => (
              <div className="list-item" key={c.sku}>
                <div className="spread">
                  <div>
                    <b>{c.name}</b>
                    <div className="small muted">{c.sku} · {c.size} · {fmtUGX(c.price)}</div>
                  </div>
                  <div className="row">
                    {cart[c.sku] && (
                      <>
                        <button className="btn ghost sm" onClick={() => sub(c.sku)}>−</button>
                        <b>{cart[c.sku].qty}</b>
                        <button className="btn ghost sm" onClick={() => add(c.sku)}>+</button>
                      </>
                    )}
                    <button className="btn secondary sm" onClick={() => add(c.sku)}>{cart[c.sku] ? "Add one" : "Add"}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>🧾 Order summary</h3>
          {items.length === 0 && <p className="muted small">Nothing selected yet.</p>}
          {items.map((i) => (
            <div className="list-item" key={i.sku}>
              <div className="spread">
                <span>{i.name} × {i.qty}</span>
                <b>{fmtUGX(i.price * i.qty)}</b>
              </div>
            </div>
          ))}
          {items.length > 0 && (
            <>
              <div className="spread" style={{ margin: "0.5rem 0" }}>
                <b>Total</b>
                <b style={{ fontSize: "1.15rem" }}>{fmtUGX(total)}</b>
              </div>
              <button className="btn gold" disabled={busy} onClick={placeOrder}>Place pre-order →</button>
            </>
          )}

          <h3 style={{ marginTop: "1.4rem" }}>📦 Your orders</h3>
          {myOrders.length === 0 && <p className="muted small">No orders yet.</p>}
          {myOrders.map((o) => (
            <div className="list-item" key={o.id}>
              <div className="spread">
                <div>
                  <b>{o.term}</b>
                  <div className="small muted">{o.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <b>{fmtUGX(o.total)}</b>
                  <div><Badge tone={o.status === "paid" ? "green" : "gold"}>{o.status}</Badge></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
