// Gill School OS — school configuration + live seed.
//
// LIVE ONLY. There is no demo dataset anywhere in the product: the seed
// contains school configuration (fees, catalog, contacts) and the real staff
// roster as INVITE-STYLE accounts (no passwords). Families, students,
// invoices and every other record come from real use.

export const TERM = "Term 3 2026";
export const TERM_LABEL = "Term 3, 2026 (Sep – Dec)";
export const LATE_FEE = 20000;
export const LATE_CUTOFF = "17:00";
export const SIBLING_DISCOUNT_RATE = 0.1; // 10% off the Pre-School tuition when a sibling attends the Main School

export const STAFF_EMAIL_DOMAIN = "gill.ac.ug";
export const STAFF_ROLE_LABELS = {
  admin: "Head of School",
  bursar: "Bursar",
  admissions: "Admissions",
  teacher: "Teacher",
  frontdesk: "Gate / Front office",
};

// Canonical staff login accounts. Seeded INVITE-STYLE: no password exists
// until the holder opens their one-time setup link (/staff/setup?invite=…).
// The links are printed to the server console at first boot and are visible
// in Admin → Staff Accounts afterwards.
export function defaultStaffAccounts() {
  const at = new Date().toISOString();
  const mk = (id, userId, email) => ({
    id,
    userId,
    email,
    password: "",
    passwordSet: false,
    mustReset: false,
    status: "active",
    verified: false,
    inviteToken: `STF-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    verification: null,
    reset: null,
    createdAt: at,
  });
  return [
    mk("st-1", "t-aisha", "a.hassan@gill.ac.ug"),
    mk("st-2", "t-brian", "b.mugisha@gill.ac.ug"),
    mk("st-3", "t-sharon", "s.namukasa@gill.ac.ug"),
    mk("st-4", "u-admissions", "m.kyomukama@gill.ac.ug"),
    mk("st-5", "u-bursar", "i.twesigye@gill.ac.ug"),
    mk("st-6", "u-gate", "p.othieno@gill.ac.ug"),
    mk("st-7", "u-admin", "f.ssekandi@gill.ac.ug"),
  ];
}

// The one and only seed: school configuration + the staff roster. Everything
// else starts empty and is created by real use.
export function seed() {
  return {
    meta: {
      school: "Gill International School",
      campus: "Najjera, Kampala",
      motto: "Excellence, Integrity, Service",
      currentTerm: TERM,
      inviteLink: "https://portal.gill.ac.ug",
      contacts: {
        admissions: "Mrs. Mary Kyomukama (Admissions)",
        bursar: "Mr. Isaac Twesigye (Bursar)",
        phone: "+256 771 648 684",
        phone2: "+256 755 071 456",
        phone3: "+256 783 003 231",
        whatsapp: "+256 771 648 684",
        email: "info@gill.ac.ug",
        address: "Mbogo Road 1, Najjera, Kampala",
      },
    },

    // The real staff roster (people). Staff sign in at /staff with their
    // school webmail address + a portal password they set themselves — the
    // webmail mailbox password and the portal password are separate.
    users: [
      { id: "t-aisha", role: "teacher", name: "Ms. Aisha Hassan", email: "a.hassan@gill.ac.ug", phone: "+256700111001", subject: "English & Class Teacher — Year 5" },
      { id: "t-brian", role: "teacher", name: "Mr. Brian Mugisha", email: "b.mugisha@gill.ac.ug", phone: "+256700111002", subject: "Mathematics & Science — Year 5" },
      { id: "t-sharon", role: "teacher", name: "Ms. Sharon Namukasa", email: "s.namukasa@gill.ac.ug", phone: "+256700111003", subject: "Pre-School Lead — Nursery" },
      { id: "u-bursar", role: "bursar", name: "Mr. Isaac Twesigye", email: "i.twesigye@gill.ac.ug", phone: "+256700111004", title: "Bursar" },
      { id: "u-admissions", role: "admissions", name: "Mrs. Mary Kyomukama", email: "m.kyomukama@gill.ac.ug", phone: "+256700111005", title: "Head of Admissions" },
      { id: "u-admin", role: "admin", name: "Mr. Francis Ssekandi", email: "f.ssekandi@gill.ac.ug", phone: "+256700111006", title: "Head of School" },
      { id: "u-gate", role: "frontdesk", name: "Mr. Peter Othieno", email: "p.othieno@gill.ac.ug", phone: "+256700111007", title: "Security & Gate Officer" },
    ],

    staffAccounts: defaultStaffAccounts(),

    feeStructure: {
      preschool: { tuition: 450000, registration: 50000 },
      main: { tuition: 850000, registrationFree: true, entrance: 150000 },
    },

    catalog: [
      { sku: "U-HTS-AD", name: "House T-shirt (all houses)", type: "uniform", size: "Adult small–XXL", price: 25000 },
      { sku: "U-SKT-O", name: "Sports Kit — top & shorts", type: "uniform", size: "XS–L", price: 85000 },
      { sku: "U-PE", name: "PE uniform set", type: "uniform", size: "XS–L", price: 55000 },
      { sku: "U-SWTR", name: "School sweater", type: "uniform", size: "5–12 yrs", price: 45000 },
      { sku: "B-PK-Y5", name: "Year 5 book pack (Cambridge)", type: "books", size: "–", price: 95000 },
      { sku: "B-PK-N2", name: "Nursery activity pack", type: "books", size: "–", price: 60000 },
      { sku: "B-PK-PK", name: "Toddlers starter pack", type: "books", size: "–", price: 45000 },
    ],

    // Records — created by real use only.
    families: [],
    invoices: [],
    payments: [],
    notices: [],
    messages: [],
    deliveries: [],
    resources: [],
    events: [],
    pickups: [],
    pickupsToday: [],
    leaves: [],
    orders: [],
    documents: [],
    transitions: [],
    assessments: [],
    communications: [],
    chats: [],
    applications: [],
    familyAccounts: [],
    studentAccounts: [],
    timetable: [],
    homework: [],
    studentMessages: [],
    feesAudit: [{
      id: "fa-seed",
      date: new Date().toISOString(),
      actor: "System",
      action: "Database created — school configuration + staff roster seeded (one-time setup links printed to the server console).",
      amount: 0,
    }],
  };
}
