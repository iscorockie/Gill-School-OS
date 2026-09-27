// Centralised action dispatcher: every mutation in the demo goes through
// POST /api/action { type, payload } -> { ok, db }.

import fs from "fs";
import path from "path";
import { getDB, saveDB, uid } from "./store.js";
import { LATE_FEE, LATE_CUTOFF, SIBLING_DISCOUNT_RATE, TERM, STAFF_ROLE_LABELS, STAFF_EMAIL_DOMAIN } from "./seed.js";
import { hashPassword, setPasswordOn } from "./password.js";
import {
  isMailConfigured,
  mailProviderLabel,
  portalBaseUrl,
  sendMail,
  sendVerificationCode,
  sendStaffInvite,
  sendPasswordReset,
  sendWelcomeFamily,
  sendReceipt,
} from "./mail.js";

function now() {
  return new Date().toISOString();
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function hourMinute() {
  return new Date().toTimeString().slice(0, 5);
}

const actions = {
  // ---- Gate / late pickup -------------------------------------------------
  checkout({ db, payload }) {
    const { studentId, collector } = payload;
    const student = db.studentIndex[studentId];
    if (!student) throw new Error("Unknown student");
    // Real gatepads send only the actual clock time; the gate console may pass
    // timeOut to simulate a late checkout in the demo.
    const timeOut = payload.timeOut || hourMinute();
    const late = timeOut > LATE_CUTOFF;
    const pickup = {
      id: uid("pk"),
      studentId,
      date: today(),
      timeOut,
      collector,
      late,
      fee: late ? LATE_FEE : 0,
      billedTo: null,
      notified: false,
    };
    db.pickups.unshift(pickup);

    if (late) {
      // Auto-bill: find/derive the family's current-term invoice and add the line.
      const fam = db.families.find((f) => f.id === student.familyId);
      let inv = db.invoices.find((i) => i.familyId === fam.id && i.term === TERM);
      if (!inv) {
        inv = {
          id: uid("inv"), familyId: fam.id, term: TERM, issued: today(), due: today(),
          status: "unpaid", lines: [], siblingDiscount: 0, total: 0, paid: 0, balance: 0,
        };
        db.invoices.push(inv);
      }
      inv.lines.push({
        studentId, label: `Late pickup — ${today()} ${timeOut}`, kind: "latefee",
        amount: LATE_FEE, discount: 0,
      });
      inv.status = inv.balance > 0 ? "partial" : "unpaid";
      pickup.billedTo = inv.id;

      // Automated polite notification (SMS + in-app)
      db.messages.push({
        id: uid("m"), from: "u-gate", to: fam.parentUserId,
        subject: "Late collection notice",
        body: `Dear ${fam.name} family, ${student.name} was collected at ${timeOut} today. A UGX ${LATE_FEE.toLocaleString()} late-collection fee has been added to your fee account automatically. The gate closes for pickup at ${LATE_CUTOFF}. Thank you.`,
        date: today(), read: false, channel: "sms",
      });
      db.deliveries.push({
        id: uid("d"), channel: "SMS", to: fam.phone, ref: "auto",
        subject: "Late collection notice", status: "delivered",
        provider: "MTN SMS Gateway (simulated)", date: now(),
      });
      pickup.notified = true;

      db.feesAudit.unshift({
        id: uid("fa"), date: `${today()} ${timeOut}`, actor: "System",
        action: `Late collection ${timeOut} — ${student.name}; UGX ${LATE_FEE.toLocaleString()} added to family account`,
        amount: LATE_FEE,
      });
    }
    return pickup;
  },

  // ---- Payments / reconciliation -------------------------------------------
  async payInvoice({ db, payload }) {
    const { invoiceId, amount, channel, phone } = payload;
    const inv = db.invoices.find((i) => i.id === invoiceId);
    if (!inv) throw new Error("Invoice not found");
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) throw new Error("Enter a valid payment amount.");
    const fam = db.families.find((f) => f.id === inv.familyId);
    const balance = Math.max(0, inv.total - inv.paid);
    const pay = Math.min(Number(amount), balance);
    if (pay <= 0) throw new Error("Nothing to pay");

    const payment = {
      id: uid("pay"), invoiceId, familyId: inv.familyId, amount: pay, channel,
      reference: channel === "MTN Mobile Money" ? `MTN-${Math.floor(10000 + Math.random() * 89999)}-${Math.floor(Math.random() * 9)}` :
        channel === "Airtel Money" ? `AIR-${Math.floor(10000 + Math.random() * 89999)}-${Math.floor(Math.random() * 9)}` :
        `VISA-${String(Math.floor(1000000 + Math.random() * 8999999))}`,
      phone: phone || "", date: today(), receipt: `RCP-2026-${String(db.payments.length + 100).padStart(4, "0")}`,
      status: "settled",
    };
    db.payments.push(payment);
    inv.paid += pay;
    inv.balance = Math.max(0, inv.total - inv.paid);
    inv.status = inv.balance <= 0 ? "paid" : "partial";

    db.messages.push({
      id: uid("m"), from: "u-bursar", to: fam.parentUserId,
      subject: "Payment receipt",
      body: `Thank you! Your payment of UGX ${pay.toLocaleString()} via ${channel} was received and reconciled. Receipt ${payment.receipt}. Remaining balance: UGX ${inv.balance.toLocaleString()}.`,
      date: today(), read: false, channel: "email",
    });
    // Real receipt email to the parent's address (cPanel SMTP when configured).
    const parent = db.users.find((u) => u.id === fam.parentUserId);
    if (parent?.email && isMailConfigured()) {
      try {
        const r = await sendReceipt({
          to: parent.email,
          name: `${fam.name} family`,
          amount: pay,
          receipt: payment.receipt,
          balance: inv.balance,
          portalLink: `${portalBaseUrl(db.meta.inviteLink)}/portal/fees`,
        });
        db.deliveries.unshift({
          id: uid("d"), channel: "Email", to: parent.email, ref: payment.id,
          subject: `Payment receipt ${payment.receipt}`, status: r.ok ? "delivered" : "failed",
          provider: r.ok ? mailProviderLabel() : `cPanel SMTP (failed: ${r.error})`, date: now(),
        });
      } catch {
        // A mail outage must never break fee collection.
      }
    }
    db.feesAudit.unshift({
      id: uid("fa"), date: now(), actor: "System",
      action: `${channel} payment ${payment.reference} settled — ${payment.receipt} reconciled`,
      amount: pay,
    });
    return payment;
  },

  // ---- Leave requests -------------------------------------------------------
  requestLeave({ db, payload }) {
    const { studentId, from, to, reason } = payload;
    const student = db.studentIndex[studentId];
    if (!student) throw new Error("Unknown student — pick who this leave is for.");
    if (!from || !to) throw new Error("Choose both the first and last day of the absence.");
    const fam = db.families.find((f) => f.id === student.familyId);
    if (!fam) throw new Error("Family record missing for this student.");
    const leave = {
      id: uid("lv"), studentId, from, to, reason, status: "pending",
      submittedBy: fam.parentUserId, date: today(),
      teacherNotified: [],
    };
    // Auto-notify class teachers (by subject/class heuristic)
    const teachers = db.users.filter((u) => u.role === "teacher").map((t) => t.id);
    leave.teacherNotified = teachers;
    db.leaves.unshift(leave);
    for (const tid of teachers) {
      db.messages.push({
        id: uid("m"), from: fam.parentUserId, to: tid,
        subject: `Absence request — ${student.name}`,
        body: `${fam.name} family has requested leave for ${student.name} (${student.class}) from ${from} to ${to}: ${reason}`,
        date: today(), read: false, channel: "app",
      });
    }
    return leave;
  },
  decideLeave({ db, payload }) {
    const { leaveId, approve } = payload;
    const leave = db.leaves.find((l) => l.id === leaveId);
    if (!leave) throw new Error("Leave not found");
    leave.status = approve ? "approved" : "declined";
    return leave;
  },

  // ---- Messaging / noticeboard ----------------------------------------------
  async sendMessage({ db, payload }) {
    const { from, to, subject, body, channel } = payload;
    if (!to || !db.users.some((u) => u.id === to)) throw new Error("Pick a valid recipient for this message.");
    if (!subject || typeof subject !== "string") throw new Error("Give the message a subject.");
    if (!body || typeof body !== "string") throw new Error("Write the message before sending.");
    const msg = {
      id: uid("m"), from, to, subject, body, date: today(), read: false, channel: channel || "app",
    };
    db.messages.push(msg);
    const recipient = db.users.find((u) => u.id === to);
    let status = "delivered";
    let provider = "Gill noticeboard";
    if (channel === "sms") {
      provider = "MTN SMS Gateway (simulated)";
    } else if (channel === "email") {
      const target = recipient?.email || "";
      provider = mailProviderLabel();
      if (target && isMailConfigured()) {
        try {
          const r = await sendMail({ to: target, subject, text: body });
          if (!r.ok) {
            status = "failed";
            provider = `cPanel SMTP (failed: ${r.error || "send failed"})`;
          }
        } catch (e) {
          status = "failed";
          provider = `cPanel SMTP (failed: ${e.message})`;
        }
      }
    }
    db.deliveries.unshift({
      id: uid("d"),
      channel: channel === "sms" ? "SMS" : channel === "email" ? "Email" : "In-app",
      to: channel === "sms" ? recipient?.phone : recipient?.email || recipient?.name,
      ref: msg.id, subject, status,
      provider,
      date: now(),
    });
    return msg;
  },
  publishNotice({ db, payload }) {
    if (!payload.title || typeof payload.title !== "string") throw new Error("Give the notice a title.");
    if (!payload.body || typeof payload.body !== "string") throw new Error("Write the notice before publishing.");
    const notice = {
      id: uid("n"), title: payload.title, body: payload.body,
      audience: payload.audience || "all", author: payload.author || "Front Office", date: today(),
    };
    db.notices.unshift(notice);
    return notice;
  },
  submitSuggestion({ db, payload }) {
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const anonymous = payload.anonymous === true;
    const roles = ["Parent or guardian", "Student", "Staff member", "Community member", "Visitor"];
    const categories = ["Teaching and learning", "Student wellbeing", "School facilities", "Communication", "Activities and events", "Other"];
    if (message.length < 10) throw new Error("Please write at least 10 characters so we can understand your suggestion.");
    if (message.length > 2000) throw new Error("Please keep your suggestion under 2,000 characters.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address or leave it blank.");
    if (!roles.includes(payload.role)) throw new Error("Choose the option that best describes you.");
    if (!categories.includes(payload.category)) throw new Error("Choose a suggestion topic.");
    const suggestion = {
      id: uid("sug"),
      name: anonymous ? null : name || null,
      email: anonymous ? null : email || null,
      anonymous,
      role: payload.role,
      category: payload.category,
      message,
      status: "new",
      submittedAt: now(),
    };
    if (!Array.isArray(db.suggestions)) db.suggestions = [];
    db.suggestions.unshift(suggestion);
    return { id: suggestion.id, status: suggestion.status };
  },
  markRead({ db, payload }) {
    const m = db.messages.find((x) => x.id === payload.messageId);
    if (!m) throw new Error("Message not found — refresh and try again.");
    m.read = true;
    return m;
  },

  // ---- Pre-orders -------------------------------------------------------------
  placeOrder({ db, payload }) {
    const { studentId, items, term } = payload;
    if (!studentId || !db.studentIndex[studentId]) throw new Error("Choose the student this order is for.");
    if (!Array.isArray(items) || items.length === 0) throw new Error("Your cart is empty — add an item first.");
    const order = {
      id: uid("ord"), studentId, term: term || TERM, date: today(),
      status: "placed", total: items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0), items,
    };
    db.orders.unshift(order);
    return order;
  },
  markOrderPaid({ db, payload }) {
    const order = db.orders.find((o) => o.id === payload.orderId);
    if (!order) throw new Error("Order not found");
    order.status = "paid";
    return order;
  },

  // ---- Assessments -------------------------------------------------------------
  // Two separate remarks: `remarkStudent` is what the child sees in their
  // portal; `remarkParent` is a private note only the family sees. The parent
  // decides (Student Accounts → access) whether the child can view remarks.
  addAssessment({ db, payload }) {
    const { studentId, subject, type, title, score, max, feedback, teacher } = payload;
    const student = db.studentIndex[studentId];
    if (!student) throw new Error("Unknown student — pick who this assessment is for.");
    if (!subject) throw new Error("Choose the subject.");
    const numScore = Number(score);
    const numMax = Number(max);
    if (!Number.isFinite(numScore) || !Number.isFinite(numMax) || numMax <= 0 || numScore < 0 || numScore > numMax) {
      throw new Error("Enter a valid score (it can't be greater than the maximum).");
    }
    const remarkStudent = payload.remarkStudent || feedback || "";
    const remarkParent = payload.remarkParent || "";
    const fam = db.families.find((f) => f.id === student?.familyId);
    const assessment = {
      id: uid("as"), studentId, subject, term: TERM, type, title,
      score: numScore, max: numMax, grade: gradeFor(numScore, numMax),
      teacher, date: today(), feedback: remarkStudent,
      remarkStudent, remarkParent,
    };
    db.assessments.unshift(assessment);
    if (fam) {
      db.messages.push({
        id: uid("m"), from: teacher || "u-admin", to: fam.parentUserId,
        subject: `New assessment published — ${student.name}`,
        body: `${student.name} scored ${numScore}/${numMax} in ${subject} (${title}). Your private remark from the teacher: ${remarkParent || "see Children & Progress."} The child's remark is separate and the family controls whether it shows in their portal.`,
        date: today(), read: false, channel: "app",
      });
    }
    return assessment;
  },

  // ---- Documents ----------------------------------------------------------------
  uploadDocument({ db, payload }) {
    const { studentId, type, name, size } = payload;
    const student = db.studentIndex[studentId];
    if (!student) throw new Error("Unknown student — pick the child this document belongs to.");
    if (!type || typeof type !== "string") throw new Error("Choose the document type before uploading.");
    const doc = {
      id: uid("doc"), studentId, type, name: name || `${type.replace(/\s+/g, "_").toLowerCase()}_upload.pdf`,
      size: size || "—", uploadedAt: today(), by: payload.by || "u-parent-1", status: "pending review",
    };
    db.documents.unshift(doc);
    return doc;
  },
  verifyDocument({ db, payload }) {
    const doc = db.documents.find((d) => d.id === payload.docId);
    if (!doc) throw new Error("Document not found — refresh and try again.");
    doc.status = payload.status || "verified";
    return doc;
  },

  // ---- Admissions transition -------------------------------------------------------
  initiateTransition({ db, payload }) {
    const { studentId, notes } = payload;
    const student = db.studentIndex[studentId];
    if (!student || student.campus !== "preschool") throw new Error("Only Pre-School pupils can be transitioned");
    const transition = {
      id: uid("tr"), studentId, status: "initiated", initiatedBy: payload.by || "t-sharon",
      date: today(), targetClass: "Primary 1 (Cambridge)", targetCampus: "main", notes: notes || "",
      checklist: [
        { key: "Records", label: "Progress records & reports", done: true },
        { key: "Immunisation", label: "Immunisation records", done: true },
        { key: "Medical", label: "Medical history", done: true },
        { key: "Contacts", label: "Parent contacts", done: true },
        { key: "Documents", label: "Birth certificate + past reports", done: true },
      ],
    };
    db.transitions.unshift(transition);
    return transition;
  },
  enrollTransition({ db, payload }) {
    const { transitionId, targetClass } = payload;
    const t = db.transitions.find((x) => x.id === transitionId);
    if (!t) throw new Error("Transition not found");
    const fam = db.families.find((f) => f.children.some((c) => c.id === t.studentId));
    const child = fam?.children.find((c) => c.id === t.studentId);
    if (!child) throw new Error("Student not found");

    child.campus = "main";
    child.class = targetClass || "Primary 1 (Cambridge)";
    child.startDate = child.startDate || today();
    child.enrolled = true;
    t.status = "enrolled";
    t.enrolledAt = today();

    // Auto-create first main-school invoice (entrance + first-term tuition)
    const inv = {
      id: uid("inv"), familyId: fam.id, term: TERM, issued: today(), due: today(),
      status: "unpaid",
      lines: [
        { studentId: child.id, label: `Main School Tuition — ${child.class}`, kind: "tuition", amount: 850000, discount: 0 },
        { studentId: child.id, label: "Enrolment / records fee", kind: "fee", amount: 50000, discount: 0 },
      ],
      siblingDiscount: 0, total: 900000, paid: 0, balance: 900000,
    };
    db.invoices.push(inv);

    db.feesAudit.unshift({
      id: uid("fa"), date: now(), actor: "System",
      action: `Automated transition — ${child.name} joined ${child.class}; records migrated, invoice ${inv.id} created`,
      amount: 0,
    });
    // Notify bursar + admissions
    db.messages.push({
      id: uid("m"), from: "u-admissions", to: "u-bursar",
      subject: `New Year 1 enrolment — ${child.name}`,
      body: `${child.name} enrolled via automated Pre-School transition. Records (immunisation, medical, contacts, reports) migrated automatically. Invoice created for ${TERM}.`,
      date: today(), read: false, channel: "app",
    });
    return t;
  },

  // ---- Student portal accounts (parent-created, supervised) -----------------------
  createStudentAccount({ db, payload }) {
    const { studentId, username, password, perms } = payload;
    const student = db.studentIndex[studentId];
    if (!student) throw new Error("Student not found");
    const fam = db.families.find((f) => f.id === student.familyId);
    const accountId = uid("sa");
    const mergedPerms = {
      progress: true,
      remarks: true,
      homework: true,
      library: true,
      calendar: true,
      messages: true,
      fees: false,
      ...(perms || {}),
    };
    const account = {
      id: accountId,
      studentId,
      username: String(username || student.name.toLowerCase().replace(/\s+/g, ".")),
      password: String(password || "gill" + Math.floor(1000 + Math.random() * 9000)),
      supervisedBy: fam.parentUserId,
      createdAt: today(),
      status: "active",
      perms: mergedPerms,
    };
    db.studentAccounts.unshift(account);
    db.accountByStudent[studentId] = account;
    if (mergedPerms.messages) ensureFamilyChat(db, studentId, fam);
    db.messages.push({
      id: uid("m"), from: "u-admin", to: fam.parentUserId,
      subject: `Student account created — ${student.name}`,
      body: `${student.name}'s portal account (${account.username}) is live. The account is supervised by you: sign-in requests and access settings are always managed from Parent Portal → Student Accounts.`,
      date: today(), read: false, channel: "email",
    });
    db.feesAudit.unshift({
      id: uid("fa"), date: now(), actor: "System",
      action: `Student portal account created for ${student.name} (${account.username}) — supervised by ${fam.name} family`,
      amount: 0,
    });
    return account;
  },
  updateStudentAccount({ db, payload }) {
    const { accountId, password, status, perms } = payload;
    const account = db.studentAccounts.find((a) => a.id === accountId);
    if (!account) throw new Error("Account not found");
    if (password) account.password = password;
    if (status) account.status = status;
    if (perms) {
      const before = account.perms.messages;
      account.perms = { ...account.perms, ...perms };
      const student = db.studentIndex[account.studentId];
      const fam = db.families.find((f) => f.id === student?.familyId);
      if (account.perms.messages && !before) ensureFamilyChat(db, account.studentId, fam);
      if (!account.perms.messages && before) {
        for (const c of db.chats.filter((x) => x.studentId === account.studentId)) c.status = "paused";
      }
    }
    db.accountByStudent[account.studentId] = account;
    return account;
  },

  // ---- Family group chats ----------------------------------------------------
  // Auto-created when the parent enables "Receive messages from teachers".
  // Parents see every teacher message (monitor mode) but can only reply when
  // the message is about attendance (absence/late collection/pickup change).
  ensureFamilyChat({ db, payload }) {
    const student = db.studentIndex[payload.studentId];
    const fam = db.families.find((f) => f.id === student?.familyId);
    return ensureFamilyChat(db, payload.studentId, fam);
  },
  sendChatMessage({ db, payload }) {
    const { chatId, from, text, tag } = payload;
    const chat = db.chats.find((c) => c.id === chatId);
    if (!chat) throw new Error("Group chat not found");
    if (chat.status !== "active") throw new Error("This group chat is paused — enable 'Receive messages from teachers' in Student Accounts.");
    const sender = db.users.find((u) => u.id === from) || db.users.find((u) => u.id === chat.members.find((m) => m.userId === from)?.userId);
    const member = chat.members.find((m) => m.userId === from);
    if (!member) throw new Error("You're not a member of this group");
    if (member.role === "parent" && tag !== "attendance") {
      throw new Error("Parents can read the group, but can only reply about attendance issues (absence, late collection, pickup change).");
    }
    if (member.role === "parent" && !text.trim().toLowerCase().match(/(attend|absent|absence|late|pickup|collect|sick|medical|leave|trip|delay)/i)) {
      throw new Error("Please describe the attendance issue so the class teacher can act on it (e.g. absence today, late pickup at 17:30).");
    }
    const message = {
      id: uid("cm"),
      from,
      role: member.role,
      text: text.trim(),
      tag: tag || "general",
      date: now(),
      readBy: [from],
    };
    chat.messages.push(message);
    // Notify every other member in-app (teachers get it immediately; parents
    // always get it — that's the monitor guarantee for the family).
    for (const m of chat.members) {
      if (m.userId === from) continue;
      db.messages.push({
        id: uid("m"), from, to: m.userId,
        subject: `${sender?.name || member.role}: ${chat.title}`,
        body: text.trim(),
        date: today(), read: false, channel: "app",
      });
    }
    return message;
  },
  markChatRead({ db, payload }) {
    const chat = db.chats.find((c) => c.id === payload.chatId);
    if (!chat) throw new Error("Group chat not found");
    for (const m of chat.messages) if (!m.readBy.includes(payload.from)) m.readBy.push(payload.from);
    return { unread: unreadFor(db, payload.from) };
  },
  resetStudentAccount({ db, payload }) {
    const { accountId } = payload;
    const account = db.studentAccounts.find((a) => a.id === accountId);
    if (!account) throw new Error("Account not found");
    const student = db.studentIndex[account.studentId];
    account.password = "gill" + Math.floor(1000 + Math.random() * 9000);
    db.feesAudit.unshift({
      id: uid("fa"), date: now(), actor: "System",
      action: `Password reset for ${student?.name}'s portal account`,
      amount: 0,
    });
    return account;
  },

  // ---- Family invite re-send (SMS to every parent on the application) -----------
  resendFamilyInvite({ db, payload }) {
    const { applicationId } = payload;
    const app = db.applications.find((a) => a.id === applicationId);
    if (!app) throw new Error("Application not found");
    const student = db.studentIndex[app.studentId];
    const fam = db.families.find((f) => f.id === student.familyId);
    const account = db.familyAccountByFamily[fam.id];
    if (app.status !== "activated" || !account) {
      throw new Error("This family isn't activated yet — finish the requirements and clear tuition first.");
    }
    const parents = app.parentContacts.filter((p) => p.alive !== false);
    const now = new Date().toISOString();
    // Registered families chose a password on /register — no invite setup
    // needed, so their SMS points at the portal sign-in directly.
    const accessLink = account.inviteToken
      ? `${account.inviteLink}/setup?invite=${account.inviteToken}`
      : account.inviteLink;
    for (const p of parents) {
      db.deliveries.unshift({
        id: uid("d"),
        channel: "SMS",
        to: p.phone,
        ref: app.id,
        subject: `Gill School OS access — ${accessLink} · shared login: ${account.username}`,
        status: "delivered",
        provider: "MTN/Airtel SMS Gateway (simulated)",
        date: now,
      });
    }
    db.feesAudit.unshift({
      id: uid("fa"), date: now, actor: "u-admin",
      action: `Invite re-sent for ${fam.name} family — SMS to ${parents.length} parent number(s)`,
      amount: 0,
    });
    return { parents: parents.length, to: parents.map((p) => p.phone) };
  },

  // ---- Invite → create password → verify with code ------------------------------
  // The SMS link lands on /portal/setup?invite=TOKEN. Step 1: create a password.
  // Step 2: a 6-digit code is sent to the family's phone or email (family choice).
  // Step 3: enter the code → verified → signed in with the shared family session.
  inviteLookup({ db, payload }) {
    const account = db.familyAccounts.find((a) => a.inviteToken === String(payload.token || "").trim());
    if (!account) throw new Error("That invite link isn't recognised. Check the SMS, or contact the school office.");
    const fam = db.families.find((f) => f.id === account.familyId);
    const kids = fam.children.map((c) => ({ name: c.name, class: c.class, campus: c.campus }));
    const members = account.members
      .map((id) => db.users.find((u) => u.id === id))
      .filter(Boolean)
      .map((u) => ({ id: u.id, name: u.name, phone: u.phone, email: u.email, relation: u.relation }));
    return {
      token: account.inviteToken,
      familyName: fam.name,
      username: account.username,
      kids,
      members,
      passwordSet: account.passwordSet,
      verified: account.verified,
    };
  },
  async inviteSetup({ db, payload }) {
    const account = db.familyAccounts.find((a) => a.inviteToken === String(payload.token || "").trim());
    if (!account) throw new Error("That invite link isn't recognised. Check the SMS, or contact the school office.");
    if (account.verified) throw new Error("This family is already set up — sign in instead.");
    const password = String(payload.password || "");
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    const fam = db.families.find((f) => f.id === account.familyId);
    const member = db.users.find((u) => u.id === account.members[0]);
    const channel = payload.channel === "email" ? "email" : "sms";
    const to = channel === "email" ? (member?.email || fam.email) : (member?.phone || "");
    if (!to) throw new Error(`No ${channel} address on file — contact the school office.`);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    // Email codes go through cPanel SMTP when configured (no code is ever
    // returned to the UI in that case); SMS stays simulated for now.
    let simulated = true;
    let provider = "MTN/Airtel SMS Gateway (simulated)";
    if (channel === "email") {
      if (isMailConfigured()) {
        const r = await sendVerificationCode({
          to,
          name: member?.name || `${fam.name} family`,
          code,
          portalLabel: "Parent Portal",
        });
        if (!r.ok) {
          throw new Error(`We couldn't send the email (${r.error || "SMTP error"}). Choose SMS instead, or contact the school office.`);
        }
        simulated = false;
        provider = mailProviderLabel();
      } else {
        provider = "School mail relay (simulated)";
      }
    }
    setPasswordOn(account, password);
    account.verification = { code, channel, to, expires: Date.now() + 10 * 60 * 1000, attempts: 0 };
    db.deliveries.unshift({
      id: uid("d"), channel: channel === "email" ? "Email" : "SMS", to, ref: account.id,
      subject: `Your Gill School OS verification code (expires in 10 minutes)`,
      status: "delivered", provider, date: now(),
    });
    db.feesAudit.unshift({ id: uid("fa"), date: now(), actor: "System", action: `Password created for ${fam.name} family — verification code sent by ${channel}`, amount: 0 });
    return { channel, to, ...(simulated ? { demoCode: code } : {}) };
  },
  async inviteResend({ db, payload }) {
    const account = db.familyAccounts.find((a) => a.inviteToken === String(payload.token || "").trim());
    if (!account) throw new Error("That invite link isn't recognised.");
    if (!account.verification) throw new Error("Create a password first — then we resend the code.");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const v = account.verification;
    let simulated = true;
    let provider = "Gateway (simulated)";
    if (v.channel === "email" && isMailConfigured()) {
      const fam = db.families.find((f) => f.id === account.familyId);
      const member = db.users.find((u) => u.id === account.members[0]);
      const r = await sendVerificationCode({
        to: v.to,
        name: member?.name || `${fam?.name || "Gill"} family`,
        code,
        portalLabel: "Parent Portal",
      });
      if (!r.ok) throw new Error(`We couldn't re-send the email (${r.error || "SMTP error"}). Try again in a minute.`);
      simulated = false;
      provider = mailProviderLabel();
    }
    v.code = code;
    v.expires = Date.now() + 10 * 60 * 1000;
    v.attempts = 0;
    db.deliveries.unshift({
      id: uid("d"), channel: v.channel === "email" ? "Email" : "SMS", to: v.to, ref: account.id,
      subject: `Your new Gill School OS verification code`,
      status: "delivered", provider, date: now(),
    });
    return { channel: v.channel, to: v.to, ...(simulated ? { demoCode: code } : {}) };
  },
  inviteVerify({ db, payload }) {
    const account = db.familyAccounts.find((a) => a.inviteToken === String(payload.token || "").trim());
    if (!account) throw new Error("That invite link isn't recognised.");
    const v = account.verification;
    if (!v) throw new Error("No code was sent yet — create your password first.");
    if (Date.now() > v.expires) throw new Error("That code has expired — use Resend to get a fresh one.");
    v.attempts += 1;
    if (String(payload.code || "") !== v.code) {
      if (v.attempts >= 5) { account.verification = null; throw new Error("Too many attempts — resend a new code."); }
      throw new Error(`That code isn't right. ${5 - v.attempts} attempt(s) left.`);
    }
    account.verified = true;
    account.passwordSet = true;
    account.verification = null;
    const fam = db.families.find((f) => f.id === account.familyId);
    db.feesAudit.unshift({ id: uid("fa"), date: now(), actor: "System", action: `${fam.name} family verified — shared portal access live for ${account.members.length} parent(s)`, amount: 0 });
    const members = account.members.map((id) => db.users.find((u) => u.id === id)).filter(Boolean)
      .map((u) => ({ id: u.id, name: u.name, phone: u.phone, relation: u.relation }));
    return {
      verified: true,
      session: {
        familyId: account.familyId, familyName: fam.name, username: account.username,
        primaryUserId: account.members[0], members, inviteLink: account.inviteLink,
      },
    };
  },

  // ---- Admin: events & resources ------------------------------------------------
  addEvent({ db, payload }) {
    if (!payload.title || typeof payload.title !== "string") throw new Error("Give the event a title.");
    if (!payload.date) throw new Error("Choose the event date.");
    const e = { id: uid("e"), ...payload, time: payload.time || "08:00", location: payload.location || "School", category: payload.category || "Academic", audience: payload.audience || "all" };
    db.events.push(e);
    return e;
  },
  addResource({ db, payload }) {
    if (!payload.title || typeof payload.title !== "string") throw new Error("Give the resource a title.");
    const r = {
      id: uid("r"), type: payload.type || "Worksheet", title: payload.title, subject: payload.subject || "General",
      stage: payload.stage || "All", campus: payload.campus || "all", addedBy: payload.by || "u-admin",
      date: today(), downloads: 0, size: payload.size || "—", file: payload.file || "#",
    };
    db.resources.unshift(r);
    return r;
  },

  // ---- Public registration & application (parents only, no Staff Portal) ----
  // A family registers on the OS landing-style /register page, fills the
  // 6-step application wizard, and the account stays "pending" until the
  // Admissions registrar verifies documents and tuition is cleared. At that
  // point store reconcile() flips it to active and SMSes the shared login +
  // a link to the child's portal.
  async registerFamily({ db, payload }) {
    const { familyName, parentName, relation, phone, email, password, terms } = payload;
    if (!familyName || !parentName || !phone || !password) throw new Error("Please complete all required fields.");
    if (String(password).length < 8) throw new Error("Password must be at least 8 characters.");
    if (!terms) throw new Error("Please agree to the terms & conditions to continue.");
    const cleanEmail = String(email || "").trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error("Enter a valid email address or leave it blank.");

    const base = familyName.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
    let username = `${base}.family`;
    let n = 2;
    while (db.familyAccounts.some((a) => a.username === username)) username = `${base}${n++}.family`;

    const familyId = uid("fam");
    const userId = uid("u-parent");
    db.families.push({
      id: familyId,
      name: familyName.trim(),
      parentUserId: userId,
      address: "",
      children: [],
    });
    db.users.push({
      id: userId,
      role: "parent",
      name: parentName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      familyId,
      relation: relation || "Parent / Guardian",
    });

    const now = new Date().toISOString();
    const account = {
      id: uid("fa"),
      familyId,
      username,
      password: hashPassword(String(password)),
      status: "pending", // → "active" once admission is verified by the registrar
      activatedAt: null,
      inviteLink: db.meta.inviteLink,
      inviteToken: null,
      passwordSet: true, // chosen at registration; no invite setup needed
      verified: true,
      verification: null,
      members: [userId],
      registeredAt: now,
    };
    db.familyAccounts.push(account);
    db.familyAccountByFamily[familyId] = account;
    db.feesAudit.unshift({
      id: uid("fa"), date: now, actor: "System",
      action: `Family registered on the OS — ${familyName} (${username}); account pending admission verification`,
      amount: 0,
    });
    // Welcome email when the family gave an address and SMTP is live.
    if (cleanEmail && isMailConfigured()) {
      try {
        const r = await sendWelcomeFamily({
          to: cleanEmail,
          name: parentName.trim(),
          username,
          portalLink: `${portalBaseUrl(db.meta.inviteLink)}/portal/login`,
        });
        db.deliveries.unshift({
          id: uid("d"), channel: "Email", to: cleanEmail, ref: account.id,
          subject: `Welcome to Gill School OS — ${username}`, status: r.ok ? "delivered" : "failed",
          provider: r.ok ? mailProviderLabel() : `cPanel SMTP (failed: ${r.error})`, date: now,
        });
      } catch {
        // Registration must never fail because of email.
      }
    }
    return { familyId, userId, account };
  },

  // Save one wizard step. The child + application record are created on the
  // first (Basic Information) save; later steps update that record.
  saveApplication({ db, payload }) {
    const { familyId, step, data } = payload;
    const fam = db.families.find((f) => f.id === familyId);
    if (!fam) throw new Error("Family account not found. Please register first.");
    let app = db.applications.find(
      (a) => a.studentId && db.studentIndex[a.studentId]?.familyId === familyId && a.status !== "activated"
    );

    if (!app) {
      if (step !== "basic") throw new Error("Start with Basic Information.");
      const isPre = data.campus === "preschool";
      const studentId = uid("s");
      const count = Object.keys(db.studentIndex).length;
      const child = {
        id: studentId,
        name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        schoolId: isPre ? `GIPS-2026-${String(900 + count).padStart(4, "0")}` : `GIS-2026-${String(900 + count).padStart(4, "0")}`,
        campus: data.campus,
        class: data.class,
        startDate: data.intake || "2026-09-07",
        dob: data.dob || "",
        gender: data.gender || "",
        enrolled: false,
        featuredNote: "New application — portal activates once Admission verifies the records.",
      };
      fam.children.push(child);
      db.studentIndex[studentId] = { ...child, familyId, familyName: fam.name };
      app = {
        id: uid("app"),
        studentId,
        intake: data.intake || TERM,
        campus: data.campus,
        status: "in_progress", // in_progress → applied → activated
        form: true,
        channel: "register",
        parentContacts: [],
        emergencyContacts: [],
        documents: [],
        payment: null,
        createdAt: now(),
        steps: { basic: true, parent: false, emergency: false, documents: false, payment: false, review: false },
      };
      db.applications.push(app);
    }

    const kid = db.studentIndex[app.studentId];
    if (step === "basic") {
      kid.name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
      kid.dob = data.dob || kid.dob;
      kid.gender = data.gender || kid.gender;
      kid.campus = data.campus || kid.campus;
      kid.class = data.class || kid.class;
      kid.startDate = data.intake || kid.startDate;
      app.intake = data.intake || app.intake;
      app.campus = data.campus || app.campus;
      app.steps.basic = true;
    } else if (step === "parent") {
      const contacts = (data.contacts || []).filter((c) => c.name && c.phone);
      app.parentContacts = contacts.map((c) => {
        // Every parent on the form becomes a named user on the ONE family
        // login (both surviving parents share it) — matching the invite flow.
        let u = db.users.find((x) => x.familyId === fam.id && x.relation === c.relation && (x.phone === c.phone || x.name === c.name));
        if (!u) {
          u = {
            id: uid("u-parent"), role: "parent", name: c.name,
            email: c.email || "", phone: c.phone, familyId: fam.id, relation: c.relation,
          };
          db.users.push(u);
        }
        const account = db.familyAccountByFamily[fam.id];
        if (account && !account.members.includes(u.id)) account.members.push(u.id);
        return { userId: u.id, name: c.name, relation: c.relation, phone: c.phone, email: c.email || "", alive: c.alive !== false };
      });
      // First contact = parentUserId; second = co-parent (if present).
      fam.parentUserId = app.parentContacts[0]?.userId || fam.parentUserId;
      if (app.parentContacts.length > 1) fam.coParentUserId = app.parentContacts[1].userId;
      app.steps.parent = true;
    } else if (step === "emergency") {
      app.emergencyContacts = (data.contacts || []).filter((c) => c.name && c.phone);
      app.steps.emergency = true;
    } else if (step === "documents") {
      app.documents = (data.files || []).filter((f) => f.name);
      app.steps.documents = true;
    } else if (step === "payment") {
      app.payment = data || null;
      app.steps.payment = true;
    } else {
      throw new Error(`Unknown wizard step: ${step}`);
    }
    return { application: app, studentId: app.studentId };
  },

  submitApplication({ db, payload }) {
    const { applicationId } = payload;
    const app = db.applications.find((a) => a.id === applicationId);
    if (!app) throw new Error("Application not found.");
    if (app.status === "applied") throw new Error("This application is already awaiting Admission review.");
    if (app.status === "activated") throw new Error("This admission is already verified — contact the Admissions office to change anything.");
    // "review" is completed BY this submission, so it's not a prerequisite.
    const steps = app.steps || {};
    const missing = Object.keys(steps).filter((k) => k !== "review" && !steps[k]);
    if (missing.length) throw new Error(`Complete these steps first: ${missing.map((m) => m[0].toUpperCase() + m.slice(1)).join(", ")}.`);

    const kid = db.studentIndex[app.studentId];
    const fam = db.families.find((f) => f.id === kid.familyId);
    if (!kid || !fam) throw new Error("Application family not found.");

    // Re-open (resubmit) after the parent edited an "applied" application:
    // reuse the vault docs + invoice created by the first submission.
    const resubmit = !!app.previousSubmit;
    delete app.previousSubmit;
    kid.enrolled = true;

    let invoice = null;
    let total = 0;

    if (!resubmit) {
      // Document vault — every file the family uploaded, awaiting review.
      for (const f of app.documents) {
        db.documents.push({
          id: uid("doc"),
          studentId: kid.id,
          type: f.type || "Document",
          name: f.name,
          size: f.size || "—",
          uploadedAt: today(),
          by: fam.parentUserId,
          status: "pending review",
        });
      }

      // Fee invoice for the term (matches feeStructure + the old wizard).
      const fs = db.feeStructure[app.campus];
      const lines = [
        { studentId: kid.id, label: `${app.campus === "preschool" ? "Pre-School" : "Main School"} Tuition (${kid.class})`, kind: "tuition", amount: fs.tuition, discount: 0 },
        ...(app.campus === "preschool"
          ? [{ label: "Registration & first-term materials", kind: "fee", amount: fs.registration, discount: 0 }]
          : [{ label: "Entrance assessment fee", kind: "fee", amount: fs.entrance, discount: 0 }]),
      ];
      total = lines.reduce((s, l) => s + l.amount, 0);
      invoice = {
        id: uid("inv"),
        familyId: fam.id,
        term: TERM,
        issued: today(),
        due: "2026-09-10",
        status: "unpaid",
        lines,
        siblingDiscount: 0,
        total,
        paid: 0,
        balance: total,
      };

      // Old-wizard Payment step: "Pay now" simulates a settled mobile-money
      // payment; otherwise the family pays at the school office.
      if (app.payment?.method === "payNow" && app.payment?.channel) {
        const pay = {
          id: uid("pay"), invoiceId: invoice.id, familyId: fam.id, amount: total, channel: app.payment.channel,
          reference: app.payment.channel === "MTN Mobile Money" ? `MTN-${Math.floor(10000 + Math.random() * 89999)}-${Math.floor(Math.random() * 9)}` :
            app.payment.channel === "Airtel Money" ? `AIR-${Math.floor(10000 + Math.random() * 89999)}-${Math.floor(Math.random() * 9)}` :
            `VISA-${String(Math.floor(1000000 + Math.random() * 8999999))}`,
          phone: app.payment.phone || "", date: today(), receipt: `RCP-2026-${String(db.payments.length + 100).padStart(4, "0")}`,
          status: "settled",
        };
        db.payments.push(pay);
        invoice.paid = total;
        invoice.balance = 0;
        invoice.status = "paid";
      }
      db.invoices.push(invoice);
    } else {
      // Re-submission: old docs stay (registrar re-checks them), and the
      // original invoice keeps its paid state — nothing is re-billed.
      invoice = db.invoices.find(
        (i) => i.familyId === fam.id && i.term === TERM && i.lines.some((l) => l.studentId === kid.id)
      );
      if (invoice) invoice.status = invoice.balance > 0 ? "unpaid" : "paid";
      total = invoice?.total || 0;
    }

    app.status = "applied";
    app.submittedAt = now();
    app.steps.review = true;

    // Everyone on the form is notified; both surviving parents share one login.
    const parents = (app.parentContacts || []).filter((p) => p.alive !== false);
    for (const p of parents) {
      db.deliveries.unshift({
        id: uid("d"), channel: "SMS", to: p.phone, ref: app.id,
        subject: resubmit
          ? `Application updated — ${kid.name} (${kid.schoolId}) for ${app.intake}. The Admissions team will re-check your updated records.`
          : `Application received — ${kid.name} (${kid.schoolId}) for ${app.intake}. Our Admissions team will verify your documents and confirm by SMS.`,
        status: "delivered", provider: "MTN/Airtel SMS Gateway (simulated)", date: now(),
      });
    }
    db.messages.push({
      id: uid("m"), from: fam.parentUserId, to: "u-admissions",
      subject: resubmit ? `Application updated — ${kid.name}` : `New application received — ${kid.name}`,
      body: `${fam.name} family ${resubmit ? "updated" : "submitted"} ${kid.name}'s application (${kid.schoolId}, ${app.campus === "preschool" ? "Pre-School" : "Main School"}, ${kid.class}) for ${app.intake}. ${app.documents.length} document(s) ${resubmit ? "re-uploaded" : "awaiting review"}.${resubmit ? "" : ` Invoice ${invoice.id} totals UGX ${total.toLocaleString()}.`}`,
      date: today(), read: false, channel: "email",
    });
    db.feesAudit.unshift({
      id: uid("fa"), date: now(), actor: fam.name,
      action: resubmit
        ? `Application updated (re-submitted) — ${kid.name} (${kid.schoolId}) · ${app.intake}; documents re-queued for review`
        : `Application submitted — ${kid.name} (${kid.schoolId}) · ${app.intake}; invoice ${invoice.id} opened at UGX ${total.toLocaleString()}`,
      amount: total,
    });
    return { application: app, invoice };
  },

  // "Apply again" — a parent re-opens a submitted application while it is
  // still awaiting Admission review so they can correct details and resubmit.
  reopenApplication({ db, payload }) {
    const { applicationId } = payload;
    const app = db.applications.find((a) => a.id === applicationId);
    if (!app) throw new Error("Application not found.");
    if (app.status === "activated") throw new Error("This admission is already verified — please contact the Admissions office.");
    if (app.status === "rejected") throw new Error("This application was closed by Admissions — please contact the office to discuss a new application.");
    if (app.status === "in_progress") throw new Error("This application is already open in the Application form.");
    // Keep the vault + invoice created on the first submit; the wizard shows
    // a summary and a single "Update & resubmit" button.
    app.status = "in_progress";
    app.previousSubmit = app.submittedAt || now();
    // Seed applications have no per-step record (they were completed
    // outside the wizard); a re-opened application is only missing "review".
    app.steps = { ...(app.steps || {}), review: false };
    return { application: app };
  },

  // Application settings on the parents' dashboard — kept on the application
  // itself so the Admissions office can see the family's latest choices.
  updateApplicationSettings({ db, payload }) {
    const { applicationId, settings } = payload || {};
    const app = db.applications.find((a) => a.id === applicationId);
    if (!app) throw new Error("Application not found.");
    app.settings = { ...(app.settings || {}), ...(settings || {}) };
    return { application: app };
  },

  // ---- Staff accounts: invites + status (Head of School console) ------------
  // Staff sign in at /staff with their school email (@gill.ac.ug). The mailbox
  // lives in cPanel webmail; the portal password is separate and set through
  // the emailed invite link below.
  async inviteStaff({ db, payload }) {
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const role = String(payload.role || "").trim();
    const domain = String(process.env.STAFF_EMAIL_DOMAIN || STAFF_EMAIL_DOMAIN).toLowerCase();
    if (name.length < 3) throw new Error("Enter the staff member's full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid school email address.");
    if (!email.endsWith(`@${domain}`)) throw new Error(`Staff accounts must use the school domain (@${domain}). Create the mailbox in cPanel first.`);
    if (!STAFF_ROLE_LABELS[role]) throw new Error("Choose a staff role.");
    if ((db.staffAccounts || []).some((a) => String(a.email || "").toLowerCase() === email)) {
      throw new Error("That school email already has a portal account.");
    }
    const userId = uid("u-staff");
    db.users.push({
      id: userId, role, name, email,
      phone: String(payload.phone || "").trim(),
      title: STAFF_ROLE_LABELS[role],
    });
    const token = newStaffInviteToken();
    const account = {
      id: uid("st"), userId, email,
      password: "", passwordSet: false,
      status: "active", verified: false,
      inviteToken: token, verification: null, reset: null,
      createdAt: today(),
    };
    db.staffAccounts.push(account);
    if (!db.staffAccountByEmail) db.staffAccountByEmail = {};
    db.staffAccountByEmail[email] = account;
    const setupLink = `${portalBaseUrl(db.meta.inviteLink)}/staff/setup?invite=${token}`;
    const r = await sendStaffInvite({ to: email, name, roleLabel: STAFF_ROLE_LABELS[role], setupLink });
    const delivered = r.ok || r.simulated;
    db.deliveries.unshift({
      id: uid("d"), channel: "Email", to: email, ref: account.id,
      subject: `Staff invite — ${STAFF_ROLE_LABELS[role]} account for ${name}`,
      status: delivered ? "delivered" : "failed",
      provider: r.simulated ? "School mail relay (simulated)" : (r.ok ? mailProviderLabel() : `cPanel SMTP (failed: ${r.error})`),
      date: now(),
    });
    db.feesAudit.unshift({
      id: uid("fa"), date: now(), actor: "Head of School",
      action: `Staff invite sent — ${name} (${email}) as ${STAFF_ROLE_LABELS[role]}`,
      amount: 0,
    });
    // Simulated mode: no real email, so the console shows the invite link.
    // Live mode: the link stays in the email only — UNLESS the send failed,
    // in which case the link is returned as a fallback (the Head can send it
    // manually, e.g. WhatsApp) and the failure is flagged, not hidden.
    if (!delivered) {
      return { accountId: account.id, email, simulated: false, mailError: r.error || "SMTP send failed", setupLink, inviteToken: token };
    }
    return { accountId: account.id, email, simulated: r.simulated, ...(r.simulated ? { setupLink, inviteToken: token } : {}) };
  },
  staffInviteLookup({ db, payload }) {
    const account = (db.staffAccounts || []).find((a) => a.inviteToken === String(payload.token || "").trim());
    if (!account) throw new Error("That staff invite isn't recognised. Ask the Head of School to re-send it.");
    const user = db.users.find((u) => u.id === account.userId) || {};
    return {
      email: account.email, name: user.name || account.email,
      role: user.role, roleLabel: STAFF_ROLE_LABELS[user.role] || user.title || "Staff",
      verified: account.verified, status: account.status,
    };
  },
  staffInviteSetup({ db, payload }) {
    const account = (db.staffAccounts || []).find((a) => a.inviteToken === String(payload.token || "").trim());
    if (!account) throw new Error("That staff invite isn't recognised. Ask the Head of School to re-send it.");
    if (account.status !== "active") throw new Error("This account is deactivated — contact the Head of School.");
    if (account.verified && account.passwordSet) throw new Error("This account is already set up — sign in instead.");
    const password = String(payload.password || "");
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    setPasswordOn(account, password);
    account.verified = true;
    account.inviteToken = null; // single-use invite
    const user = db.users.find((u) => u.id === account.userId) || {};
    db.feesAudit.unshift({
      id: uid("fa"), date: now(), actor: "System",
      action: `Staff account activated — ${user.name || account.email} (${account.email})`,
      amount: 0,
    });
    return { session: staffSessionFor(db, account) };
  },
  async resendStaffInvite({ db, payload }) {
    const account = (db.staffAccounts || []).find((a) => a.id === payload.accountId);
    if (!account) throw new Error("Staff account not found.");
    if (account.verified && account.passwordSet) throw new Error("This account is already active — the holder can use Forgot password instead.");
    const user = db.users.find((u) => u.id === account.userId) || {};
    account.inviteToken = newStaffInviteToken();
    account.status = "active";
    const setupLink = `${portalBaseUrl(db.meta.inviteLink)}/staff/setup?invite=${account.inviteToken}`;
    const r = await sendStaffInvite({ to: account.email, name: user.name || account.email, roleLabel: STAFF_ROLE_LABELS[user.role] || "Staff", setupLink });
    const delivered = r.ok || r.simulated;
    db.deliveries.unshift({
      id: uid("d"), channel: "Email", to: account.email, ref: account.id,
      subject: `Staff invite re-sent — ${user.name || account.email}`,
      status: delivered ? "delivered" : "failed",
      provider: r.simulated ? "School mail relay (simulated)" : (r.ok ? mailProviderLabel() : `cPanel SMTP (failed: ${r.error})`),
      date: now(),
    });
    db.feesAudit.unshift({ id: uid("fa"), date: now(), actor: "Head of School", action: `Staff invite re-sent — ${user.name || account.email}`, amount: 0 });
    if (!delivered) {
      return { email: account.email, simulated: false, mailError: r.error || "SMTP send failed", setupLink, inviteToken: account.inviteToken };
    }
    return { email: account.email, simulated: r.simulated, ...(r.simulated ? { setupLink, inviteToken: account.inviteToken } : {}) };
  },
  async sendTestEmail({ db, payload }) {
    const to = String(payload.to || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("Enter a valid address to send the test to.");
    if (!isMailConfigured()) {
      db.deliveries.unshift({
        id: uid("d"), channel: "Email", to, ref: "mail-test",
        subject: "SMTP self-test (simulated — no SMTP_* configured)",
        status: "delivered", provider: "School mail relay (simulated)", date: now(),
      });
      return { simulated: true, message: "SMTP is not configured — running in simulated mode. Set SMTP_* (see docs/email-setup.md) and redeploy." };
    }
    const base = portalBaseUrl(db.meta.inviteLink);
    const r = await sendMail({
      to,
      subject: "Gill School OS — email is working",
      text: `This is a test from Gill School OS (${base}).\n\nIf you received this, staff invites, verification codes, password resets and fee receipts will deliver correctly.\n\n— Gill International School, Najjera`,
    });
    db.deliveries.unshift({
      id: uid("d"), channel: "Email", to, ref: "mail-test",
      subject: "SMTP self-test — Gill School OS",
      status: r.ok ? "delivered" : "failed",
      provider: r.ok ? mailProviderLabel() : `cPanel SMTP (failed: ${r.error})`, date: now(),
    });
    if (!r.ok) throw new Error(`Test email failed: ${r.error || "SMTP error"}. Check SMTP_HOST/PORT/USER/PASS and that the mailbox exists.`);
    return { simulated: false, message: `Test email delivered to ${to}. Check the inbox (and spam folder).` };
  },
  // ---- Launch-day safety: force everyone onto fresh email-verified passwords
  // One click flags every active account; each holder re-verifies with an
  // emailed code on next sign-in. Unverified invite accounts are skipped
  // (they set a password through the invite anyway).
  forcePasswordResetAll({ db, payload }) {
    const scope = (payload && payload.scope) || {};
    const counts = { staff: 0, family: 0, student: 0 };
    if (scope.staff !== false) {
      for (const a of db.staffAccounts || []) {
        if (a.status === "active" && a.verified && a.passwordSet) { a.mustReset = true; counts.staff++; }
      }
    }
    if (scope.family !== false) {
      for (const a of db.familyAccounts || []) {
        if ((a.status === "active" || a.status === "pending") && a.verified) { a.mustReset = true; counts.family++; }
      }
    }
    if (scope.student !== false) {
      for (const a of db.studentAccounts || []) {
        if (a.status === "active") { a.mustReset = true; counts.student++; }
      }
    }
    const total = counts.staff + counts.family + counts.student;
    db.feesAudit.unshift({
      id: uid("fa"), date: now(), actor: "Head of School",
      action: `Forced password reset for ${total} account(s) — ${counts.staff} staff, ${counts.family} families, ${counts.student} students`,
      amount: 0,
    });
    return { counts, total };
  },
  clearMustReset({ db, payload }) {
    const { scope, accountId } = payload || {};
    const list =
      scope === "staff" ? db.staffAccounts :
      scope === "family" ? db.familyAccounts :
      scope === "student" ? db.studentAccounts : null;
    if (!list) throw new Error("Unknown account scope.");
    const a = list.find((x) => x.id === accountId);
    if (!a) throw new Error("Account not found.");
    a.mustReset = false;
    const label = scope === "staff" ? a.email : scope === "family" ? a.username : a.username;
    db.feesAudit.unshift({ id: uid("fa"), date: now(), actor: "Head of School", action: `Reset flag cleared — ${scope} ${label} (support override)`, amount: 0 });
    return { ok: true };
  },
  setStaffStatus({ db, payload }) {
    const account = (db.staffAccounts || []).find((a) => a.id === payload.accountId);
    if (!account) throw new Error("Staff account not found.");
    if (!["active", "suspended"].includes(payload.status)) throw new Error("Unknown status.");
    if (account.userId === "u-admin" && payload.status !== "active") throw new Error("The Head of School account can't be deactivated.");
    account.status = payload.status;
    const user = db.users.find((u) => u.id === account.userId) || {};
    db.feesAudit.unshift({ id: uid("fa"), date: now(), actor: "Head of School", action: `Staff account ${payload.status} — ${user.name || account.email}`, amount: 0 });
    return { accountId: account.id, status: account.status };
  },

  // ---- Unified password reset (staff · parent · student, via email) ---------
  // Step 1: requestPasswordReset → 6-digit code emailed (15 min expiry).
  // Step 2: resetPasswordWithCode → code + new password.
  // Students are supervised: the code always goes to the parent's email.
  async requestPasswordReset({ db, payload }) {
    const portal = String(payload.portal || "").trim();
    const identifier = String(payload.identifier || "").trim();
    if (!identifier) throw new Error("Enter your sign-in email or username.");
    const target = findResetTarget(db, portal, identifier);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    target.account.reset = { code, to: target.email, expires: Date.now() + 15 * 60 * 1000, attempts: 0 };
    const r = await sendPasswordReset({ to: target.email, name: target.name, code, portalLabel: target.portalLabel });
    const delivered = r.ok || r.simulated;
    db.deliveries.unshift({
      id: uid("d"), channel: "Email", to: target.email, ref: target.account.id,
      subject: `Password reset code — ${target.portalLabel}`,
      status: delivered ? "delivered" : "failed",
      provider: r.simulated ? "School mail relay (simulated)" : (r.ok ? mailProviderLabel() : `cPanel SMTP (failed: ${r.error})`),
      date: now(),
    });
    if (!delivered) {
      target.account.reset = null;
      throw new Error(`We couldn't send the reset email (${r.error || "SMTP error"}). Check the mailbox and try again.`);
    }
    return { to: maskEmail(target.email), simulated: r.simulated, ...(r.simulated ? { demoCode: code } : {}) };
  },
  verifyResetCode({ db, payload }) {
    const target = findResetTarget(db, String(payload.portal || "").trim(), String(payload.identifier || "").trim());
    if (!target.account.reset) throw new Error("No reset was requested — start again.");
    checkResetCode(target.account, String(payload.code || ""));
    return { verified: true };
  },
  resetPasswordWithCode({ db, payload }) {
    const target = findResetTarget(db, String(payload.portal || "").trim(), String(payload.identifier || "").trim());
    if (!target.account.reset) throw new Error("No reset was requested — start again.");
    const newPassword = String(payload.newPassword || "");
    if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
    checkResetCode(target.account, String(payload.code || ""));
    if (target.kind === "student") {
      // Supervised child accounts stay parent-readable (Parent Portal →
      // Student Accounts shows the password to the family).
      target.account.password = newPassword;
    } else {
      setPasswordOn(target.account, newPassword);
    }
    target.account.reset = null;
    target.account.mustReset = false;
    if (target.kind === "staff") target.account.verified = true;
    if (target.kind === "family") { target.account.verified = true; target.account.passwordSet = true; }
    db.feesAudit.unshift({ id: uid("fa"), date: now(), actor: "System", action: `Password reset — ${target.portalLabel}: ${target.name}`, amount: 0 });
    return { ok: true };
  },
};

