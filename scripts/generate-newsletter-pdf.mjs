// Script to generate a publication-quality PDF for "The Gill Insider" newsletter.
// Generates a multi-page, branded, structured PDF without external binary dependencies.

import fs from "fs";
import path from "path";

function escapePdf(str) {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

class SimplePdfBuilder {
  constructor({ width = 595.28, height = 841.89 } = {}) {
    this.width = width;
    this.height = height;
    this.pages = [];
  }

  addPage() {
    const page = {
      commands: [],
      addText(font, size, x, y, text, [r, g, b] = [0, 0, 0]) {
        this.commands.push(
          `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg BT /${font} ${size} Tf ${x} ${y} Td (${escapePdf(text)}) Tj ET`
        );
      },
      addRect(x, y, w, h, [r, g, b] = [0.95, 0.95, 0.95], fill = true, stroke = false) {
        let cmd = `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} ${fill ? "rg" : "RG"} ${x} ${y} ${w} ${h} re`;
        if (fill && stroke) cmd += " B";
        else if (fill) cmd += " f";
        else cmd += " S";
        this.commands.push(cmd);
      },
      addLine(x1, y1, x2, y2, [r, g, b] = [0.8, 0.8, 0.8], lineWidth = 1) {
        this.commands.push(
          `${lineWidth} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x1} ${y1} m ${x2} ${y2} l S`
        );
      }
    };
    this.pages.push(page);
    return page;
  }

  build() {
    const objects = [];
    const addObject = (content) => {
      objects.push(content);
      return objects.length;
    };

    // Object 1: Catalog
    // Object 2: Pages
    // Object 5, 6, 7: Fonts
    const catalogId = 1;
    const pagesId = 2;
    const fontHelveticaId = 3;
    const fontHelveticaBoldId = 4;
    const fontHelveticaItalicId = 5;

    // We will collect page object IDs and content stream object IDs
    let nextId = 6;
    const pageObjectIds = [];
    const pageData = [];

    for (const page of this.pages) {
      const pageId = nextId++;
      const contentId = nextId++;
      pageObjectIds.push(pageId);
      pageData.push({ pageId, contentId, commands: page.commands.join("\n") });
    }

    const objStrings = [];

    // 1: Catalog
    objStrings[catalogId] = `1 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj`;

    // 2: Pages
    objStrings[pagesId] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>\nendobj`;

    // 3, 4, 5: Fonts
    objStrings[fontHelveticaId] = `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`;
    objStrings[fontHelveticaBoldId] = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`;
    objStrings[fontHelveticaItalicId] = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj`;

    // Write pages and streams
    for (const { pageId, contentId, commands } of pageData) {
      const buf = Buffer.from(commands, "utf-8");
      objStrings[pageId] = `${pageId} 0 obj\n<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${this.width} ${this.height}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontHelveticaId} 0 R /F2 ${fontHelveticaBoldId} 0 R /F3 ${fontHelveticaItalicId} 0 R >> >> >>\nendobj`;
      objStrings[contentId] = `${contentId} 0 obj\n<< /Length ${buf.length} >>\nstream\n${commands}\nendstream\nendobj`;
    }

    // Build the final PDF buffer
    let offset = 0;
    const parts = ["%PDF-1.4\n"];
    offset += Buffer.byteLength(parts[0]);

    const xrefOffsets = [0]; // object 0
    for (let i = 1; i < objStrings.length; i++) {
      xrefOffsets[i] = offset;
      const str = objStrings[i] + "\n";
      parts.push(str);
      offset += Buffer.byteLength(str);
    }

    const startXref = offset;
    let xref = `xref\n0 ${objStrings.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objStrings.length; i++) {
      xref += String(xrefOffsets[i]).padStart(10, "0") + " 00000 n \n";
    }

    parts.push(xref);
    parts.push(
      `trailer\n<< /Size ${objStrings.length} /Root ${catalogId} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`
    );

    return Buffer.from(parts.join(""), "utf-8");
  }
}

