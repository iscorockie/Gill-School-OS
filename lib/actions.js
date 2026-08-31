// Centralised action dispatcher: every mutation in the demo goes through
// POST /api/action { type, payload } -> { ok, db }.

import fs from "fs";
import path from "path";
import { getDB, saveDB, uid } from "./store.js";
import { LATE_FEE, LATE_CUTOFF, SIBLING_DISCOUNT_RATE, TERM } from "./seed.js";

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
  payInvoice({ db, payload }) {
    const { invoiceId, amount, channel, phone } = payload;
    const inv = db.invoices.find((i) => i.id === invoiceId);
    if (!inv) throw new Error("Invoice not found");
    const fam = db.families.find((f) => f.id === inv.familyId);
    const balance = Math.max(0, inv.total - inv.paid);
    const pay = Math.min(amount, balance);
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
    const fam = db.families.find((f) => f.id === student.familyId);
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
  sendMessage({ db, payload }) {
    const { from, to, subject, body, channel } = payload;
    const msg = {
      id: uid("m"), from, to, subject, body, date: today(), read: false, channel: channel || "app",
    };
    db.messages.push(msg);
    const recipient = db.users.find((u) => u.id === to);
    db.deliveries.unshift({
      id: uid("d"),
      channel: channel === "sms" ? "SMS" : channel === "email" ? "Email" : "In-app",
      to: channel === "sms" ? recipient?.phone : recipient?.email || recipient?.name,
      ref: msg.id, subject, status: "delivered",
      provider: channel === "sms" ? "MTN SMS Gateway (simulated)" : channel === "email" ? "Gill SMTP relay (simulated)" : "Gill noticeboard",
      date: now(),
    });
    return msg;
  },
  publishNotice({ db, payload }) {
    const notice = {
      id: uid("n"), title: payload.title, body: payload.body,
      audience: payload.audience || "all", author: payload.author || "Front Office", date: today(),
    };
    db.notices.unshift(notice);
    return notice;
  },
  markRead({ db, payload }) {
    const m = db.messages.find((x) => x.id === payload.messageId);
    if (m) m.read = true;
    return m;
  },

  // ---- Pre-orders -------------------------------------------------------------
  placeOrder({ db, payload }) {
    const { studentId, items, term } = payload;
    const order = {
      id: uid("ord"), studentId, term: term || TERM, date: today(),
      status: "placed", total: items.reduce((s, i) => s + i.price * i.qty, 0), items,
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
    const remarkStudent = payload.remarkStudent || feedback || "";
    const remarkParent = payload.remarkParent || "";
    const student = db.studentIndex[studentId];
    const fam = db.families.find((f) => f.id === student?.familyId);
    const assessment = {
      id: uid("as"), studentId, subject, term: TERM, type, title,
      score: Number(score), max: Number(max), grade: gradeFor(score, max),
      teacher, date: today(), feedback: remarkStudent,
      remarkStudent, remarkParent,
    };
    db.assessments.unshift(assessment);
    if (fam) {
      db.messages.push({
        id: uid("m"), from: teacher || "u-admin", to: fam.parentUserId,
        subject: `New assessment published — ${student.name}`,
        body: `${student.name} scored ${score}/${max} in ${subject} (${title}). Your private remark from the teacher: ${remarkParent || "see Children & Progress."} The child's remark is separate and the family controls whether it shows in their portal.`,
        date: today(), read: false, channel: "app",
      });
    }
    return assessment;
  },

  // ---- Documents ----------------------------------------------------------------
  uploadDocument({ db, payload }) {
    const { studentId, type, name, size } = payload;
    const doc = {
      id: uid("doc"), studentId, type, name: name || `${type.replace(/\s+/g, "_").toLowerCase()}_upload.pdf`,
      size: size || "—", uploadedAt: today(), by: payload.by || "u-parent-1", status: "pending review",
    };
    db.documents.unshift(doc);
    return doc;
  },
  verifyDocument({ db, payload }) {
    const doc = db.documents.find((d) => d.id === payload.docId);
    if (doc) doc.status = payload.status;
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
    const setupLink = `${account.inviteLink}/setup?invite=${account.inviteToken}`;
    for (const p of parents) {
      db.deliveries.unshift({
        id: uid("d"),
        channel: "SMS",
        to: p.phone,
        ref: app.id,
        subject: `Gill School OS access — ${setupLink} · shared login: ${account.username}`,
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
  inviteSetup({ db, payload }) {
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
    account.password = password;
    account.passwordSet = true;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    account.verification = { code, channel, to, expires: Date.now() + 10 * 60 * 1000, attempts: 0 };
    db.deliveries.unshift({
      id: uid("d"), channel: channel === "email" ? "Email" : "SMS", to, ref: account.id,
      subject: `Your Gill School OS verification code: ${code} (expires in 10 minutes)`,
      status: "delivered", provider: channel === "email" ? "School mail relay (simulated)" : "MTN/Airtel SMS Gateway (simulated)", date: now(),
    });
    db.feesAudit.unshift({ id: uid("fa"), date: now(), actor: "System", action: `Password created for ${fam.name} family — verification code sent by ${channel}`, amount: 0 });
    return { channel, to, demoCode: code }; // demoCode only: the real gateway is simulated in this demo
  },
  inviteResend({ db, payload }) {
    const account = db.familyAccounts.find((a) => a.inviteToken === String(payload.token || "").trim());
    if (!account) throw new Error("That invite link isn't recognised.");
    if (!account.verification) throw new Error("Create a password first — then we resend the code.");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    account.verification.code = code;
    account.verification.expires = Date.now() + 10 * 60 * 1000;
    account.verification.attempts = 0;
    db.deliveries.unshift({
      id: uid("d"), channel: account.verification.channel === "email" ? "Email" : "SMS", to: account.verification.to, ref: account.id,
      subject: `Your new Gill School OS verification code: ${code}`,
      status: "delivered", provider: "Gateway (simulated)", date: now(),
    });
    return { channel: account.verification.channel, to: account.verification.to, demoCode: code };
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
    const e = { id: uid("e"), ...payload, time: payload.time || "08:00", location: payload.location || "School", category: payload.category || "Academic", audience: payload.audience || "all" };
    db.events.push(e);
    return e;
  },
  addResource({ db, payload }) {
    const r = {
      id: uid("r"), type: payload.type || "Worksheet", title: payload.title, subject: payload.subject || "General",
      stage: payload.stage || "All", campus: payload.campus || "all", addedBy: payload.by || "u-admin",
      date: today(), downloads: 0, size: payload.size || "—", file: payload.file || "#",
    };
    db.resources.unshift(r);
    return r;
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

export function runAction(type, payload) {
  const db = getDB();
  if (!actions[type]) throw new Error(`Unknown action: ${type}`);
  const result = actions[type]({ db, payload });
  saveDB();
  return result;
}