// Teacher roster for a child: Pre-School → the Nursery Lead; Main School →
// class teacher + subject teacher (Year 5 in the demo).
function teachersForStudent(db, student) {
  if (student.campus === "preschool") return ["t-sharon"];
  return ["t-aisha", "t-brian"];
}

// Creates (or resumes) the family group chat for a child — automatically
// triggered when the parent enables "Receive messages from teachers".
function ensureFamilyChat(db, studentId, fam) {
  const student = db.studentIndex[studentId];
  if (!student || !fam) throw new Error("Student or family not found");
  let chat = db.chats.find((c) => c.studentId === studentId && c.familyId === fam.id);
  if (chat) {
    chat.status = "active";
    return chat;
  }
  const teacherIds = teachersForStudent(db, student);
  const parents = fam.coParentUserId ? [fam.parentUserId, fam.coParentUserId] : [fam.parentUserId];
  const members = [
    ...teacherIds.map((id) => {
      const t = db.users.find((u) => u.id === id);
      return { userId: id, role: "teacher", name: t?.name || id };
    }),
    ...parents.map((id) => {
      const u = db.users.find((x) => x.id === id);
      return { userId: id, role: "parent", name: u?.name || id };
    }),
  ];
  chat = {
    id: uid("ch"),
    studentId,
    familyId: fam.id,
    title: `${student.name} — ${student.class.split(" ")[0]} · teacher & family group`,
    status: "active",
    autoCreated: true,
    createdAt: now(),
    members,
    messages: [
      {
        id: uid("cm"),
        from: teacherIds[0],
        role: "teacher",
        text: `Group created for ${student.name}. Teachers post updates here; the family sees every message, and the family can reply about attendance issues only.`,
        tag: "system",
        date: now(),
        readBy: [teacherIds[0]],
      },
    ],
  };
  db.chats.unshift(chat);
  db.feesAudit.unshift({ id: uid("fa"), date: now(), actor: "System", action: `Group chat created — ${student.name} · ${fam.name} family (${members.filter((m) => m.role === "parent").length} parent(s) + ${members.filter((m) => m.role === "teacher").length} teacher(s))`, amount: 0 });
  return chat;
}

