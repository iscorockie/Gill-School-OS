// Gill School OS — seed dataset
// All figures are realistic demo values in UGX. Currency formatting happens in the UI.

export const TERM = "Term 3 2026";
export const TERM_LABEL = "Term 3, 2026 (Sep – Dec)";
export const LATE_FEE = 20000;
export const LATE_CUTOFF = "17:00";
export const SIBLING_DISCOUNT_RATE = 0.1; // 10% off the Pre-School tuition when a sibling attends the Main School

export function seed() {
  return {
    meta: {
      school: "Gill International School",
      campus: "Najjera, Kampala",
      motto: "Excellence, Integrity, Service",
      currentTerm: TERM,
      inviteLink: "https://portal.gillschool.ac.ug",
      contacts: {
        admissions: "Mrs. Mary Kyomukama (Admissions)",
        bursar: "Mr. Isaac Twesigye (Bursar)",
        phone: "+256 755 071 456",
        phone2: "+256 783 003 231",
        email: "admissions@gillschool.ac.ug",
        address: "Plot 8, Block 228, Najjera, Kampala",
      },
    },

    users: [
      { id: "u-parent-1", role: "parent", name: "Amina Nansubuga", email: "amina.nansubuga@example.com", phone: "+256772111222", familyId: "fam-1", relation: "Mother / Guardian" },
      { id: "u-parent-1b", role: "parent", name: "Joseph Nansubuga", email: "joseph.nansubuga@example.com", phone: "+256703777888", familyId: "fam-1", relation: "Father" },
      { id: "u-parent-2", role: "parent", name: "Grace Achieng", email: "grace.achieng@example.com", phone: "+256701333444", familyId: "fam-2", relation: "Mother / Guardian" },
      { id: "u-parent-3", role: "parent", name: "David Okello", email: "d.okello@example.com", phone: "+256758555666", familyId: "fam-3", relation: "Father / Guardian" },
      { id: "u-parent-4", role: "parent", name: "Betty Ssemwanga", email: "b.ssemwanga@example.com", phone: "+256771444555", familyId: "fam-4", relation: "Mother / Guardian" },
      { id: "u-parent-4b", role: "parent", name: "Robert Ssemwanga", email: "r.ssemwanga@example.com", phone: "+256756666777", familyId: "fam-4", relation: "Father" },
      { id: "t-aisha", role: "teacher", name: "Ms. Aisha Hassan", email: "a.hassan@gill.sch", phone: "+256700111001", subject: "English & Class Teacher — Year 5" },
      { id: "t-brian", role: "teacher", name: "Mr. Brian Mugisha", email: "b.mugisha@gill.sch", phone: "+256700111002", subject: "Mathematics & Science — Year 5" },
      { id: "t-sharon", role: "teacher", name: "Ms. Sharon Namukasa", email: "s.namukasa@gill.sch", phone: "+256700111003", subject: "Pre-School Lead — Nursery 2" },
      { id: "u-bursar", role: "bursar", name: "Mr. Isaac Twesigye", email: "i.twesigye@gill.sch", phone: "+256700111004", title: "Bursar" },
      { id: "u-admissions", role: "admissions", name: "Mrs. Mary Kyomukama", email: "m.kyomukama@gill.sch", phone: "+256700111005", title: "Head of Admissions" },
      { id: "u-admin", role: "admin", name: "Mr. Francis Ssekandi", email: "f.ssekandi@gill.sch", phone: "+256700111006", title: "Head of School" },
      { id: "u-gate", role: "frontdesk", name: "Mr. Peter Othieno", email: "p.othieno@gill.sch", phone: "+256700111007", title: "Security & Gate Officer" },
    ],

    families: [
      {
        id: "fam-1",
        name: "Nansubuga",
        parentUserId: "u-parent-1",
        coParentUserId: "u-parent-1b",
        address: "Najjera 2, Kampala",
        children: [
          {
            id: "s-pres-1",
            name: "Maya Nansubuga",
            schoolId: "GIPS-2026-0207",
            campus: "preschool",
            class: "Nursery 2 (3–4 yrs)",
            startDate: "2025-01-13",
            dob: "2021-08-14",
            gender: "F",
            enrolled: true,
            featuredNote: "A confident storyteller who loves the phonics corner and our weekly garden day.",
            readiness: { assessment: "On track", strengths: ["Phonics", "Social play", "Fine motor"] },
          },
          {
            id: "s-main-1",
            name: "Jordan Nansubuga",
            schoolId: "GIS-2026-0142",
            campus: "main",
            class: "Year 5 — Cambridge Primary",
            startDate: "2022-01-17",
            dob: "2015-03-02",
            gender: "M",
            enrolled: true,
            featuredNote: "Year 5 class captain. Representing Blue House at the Sports Day relay.",
          },
        ],
      },
      {
        id: "fam-2",
        name: "Achieng",
        parentUserId: "u-parent-2",
        address: "Kira Road, Kampala",
        children: [
          {
            id: "s-pres-2",
            name: "Ethan Achieng",
            campus: "preschool",
            class: "Pre-K (2–3 yrs)",
            startDate: "2026-01-12",
            dob: "2022-11-05",
            gender: "M",
            enrolled: true,
            featuredNote: "Settling in beautifully — loves the water-play station.",
            readiness: { assessment: "On track", strengths: ["Curiosity", "Music"] },
          },
        ],
      },
      {
        id: "fam-3",
        name: "Okello",
        parentUserId: "u-parent-3",
        address: "Najjera 1, Kampala",
        children: [
          {
            id: "s-pres-3",
            name: "Daniel Okello",
            campus: "preschool",
            class: "Nursery 2 (3–4 yrs)",
            startDate: "2025-01-13",
            dob: "2021-05-21",
            gender: "M",
            enrolled: true,
            readyForPrimary: true,
            featuredNote: "Demand letter for Primary 1 received — teacher recommends progression to the Main School.",
            readiness: { assessment: "Exceeding", strengths: ["Numeracy", "Early writing", "Independence"] },
          },
        ],
      },
      {
        id: "fam-4",
        name: "Ssemwanga",
        parentUserId: "u-parent-4",
        coParentUserId: "u-parent-4b",
        address: "Kyanja, Kampala",
        children: [
          {
            id: "s-pres-4",
            name: "Kirabo Ssemwanga",
            schoolId: "GIPS-2026-0233",
            campus: "preschool",
            class: "Nursery 2 (3–4 yrs)",
            startDate: "2026-09-07",
            dob: "2022-02-11",
            gender: "F",
            enrolled: true,
            featuredNote: "New intake for Term 3 — the family portal is created automatically once tuition is cleared.",
            readiness: { assessment: "On track", strengths: ["Creativity", "Early numeracy"] },
          },
        ],
      },
    ],
    feeStructure: {
      preschool: { tuition: 450000, registration: 50000 },
      main: { tuition: 850000, registrationFree: true, entrance: 150000 },
    },

    invoices: [
      {
        id: "inv-fam1-t2",
        familyId: "fam-1",
        term: "Term 2 2026",
        issued: "2026-04-28",
        due: "2026-05-10",
        status: "paid",
        lines: [
          { studentId: "s-pres-1", label: "Pre-School Tuition (Nursery 2)", kind: "tuition", amount: 450000, discount: 45000 },
          { studentId: "s-main-1", label: "Main School Tuition (Year 5)", kind: "tuition", amount: 850000, discount: 0 },
          { label: "Main School Registration", kind: "fee", amount: 0, discount: 0 },
        ],
        siblingDiscount: 45000,
        total: 1255000,
        paid: 1255000,
        balance: 0,
      },
      {
        id: "inv-fam1-t3",
        familyId: "fam-1",
        term: TERM,
        issued: "2026-08-27",
        due: "2026-09-10",
        status: "partial",
        lines: [
          { studentId: "s-pres-1", label: "Pre-School Tuition (Nursery 2)", kind: "tuition", amount: 450000, discount: 45000 },
          { studentId: "s-main-1", label: "Main School Tuition (Year 5)", kind: "tuition", amount: 850000, discount: 0 },
          { studentId: "s-main-1", label: "Cambridge Checkpoint materials", kind: "fee", amount: 60000, discount: 0 },
          { studentId: "s-main-1", label: "Late pickup — 22 May 2026", kind: "latefee", amount: 20000, discount: 0 },
        ],
        siblingDiscount: 45000,
        total: 1335000,
        paid: 500000,
        balance: 835000,
      },
      {
        id: "inv-fam2-t3",
        familyId: "fam-2",
        term: TERM,
        issued: "2026-08-27",
        due: "2026-09-10",
        status: "unpaid",
        lines: [
          { studentId: "s-pres-2", label: "Pre-School Tuition (Pre-K)", kind: "tuition", amount: 450000, discount: 0 },
        ],
        siblingDiscount: 0,
        total: 450000,
        paid: 0,
        balance: 450000,
      },
      {
        id: "inv-fam3-t3",
        familyId: "fam-3",
        term: TERM,
        issued: "2026-08-27",
        due: "2026-09-10",
        status: "unpaid",
        lines: [
          { studentId: "s-pres-3", label: "Pre-School Tuition (Nursery 2)", kind: "tuition", amount: 450000, discount: 0 },
          { label: "Primary 1 entrance (provisional)", kind: "fee", amount: 150000, discount: 0 },
        ],
        siblingDiscount: 0,
        total: 600000,
        paid: 0,
        balance: 600000,
      },
      {
        id: "inv-fam4-t3",
        familyId: "fam-4",
        term: TERM,
        issued: "2026-08-29",
        due: "2026-09-07",
        status: "unpaid",
        lines: [
          { studentId: "s-pres-4", label: "Pre-School Tuition — new intake (Nursery 2)", kind: "tuition", amount: 450000, discount: 0 },
          { label: "Registration & first-term materials", kind: "fee", amount: 50000, discount: 0 },
        ],
        siblingDiscount: 0,
        total: 500000,
        paid: 0,
        balance: 500000,
      },
    ],

    payments: [
      { id: "pay-1001", invoiceId: "inv-fam1-t2", familyId: "fam-1", amount: 1255000, channel: "MTN Mobile Money", reference: "MTN-88231-7", date: "2026-05-06", receipt: "RCP-2026-0041", status: "settled" },
      { id: "pay-1002", invoiceId: "inv-fam1-t3", familyId: "fam-1", amount: 500000, channel: "Airtel Money", reference: "AIR-54019-2", date: "2026-08-28", receipt: "RCP-2026-0398", status: "settled" },
    ],

    notices: [
      { id: "n-1", title: "Term 3 begins Monday 7 September", body: "School opens at 7:45 am. All fee balances must be cleared by Thursday 10 September. Pre-orders for uniforms and books close Friday 4 September.", audience: "all", author: "Head of School", date: "2026-08-25" },
      { id: "n-2", title: "Science Fair — KG to Year 6", body: "Our annual Science Fair is on Saturday 12 September in the Main Hall. Parents are warmly invited; projects should be set up by 8:30 am.", audience: "parents", author: "Ms. Aisha Hassan", date: "2026-08-28" },
      { id: "n-3", title: "Pre-School Coffee Morning", body: "Join us on Friday 26 September at 9:00 am for a coffee morning with the Pre-School lead, Ms. Namukasa, and a reading workshop.", audience: "preschool", author: "Pre-School Office", date: "2026-08-30" },
      { id: "n-4", title: "Gate safety reminder", body: "The gate closes for pupil pickup at 5:00 pm sharp. A UGX 20,000 late-collection fee applies per child after 5:00 pm and is added to your fee account automatically.", audience: "all", author: "Front Office", date: "2026-08-20" },
    ],

    messages: [
      { id: "m-1", from: "t-aisha", to: "u-parent-1", subject: "Jordan — Term 3 reading club", body: "Dear Mrs. Nansubuga, Jordan has been selected for the Year 5 Reading Club. Sessions run Tuesdays 3:30–4:30 pm starting 8 September.", date: "2026-08-29", read: false, channel: "app" },
      { id: "m-2", from: "u-bursar", to: "u-parent-1", subject: "Fee balance reminder", body: "Your Term 3 balance of UGX 835,000 is due by 10 September. Pay by MTN MoMo, Airtel Money or card via the parent portal.", date: "2026-08-30", read: false, channel: "email" },
      { id: "m-3", from: "u-parent-1", to: "t-sharon", subject: "Maya — pick-up change tomorrow", body: "Good afternoon Ms. Namukasa, Maya will be collected by her grandmother tomorrow at 3:00 pm instead of me. Kindly confirm.", date: "2026-08-31", read: true, channel: "app" },
      { id: "m-4", from: "u-gate", to: "u-parent-1", subject: "Late collection notice — Jordan", body: "Jordan was collected at 5:07 pm on 22 May. A UGX 20,000 late fee was added to your account automatically.", date: "2026-05-22", read: true, channel: "sms" },
    ],

    deliveries: [
      { id: "d-1", channel: "SMS", to: "+256772111222", ref: "m-4", subject: "Late collection notice — Jordan", status: "delivered", provider: "MTN SMS Gateway (simulated)", date: "2026-05-22 17:08" },
      { id: "d-2", channel: "Email", to: "amina.nansubuga@example.com", ref: "m-2", subject: "Fee balance reminder", status: "delivered", provider: "Gill SMTP relay (simulated)", date: "2026-08-30 09:02" },
      // Family OS invite SMS — both parents on the admission form, one shared login
      { id: "d-3", channel: "SMS", to: "+256772111222", ref: "app-2", subject: "Welcome to Gill School OS — https://portal.gillschool.ac.ug (shared login: nansubuga.family)", status: "delivered", provider: "MTN SMS Gateway (simulated)", date: "2026-08-27 10:14" },
      { id: "d-4", channel: "SMS", to: "+256703777888", ref: "app-2", subject: "Welcome to Gill School OS — https://portal.gillschool.ac.ug (shared login: nansubuga.family)", status: "delivered", provider: "Airtel SMS Gateway (simulated)", date: "2026-08-27 10:14" },
      { id: "d-5", channel: "SMS", to: "+256701333444", ref: "app-3", subject: "Welcome to Gill School OS — https://portal.gillschool.ac.ug (shared login: achieng.family)", status: "delivered", provider: "MTN SMS Gateway (simulated)", date: "2026-08-27 10:31" },
    ],

    resources: [
      { id: "r-1", type: "Past paper", title: "Cambridge Primary English Stage 5 — 2023 Paper 1", subject: "English", stage: "Stage 5", campus: "main", addedBy: "t-aisha", date: "2026-08-05", downloads: 132, size: "1.4 MB", file: "/docs/eng-stage5-p1-2023.pdf" },
      { id: "r-2", type: "Past paper", title: "Cambridge Primary Mathematics Stage 5 — 2023 Paper 2", subject: "Mathematics", stage: "Stage 5", campus: "main", addedBy: "t-brian", date: "2026-08-05", downloads: 141, size: "1.1 MB", file: "/docs/maths-stage5-p2-2023.pdf" },
      { id: "r-3", type: "Worksheet", title: "Phonics — sound blend set 12 (Nursery 2)", subject: "Literacy", stage: "Pre-School", campus: "preschool", addedBy: "t-sharon", date: "2026-08-18", downloads: 89, size: "420 KB", file: "/docs/phonics-set12.pdf" },
      { id: "r-4", type: "Worksheet", title: "Fractions — equivalent families practice", subject: "Mathematics", stage: "Stage 5", campus: "main", addedBy: "t-brian", date: "2026-08-22", downloads: 76, size: "380 KB", file: "/docs/fractions-equivalent.pdf" },
      { id: "r-5", type: "E-book", title: "Cambridge Primary Science Learner's Book 5 — Ch. 1 (shared copy)", subject: "Science", stage: "Stage 5", campus: "main", addedBy: "t-brian", date: "2026-08-01", downloads: 210, size: "8.2 MB", file: "/docs/science-lb5-ch1.pdf" },
      { id: "r-6", type: "Newsletter", title: "The Gill Insider — Q2 2026", subject: "School news", stage: "All", campus: "all", addedBy: "u-admin", date: "2026-07-01", downloads: 320, size: "3.1 MB", file: "/docs/gill-insider-q2-2026.pdf" },
      { id: "r-7", type: "Newsletter", title: "The Gill Insider — Q1 2026", subject: "School news", stage: "All", campus: "all", addedBy: "u-admin", date: "2026-04-06", downloads: 290, size: "2.9 MB", file: "/docs/gill-insider-q1-2026.pdf" },
    ],

    events: [
      { id: "e-1", title: "Science Fair (KG–Year 6)", date: "2026-09-12", time: "08:30–13:00", location: "Main Hall", category: "Academic", audience: "all" },
      { id: "e-2", title: "Pre-School Coffee Morning & Reading Workshop", date: "2026-09-26", time: "09:00–11:00", location: "Pre-School Block", category: "Community", audience: "preschool" },
      { id: "e-3", title: "Inter-House Sports Day", date: "2026-10-17", time: "08:00–15:00", location: "School Grounds", category: "Sports", audience: "all" },
      { id: "e-4", title: "Visitation Day & Open Classrooms", date: "2026-11-07", time: "09:00–12:00", location: "All classrooms", category: "Community", audience: "all" },
      { id: "e-5", title: "Gill Pre-School Graduation", date: "2026-12-11", time: "10:00–12:00", location: "Main Hall", category: "Ceremony", audience: "preschool" },
      { id: "e-6", title: "Term 3 Closes", date: "2026-12-18", time: "12:00", location: "School", category: "Admin", audience: "all" },
    ],

    pickups: [
      { id: "pk-1", studentId: "s-main-1", date: "2026-05-22", timeOut: "17:07", collector: "Amina Nansubuga", late: true, fee: 20000, billedTo: "inv-fam1-t3", notified: true },
      { id: "pk-2", studentId: "s-pres-1", date: "2026-08-28", timeOut: "16:12", collector: "Amina Nansubuga", late: false, fee: 0, billedTo: null, notified: false },
      { id: "pk-3", studentId: "s-pres-2", date: "2026-08-29", timeOut: "15:45", collector: "Grace Achieng", late: false, fee: 0, billedTo: null, notified: false },
      { id: "pk-4", studentId: "s-pres-3", date: "2026-08-30", timeOut: "16:55", collector: "David Okello", late: false, fee: 0, billedTo: null, notified: false },
    ],

    leaves: [
      { id: "lv-1", studentId: "s-main-1", from: "2026-09-08", to: "2026-09-09", reason: "Fever — doctor's appointment at Case Clinic on Tuesday.", status: "pending", submittedBy: "u-parent-1", date: "2026-08-31", teacherNotified: ["t-aisha"] },
      { id: "lv-2", studentId: "s-pres-2", from: "2026-09-03", to: "2026-09-03", reason: "Family travel to Jinja. Will collect homework pack.", status: "approved", submittedBy: "u-parent-2", date: "2026-08-30", teacherNotified: ["t-sharon"] },
    ],

    orders: [
      { id: "ord-1", studentId: "s-main-1", term: "Term 3 2026", date: "2026-08-20", status: "placed", total: 205000,
        items: [
          { sku: "U-HTS-AD", name: "House T-shirt — Blue House", type: "uniform", size: "M", price: 25000, qty: 1 },
          { sku: "U-SKT-O", name: "Sports Kit (top + shorts)", type: "uniform", size: "S", price: 85000, qty: 1 },
          { sku: "B-PK-Y5", name: "Year 5 book pack", type: "books", size: "-", price: 95000, qty: 1 },
        ] },
    ],

    catalog: [
      { sku: "U-HTS-AD", name: "House T-shirt (all houses)", type: "uniform", size: "Adult small–XXL", price: 25000 },
      { sku: "U-SKT-O", name: "Sports Kit — top & shorts", type: "uniform", size: "XS–L", price: 85000 },
      { sku: "U-PE", name: "PE uniform set", type: "uniform", size: "XS–L", price: 55000 },
      { sku: "U-SWTR", name: "School sweater", type: "uniform", size: "5–12 yrs", price: 45000 },
      { sku: "B-PK-Y5", name: "Year 5 book pack (Cambridge)", type: "books", size: "–", price: 95000 },
      { sku: "B-PK-N2", name: "Nursery 2 activity pack", type: "books", size: "–", price: 60000 },
      { sku: "B-PK-PK", name: "Pre-K starter pack", type: "books", size: "–", price: 45000 },
    ],

    documents: [
      { id: "doc-1", studentId: "s-main-1", type: "Birth certificate", name: "jordan_birth_certificate.pdf", size: "1.2 MB", uploadedAt: "2022-01-10", by: "u-parent-1", status: "verified" },
      { id: "doc-2", studentId: "s-main-1", type: "Immunisation card", name: "jordan_immunisation_scan.jpg", size: "820 KB", uploadedAt: "2022-01-10", by: "u-parent-1", status: "verified" },
      { id: "doc-3", studentId: "s-pres-1", type: "Immunisation card", name: "maya_immunisation_scan.jpg", size: "740 KB", uploadedAt: "2025-01-08", by: "u-parent-1", status: "verified" },
      { id: "doc-4", studentId: "s-pres-1", type: "Past report", name: "maya_nursery1_report.pdf", size: "610 KB", uploadedAt: "2026-07-15", by: "u-parent-1", status: "pending review" },
      { id: "doc-5", studentId: "s-pres-3", type: "Birth certificate", name: "daniel_birth_certificate.pdf", size: "980 KB", uploadedAt: "2025-01-06", by: "u-parent-3", status: "verified" },
      { id: "doc-6", studentId: "s-pres-3", type: "Medical history", name: "daniel_medical_form.pdf", size: "540 KB", uploadedAt: "2026-08-28", by: "u-parent-3", status: "pending review" },
      { id: "doc-7", studentId: "s-pres-4", type: "Birth certificate", name: "kirabo_birth_certificate.pdf", size: "1.1 MB", uploadedAt: "2026-08-20", by: "u-parent-4", status: "verified" },
      { id: "doc-8", studentId: "s-pres-4", type: "Immunisation card", name: "kirabo_immunisation_scan.jpg", size: "760 KB", uploadedAt: "2026-08-20", by: "u-parent-4", status: "verified" },
      { id: "doc-9", studentId: "s-pres-4", type: "Parent contacts (admission form)", name: "kirabo_application_form.pdf", size: "420 KB", uploadedAt: "2026-08-20", by: "u-parent-4", status: "verified" },
    ],

    transitions: [
      { id: "tr-1", studentId: "s-pres-3", status: "initiated", initiatedBy: "t-sharon", date: "2026-08-28", targetClass: "Primary 1 (Cambridge)", targetCampus: "main",
        checklist: [
          { key: "Records", label: "Progress records & reports", done: true },
          { key: "Immunisation", label: "Immunisation records", done: true },
          { key: "Medical", label: "Medical history", done: true },
          { key: "Contacts", label: "Parent contacts", done: true },
          { key: "Documents", label: "Birth certificate", done: true },
        ],
        notes: "Teacher recommends Daniel for Primary 1. Parents confirmed intake." },
    ],

    assessments: [
      { id: "as-1", studentId: "s-main-1", subject: "English", term: "Term 2 2026", type: "Continuous assessment", title: "Reading comprehension — 'The River Child'", score: 78, max: 100, grade: "B+", teacher: "t-aisha", date: "2026-06-11", feedback: "Excellent inference skills. Focus on expanding vocabulary in descriptive writing." },
      { id: "as-2", studentId: "s-main-1", subject: "Mathematics", term: "Term 2 2026", type: "Continuous assessment", title: "Fractions & decimals quiz", score: 84, max: 100, grade: "A", teacher: "t-brian", date: "2026-06-18", feedback: "Strong grasp of equivalence. Watch the carrying step in decimal subtraction." },
      { id: "as-3", studentId: "s-main-1", subject: "Science", term: "Term 2 2026", type: "Checkpoint (mock)", title: "Cambridge Primary Checkpoint practice — papers 1–2", score: 148, max: 180, grade: "A−", teacher: "t-brian", date: "2026-07-02", feedback: "Knowledge is secure. Practice graph interpretation and the written-answer paper style." },
      { id: "as-4", studentId: "s-main-1", subject: "English", term: "Term 3 2026", type: "Continuous assessment", title: "Spelling & grammar starter", score: 9, max: 10, grade: "A", teacher: "t-aisha", date: "2026-08-28", feedback: "Great start to Term 3 — punctuation use is improving quickly." },
      { id: "as-5", studentId: "s-main-1", subject: "Mathematics", term: "Term 3 2026", type: "Continuous assessment", title: "Place value & rounding warm-up", score: 16, max: 20, grade: "B+", teacher: "t-brian", date: "2026-08-29", feedback: "Solid recall; revise rounding to 2 decimal places." },
      { id: "as-6", studentId: "s-pres-1", subject: "Emergent Literacy", term: "Term 2 2026", type: "Observation", title: "Phonics — letter sounds s,a,t,p,i,n", score: 5, max: 6, grade: "Emerging+", teacher: "t-sharon", date: "2026-06-20", feedback: "Maya recognises all six sounds and blends 'sat' and 'pin' independently. Lovely progress!" },
      { id: "as-7", studentId: "s-pres-1", subject: "Personal & Social", term: "Term 2 2026", type: "Observation", title: "Sharing & turn-taking", score: 4, max: 5, grade: "Secure", teacher: "t-sharon", date: "2026-07-01", feedback: "Maya is becoming a kind classroom helper. Encouraged to tidy up without prompting." },
    ],

    communications: {
      providers: [
        { id: "sms", name: "SMS gateway (MTN/Airtel)", unit: "UGX 55 / message", monthlyEstimate: 48000 },
        { id: "email", name: "School email relay", unit: "Free for school domain", monthlyEstimate: 0 },
        { id: "app", name: "In-app noticeboard & messaging", unit: "Included", monthlyEstimate: 0 },
      ],
    },

    // ---- Admission applications: parent onboarding pipeline ----
    // A parent account is created automatically on the OS once the
    // admission requirements are complete and full tuition is cleared.
    applications: [
      {
        id: "app-1",
        studentId: "s-pres-4",
        intake: TERM,
        campus: "preschool",
        status: "applied", // applied → activated (auto once requirements ✓ + tuition ✓)
        form: true,
        parentContacts: [
          { userId: "u-parent-4", name: "Betty Ssemwanga", relation: "Mother / Guardian", phone: "+256771444555", alive: true },
          { userId: "u-parent-4b", name: "Robert Ssemwanga", relation: "Father", phone: "+256756666777", alive: true },
        ],
      },
      {
        id: "app-2",
        studentId: "s-main-1",
        intake: "2022 intake",
        campus: "main",
        status: "activated",
        activatedAt: "2026-08-27 10:14",
        form: true,
        parentContacts: [
          { userId: "u-parent-1", name: "Amina Nansubuga", relation: "Mother / Guardian", phone: "+256772111222", alive: true },
          { userId: "u-parent-1b", name: "Joseph Nansubuga", relation: "Father", phone: "+256703777888", alive: true },
        ],
      },
      {
        id: "app-3",
        studentId: "s-pres-2",
        intake: "2026 & current",
        campus: "preschool",
        status: "activated",
        activatedAt: "2026-08-27 10:31",
        form: true,
        parentContacts: [
          { userId: "u-parent-2", name: "Grace Achieng", relation: "Mother / Guardian", phone: "+256701333444", alive: true },
        ],
      },
      {
        id: "app-4",
        studentId: "s-pres-3",
        intake: "2025 & current",
        campus: "preschool",
        status: "applied",
        form: true,
        parentContacts: [
          { userId: "u-parent-3", name: "David Okello", relation: "Father / Guardian", phone: "+256758555666", alive: true },
        ],
      },
    ],

    // ---- Family OS accounts: ONE login shared by all parents on file ----
    familyAccounts: [
      {
        id: "fa-1",
        familyId: "fam-1",
        username: "nansubuga.family",
        password: "gill2026",
        status: "active",
        activatedAt: "2026-08-27 10:14",
        inviteLink: "https://portal.gillschool.ac.ug",
        members: ["u-parent-1", "u-parent-1b"],
      },
      {
        id: "fa-2",
        familyId: "fam-2",
        username: "achieng.family",
        password: "gill2026",
        status: "active",
        activatedAt: "2026-08-27 10:31",
        inviteLink: "https://portal.gillschool.ac.ug",
        members: ["u-parent-2"],
      },
      // fam-3 (Okello) & fam-4 (Ssemwanga) have NO account yet — they activate
      // automatically the moment requirements + full tuition are complete.
    ],

    pickupsToday: [],

    // ---- Student portal accounts (created by the parent, supervised) ----
    studentAccounts: [
      {
        id: "sa-1",
        studentId: "s-main-1",
        username: "jordan.nansubuga",
        password: "gill123",
        supervisedBy: "u-parent-1",
        createdAt: "2026-08-29",
        status: "active",
        perms: {
          progress: true,
          homework: true,
          library: true,
          calendar: true,
          messages: true,
          fees: false,
        },
      },
    ],

    // ---- Timetable (Year 5) ----
    timetable: [
      { id: "tt-1", studentId: "s-main-1", day: "Mon", period: "08:00–08:40", subject: "English", teacher: "t-aisha", room: "Y5-01" },
      { id: "tt-2", studentId: "s-main-1", day: "Mon", period: "09:00–09:40", subject: "Mathematics", teacher: "t-brian", room: "Y5-01" },
      { id: "tt-3", studentId: "s-main-1", day: "Mon", period: "10:00–10:40", subject: "Science", teacher: "t-brian", room: "Science Lab" },
      { id: "tt-4", studentId: "s-main-1", day: "Mon", period: "11:00–11:40", subject: "Global Perspectives", teacher: "t-aisha", room: "Y5-01" },
      { id: "tt-5", studentId: "s-main-1", day: "Mon", period: "13:00–13:40", subject: "Swimming & PE", teacher: "t-brian", room: "Pool" },
      { id: "tt-6", studentId: "s-main-1", day: "Tue", period: "08:00–08:40", subject: "Mathematics", teacher: "t-brian", room: "Y5-01" },
      { id: "tt-7", studentId: "s-main-1", day: "Tue", period: "09:00–09:40", subject: "English", teacher: "t-aisha", room: "Y5-01" },
      { id: "tt-8", studentId: "s-main-1", day: "Tue", period: "10:00–10:40", subject: "Science", teacher: "t-brian", room: "Science Lab" },
      { id: "tt-9", studentId: "s-main-1", day: "Tue", period: "11:00–11:40", subject: "Creative Arts", teacher: "t-aisha", room: "Art Room" },
      { id: "tt-10", studentId: "s-main-1", day: "Wed", period: "08:00–08:40", subject: "English", teacher: "t-aisha", room: "Y5-01" },
      { id: "tt-11", studentId: "s-main-1", day: "Wed", period: "09:00–09:40", subject: "Mathematics", teacher: "t-brian", room: "Y5-01" },
      { id: "tt-12", studentId: "s-main-1", day: "Wed", period: "10:00–10:40", subject: "Checkpoint practice", teacher: "t-brian", room: "Y5-01" },
      { id: "tt-13", studentId: "s-main-1", day: "Wed", period: "11:00–11:40", subject: "ICT", teacher: "t-aisha", room: "Computer Lab" },
      { id: "tt-14", studentId: "s-main-1", day: "Thu", period: "08:00–08:40", subject: "Mathematics", teacher: "t-brian", room: "Y5-01" },
      { id: "tt-15", studentId: "s-main-1", day: "Thu", period: "09:00–09:40", subject: "English", teacher: "t-aisha", room: "Y5-01" },
      { id: "tt-16", studentId: "s-main-1", day: "Thu", period: "10:00–10:40", subject: "Global Perspectives", teacher: "t-aisha", room: "Y5-01" },
      { id: "tt-17", studentId: "s-main-1", day: "Thu", period: "11:00–11:40", subject: "Science", teacher: "t-brian", room: "Science Lab" },
      { id: "tt-18", studentId: "s-main-1", day: "Fri", period: "08:00–08:40", subject: "English", teacher: "t-aisha", room: "Y5-01" },
      { id: "tt-19", studentId: "s-main-1", day: "Fri", period: "09:00–09:40", subject: "Mathematics", teacher: "t-brian", room: "Y5-01" },
      { id: "tt-20", studentId: "s-main-1", day: "Fri", period: "10:00–10:40", subject: "Music & Drama", teacher: "t-aisha", room: "Hall" },
      { id: "tt-21", studentId: "s-main-1", day: "Fri", period: "11:00–11:40", subject: "Reading Club", teacher: "t-aisha", room: "Library" },
    ],

    // ---- Homework / assignments ----
    homework: [
      { id: "hw-1", studentId: "s-main-1", subject: "Mathematics", title: "Fractions — equivalent pairs worksheet", assigned: "2026-08-30", due: "2026-09-04", status: "pending", teacher: "t-brian", note: "Complete set 4, questions 1–12. Show your working." },
      { id: "hw-2", studentId: "s-main-1", subject: "English", title: "Reading journal — 'The River Child' chapters 3–4", assigned: "2026-08-29", due: "2026-09-03", status: "pending", teacher: "t-aisha", note: "Three sentences per chapter: what happened, one new word, your prediction." },
      { id: "hw-3", studentId: "s-main-1", subject: "Science", title: "Life cycles — draw & label a butterfly", assigned: "2026-08-27", due: "2026-09-02", status: "submitted", teacher: "t-brian", note: "Use the diagram sheet from Wednesday's lesson." },
      { id: "hw-4", studentId: "s-main-1", subject: "Global Perspectives", title: "My family's water usage — interview sheet", assigned: "2026-08-25", due: "2026-09-01", status: "graded", teacher: "t-aisha", note: "Excellent detail, 'Grade: B+'", grade: "B+" },
    ],

    // ---- Student inbox ----
    studentMessages: [
      { id: "sm-1", studentId: "s-main-1", from: "t-aisha", subject: "Reading club — Tuesday", body: "Jordan, remember Reading Club is at 3:30 pm on Tuesdays. Bring your journal.", date: "2026-08-30", read: false },
      { id: "sm-2", studentId: "s-main-1", from: "t-brian", subject: "Checkpoint practice", body: "Great progress on Wednesday's life cycles practice — 54/60. Keep an eye on the graph question style.", date: "2026-08-29", read: true },
    ],
    feesAudit: [
      { id: "fa-1", date: "2026-08-28 10:14", actor: "System", action: "Auto-applied 10% sibling discount to inv-fam1-t3 (Maya in Pre-School + Jordan in Year 5)", amount: 45000 },
      { id: "fa-2", date: "2026-05-22 17:08", actor: "System", action: "Late collection 17:07 — Jordan Nansubuga; UGX 20,000 added to family account", amount: 20000 },
      { id: "fa-3", date: "2026-08-28 09:31", actor: "System", action: "Airtel Money payment settled — RCP-2026-0398 reconciled with MTN MoMo statement batch", amount: 500000 },
    ],
  };
}