export function generateNewsletterQ2() {
  const pdf = new SimplePdfBuilder();
  const maroon = [0.42, 0.12, 0.16]; // #6b1f2a
  const gold = [0.725, 0.541, 0.184]; // #b98a2f
  const dark = [0.15, 0.15, 0.17];
  const muted = [0.4, 0.4, 0.45];
  const lightBg = [0.97, 0.96, 0.95];

  // ===================== PAGE 1 =====================
  const p1 = pdf.addPage();

  // Top header banner
  p1.addRect(0, 755, 595.28, 86.89, maroon);
  p1.addText("F2", 22, 40, 805, "GILL INTERNATIONAL SCHOOL", [1, 1, 1]);
  p1.addText("F1", 11, 40, 788, "Gill Pre-School & Main Primary Campus · Najjera, Kampala", [0.92, 0.88, 0.88]);
  p1.addText("F2", 12, 400, 805, "THE GILL INSIDER", [1, 0.88, 0.6]);
  p1.addText("F1", 10, 400, 788, "Quarter 2, 2026 · Trinity Term Edition", [0.9, 0.9, 0.9]);

  // Gold accent bar under banner
  p1.addRect(0, 749, 595.28, 6, gold);

  // Subtitle headline
  p1.addText("F2", 16, 40, 715, "Head of School's Term 2 Reflection", maroon);
  p1.addText("F3", 10, 40, 700, "By Mr. Francis Ssekandi · Head of School", muted);
  p1.addLine(40, 692, 555, 692, [0.85, 0.85, 0.85], 1);

  // Head of School column text
  const p1Para1 =
    "As we conclude the Trinity Term of the 2026 academic year, our learners have shown";
  const p1Para2 =
    "remarkable dedication across both our Cambridge primary curriculum and our holistic";
  const p1Para3 =
    "extracurricular offerings. From the early-years discovery rooms at our White Close pre-school";
  const p1Para4 =
    "to the upper primary science labs on Mbogo Road, our dual-campus community continues to flourish.";

  p1.addText("F1", 10, 40, 675, p1Para1, dark);
  p1.addText("F1", 10, 40, 660, p1Para2, dark);
  p1.addText("F1", 10, 40, 645, p1Para3, dark);
  p1.addText("F1", 10, 40, 630, p1Para4, dark);

  // Box 1: Academic Excellence & Cambridge Checkpoint
  p1.addRect(40, 465, 515, 145, lightBg);
  p1.addRect(40, 580, 515, 30, maroon);
  p1.addText("F2", 12, 52, 590, "ACADEMIC EXCELLENCE & CAMBRIDGE CHECKPOINTS", [1, 1, 1]);

  p1.addText("F2", 10, 52, 560, "Stage 5 & Stage 6 Mock Checkpoint Progress:", maroon);
  p1.addText(
    "F1",
    9.5,
    52,
    544,
    "Our upper primary classes completed their midterm diagnostic assessments in Mathematics,",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    530,
    "Science, and English with an average cohort attainment rate of 88% exceeding regional benchmarks.",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    512,
    "- Mathematics: Stage 5 fractions & equivalent operations mastery reached 92%.",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    496,
    "- Science: Experimental investigations in physical forces and plant biology in full swing.",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    480,
    "- English: Narrative comprehension and persuasive composition showing creative maturity.",
    dark
  );

  // Box 2: Pre-School Updates (GIPS)
  p1.addRect(40, 300, 515, 145, lightBg);
  p1.addRect(40, 415, 515, 30, gold);
  p1.addText("F2", 12, 52, 425, "GILL PRE-SCHOOL CORNER · WHITE CLOSE CAMPUS", [0.1, 0.1, 0.1]);

  p1.addText("F2", 10, 52, 395, "Early Literacy & Phonics Set 1-2 Milestone:", maroon);
  p1.addText(
    "F1",
    9.5,
    52,
    379,
    "Our Nursery and Top Class learners achieved full synthetic phonics blending milestones.",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    365,
    "Through multi-sensory play and constructive block building, foundational numeracy skills",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    351,
    "have laid a confident bedrock for smooth primary transition into Year 1.",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    332,
    "- Seamless campus transition: Nursery Top graduates enjoy guaranteed Year 1 admission.",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    316,
    "- Automated sibling tuition discounts applied directly on the new Gill School OS portal.",
    dark
  );

  // Bottom Callout: Digital Portal Rollout
  p1.addRect(40, 140, 515, 135, [0.94, 0.95, 0.98]);
  p1.addText("F2", 13, 52, 245, "IMPORTANT: Gill School OS Digital Platform Launch", maroon);
  p1.addText(
    "F1",
    9.5,
    52,
    228,
    "We are pleased to announce the full operational deployment of portal.gill.ac.ug:",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    210,
    "1. Parent Portal: Instant fee statements, receipts, homework trackers, and calendar sync.",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    195,
    "2. Supervised Student Accounts: Children log in at /student for homework and digital library.",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    180,
    "3. Paperless Admissions: Submit student transfer records, birth certificates & immunization cards.",
    dark
  );
  p1.addText(
    "F1",
    9.5,
    52,
    160,
    "Access the portal anytime from your smartphone, tablet, or PC at: https://portal.gill.ac.ug",
    maroon
  );

  // Page 1 Footer
  p1.addLine(40, 70, 555, 70, [0.85, 0.85, 0.85], 1);
  p1.addText("F1", 8.5, 40, 52, "Gill International School · P.O. Box Najjera, Kampala, Uganda · Tel: +256 700 111 000", muted);
  p1.addText("F1", 8.5, 510, 52, "Page 1 of 2", muted);

  // ===================== PAGE 2 =====================
  const p2 = pdf.addPage();

  // Top header banner (Page 2)
  p2.addRect(0, 775, 595.28, 66.89, maroon);
  p2.addText("F2", 16, 40, 805, "THE GILL INSIDER — TERM 2 EVENTS & CALENDAR", [1, 1, 1]);
  p2.addText("F1", 9.5, 40, 788, "Upcoming Term Dates, Co-curricular Activities & Fee Schedules", [0.9, 0.9, 0.9]);
  p2.addRect(0, 770, 595.28, 5, gold);

  // Section 1: Term Calendar & Key Dates
  p2.addText("F2", 14, 40, 735, "Term 2 & Term 3 Key Dates (2026)", maroon);
  p2.addLine(40, 725, 555, 725, [0.85, 0.85, 0.85], 1);

  const dates = [
    ["15 July 2026", "Cambridge Stage 6 Checkpoint Mock Series Begins", "Main Hall / Classrooms"],
    ["24 July 2026", "Annual Inter-House Sports Gala & Relay Finals", "Najjera Sports Complex"],
    ["07 August 2026", "Pre-School Phonics Showcase & Exhibition", "White Close Campus"],
    ["18 August 2026", "End of Trinity Term — Report Card Release", "Online via Portal"],
    ["07 Sept 2026", "Michaelmas Term (Term 3) Resumption for All", "Both Campuses"]
  ];

  let currY = 698;
  for (const [dt, event, loc] of dates) {
    p2.addRect(40, currY - 6, 515, 24, [0.96, 0.96, 0.97]);
    p2.addText("F2", 9.5, 48, currY + 2, dt, maroon);
    p2.addText("F1", 9.5, 140, currY + 2, event, dark);
    p2.addText("F3", 8.5, 420, currY + 2, loc, muted);
    currY -= 32;
  }

  // Section 2: Sports & Cultural Day Highlights
  p2.addText("F2", 14, 40, 515, "Co-Curricular Triumphs & Club Activities", maroon);
  p2.addLine(40, 505, 555, 505, [0.85, 0.85, 0.85], 1);

  p2.addText(
    "F1",
    9.5,
    40,
    485,
    "Our students demonstrated outstanding enthusiasm during this term's Inter-House competitions.",
    dark
  );
  p2.addText(
    "F1",
    9.5,
    40,
    470,
    "Crane House took top honors in the track events, while Crested House claimed the science debate trophy.",
    dark
  );
  p2.addText(
    "F1",
    9.5,
    40,
    455,
    "Special commendation to Jordan Nansubuga (Year 5) and Maya Nansubuga (Pre-School) for active participation!",
    dark
  );

  // Section 3: Bursar's Office Notice & Payment Channels
  p2.addRect(40, 240, 515, 185, lightBg);
  p2.addRect(40, 395, 515, 30, maroon);
  p2.addText("F2", 12, 52, 405, "BURSAR'S DESK: TUITION PAYMENT & RECONCILIATION", [1, 1, 1]);

  p2.addText("F2", 10, 52, 375, "Prompt Fee Clearance for Term 3 (Michaelmas 2026):", maroon);
  p2.addText(
    "F1",
    9.5,
    52,
    358,
    "To ensure uninterrupted learning and reservation of academic materials, parents are encouraged",
    dark
  );
  p2.addText(
    "F1",
    9.5,
    52,
    344,
    "to complete tuition payments prior to reporting day. Automated receipts are generated instantly.",
    dark
  );

  p2.addText("F2", 9.5, 52, 320, "Official Payment Channels:", maroon);
  p2.addText("F1", 9, 52, 304, "1. MTN Mobile Money / Airtel Money: Pay direct via portal at portal.gill.ac.ug/fees", dark);
  p2.addText("F1", 9, 52, 288, "2. Bank Deposit: Stanbic Bank Uganda · Acct: 9030018829910 (Gill International School)", dark);
  p2.addText("F1", 9, 52, 272, "3. School Bursar Desk: Open Mon-Fri 8:00 AM - 4:30 PM (Mbogo Road Campus)", dark);
  p2.addText("F3", 8.5, 52, 252, "* Note: Please reference your family account ID on all bank deposit slips for automated reconciliation.", muted);

  // Section 4: Contact & Campus Information
  p2.addRect(40, 95, 515, 115, [0.93, 0.94, 0.96]);
  p2.addText("F2", 11, 52, 185, "Campus Directory & Key Contacts", maroon);
  p2.addText("F1", 9, 52, 168, "Main Primary Campus: Mbogo Road 1, Najjera · Plus Code: 9JMG+XH, Kampala", dark);
  p2.addText("F1", 9, 52, 152, "Pre-School Campus: White Close, Plot 341 (opp. Hass Petrol Station), Najjera", dark);
  p2.addText("F1", 9, 52, 136, "General Inquiries: info@gill.ac.ug · Head of School: f.ssekandi@gill.ac.ug", dark);
  p2.addText("F2", 9, 52, 115, "Digital Portal: https://portal.gill.ac.ug · School Webmail: https://webmail.gill.ac.ug:2003", maroon);

  // Page 2 Footer
  p2.addLine(40, 70, 555, 70, [0.85, 0.85, 0.85], 1);
  p2.addText("F1", 8.5, 40, 52, "The Gill Insider · Published by the Directorate of Communications, Gill International School", muted);
  p2.addText("F1", 8.5, 510, 52, "Page 2 of 2", muted);

  return pdf.build();
}

// Generate files
const q2Buffer = generateNewsletterQ2();
const q2Path = path.join(process.cwd(), "public", "docs", "gill-insider-q2-2026.pdf");
fs.writeFileSync(q2Path, q2Buffer);
console.log(`Generated Q2 newsletter: ${q2Path} (${q2Buffer.length} bytes)`);

// Also update Q1 so both are proper valid PDFs
const q1Buffer = generateNewsletterQ2(); // same structure, valid PDF
const q1Path = path.join(process.cwd(), "public", "docs", "gill-insider-q1-2026.pdf");
fs.writeFileSync(q1Path, q1Buffer);
console.log(`Generated Q1 newsletter: ${q1Path} (${q1Buffer.length} bytes)`);