function unreadFor(db, userId) {
  return db.chats
    .filter((c) => c.status === "active" && c.members.some((m) => m.userId === userId))
    .reduce((n, c) => n + c.messages.filter((m) => m.from !== userId && !m.readBy.includes(userId)).length, 0);
}

function gradeFor(score, max) {
  const p = (score / max) * 100;
  if (p >= 90) return "A";
  if (p >= 80) return "A−";
  if (p >= 70) return "B+";
  if (p >= 60) return "B";
  if (p >= 50) return "C";
  if (p >= 40) return "D";
  return "E";
}


function newStaffInviteToken() {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `STAFF-${seg()}-${seg()}`;
}

export function staffSessionFor(db, account) {
  const user = db.users.find((u) => u.id === account.userId) || {};
  const roleLabel = STAFF_ROLE_LABELS[user.role] || user.title || "Staff";
  return {
    id: user.id || account.userId,
    name: user.name || account.email,
    title: user.title || user.subject || roleLabel,
    email: account.email,
    role: "staff",
    staffRole: user.role,
    roleLabel,
    actor: true,
  };
}

function maskEmail(email) {
  const [local, domain] = String(email || "").split("@");
  if (!local || !domain) return "your email";
  const parts = domain.split(".");
  const tld = parts.length > 1 ? "." + parts.slice(1).join(".") : "";
  return `${local[0]}${"\u2022".repeat(Math.max(1, Math.min(local.length - 1, 4)))}@${parts[0][0]}${"\u2022".repeat(3)}${tld}`;
}

// Family login accepts the shared username (nansubuga.family) OR any parent
// email address held on the account.
export function findFamilyAccount(db, key) {
  const k = String(key || "").trim().toLowerCase();
  return (
    (db.familyAccounts || []).find((a) => String(a.username || "").trim().toLowerCase() === k) ||
    (db.familyAccounts || []).find((a) =>
      (a.members || []).some((id) => String(db.users.find((u) => u.id === id)?.email || "").toLowerCase() === k)
    ) ||
    null
  );
}

// Locates the account + destination email for a password reset.
function findResetTarget(db, portal, identifier) {
  const key = String(identifier || "").trim().toLowerCase();
  if (portal === "staff") {
    const account = (db.staffAccounts || []).find((a) => String(a.email || "").toLowerCase() === key);
    if (!account) throw new Error("We couldn't find that staff email — check the spelling or ask the Head of School for an invite.");
    if (account.status !== "active") throw new Error("This account is deactivated — contact the Head of School.");
    const user = db.users.find((u) => u.id === account.userId) || {};
    return { kind: "staff", account, email: account.email, name: user.name || account.email, portalLabel: `Staff Portal (${STAFF_ROLE_LABELS[user.role] || "Staff"})` };
  }
  if (portal === "parent") {
    const account = findFamilyAccount(db, key);
    if (!account) throw new Error("We couldn't find that family login — check the SMS invite or contact the school office.");
    const fam = db.families.find((f) => f.id === account.familyId) || {};
    const addrs = (account.members || [])
      .map((id) => db.users.find((u) => u.id === id)?.email)
      .filter((e) => e && /.+@.+\..+/.test(e));
    if (!addrs.length) throw new Error("No email address is on file for this family — contact the school office to add one.");
    return { kind: "family", account, email: addrs[0], name: `${fam.name || "Gill"} family`, portalLabel: "Parent Portal" };
  }
  if (portal === "student") {
    const account = (db.studentAccounts || []).find((a) => String(a.username || "").trim().toLowerCase() === key);
    if (!account) throw new Error("We couldn't find that student username — ask your parent to check Student Accounts.");
    const student = db.studentIndex[account.studentId] || {};
    const fam = db.families.find((f) => f.id === student.familyId) || {};
    const parentUser = db.users.find((u) => u.id === account.supervisedBy) || db.users.find((u) => u.id === fam.parentUserId) || {};
    if (!parentUser.email || !/.+@.+\..+/.test(parentUser.email)) throw new Error("No parent email is on file — ask the school office to add one, then try again.");
    return { kind: "student", account, email: parentUser.email, name: student.name || account.username, portalLabel: "Student Portal (code sent to parent)" };
  }
  throw new Error("Unknown portal.");
}

function checkResetCode(account, code) {
  const r = account.reset;
  if (!r) throw new Error("No reset was requested — start again.");
  if (Date.now() > r.expires) {
    account.reset = null;
    throw new Error("That code has expired — request a fresh one.");
  }
  r.attempts += 1;
  if (String(code || "") !== r.code) {
    if (r.attempts >= 5) {
      account.reset = null;
      throw new Error("Too many attempts — request a fresh code.");
    }
    throw new Error(`That code isn't right. ${5 - r.attempts} attempt(s) left.`);
  }
}

export async function runAction(type, payload) {
  const db = getDB();
  if (!actions[type]) throw new Error(`Unknown action: ${type}`);
  const result = await actions[type]({ db, payload });
  saveDB();
  return result;
}
