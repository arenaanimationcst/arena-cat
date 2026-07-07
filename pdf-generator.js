/* ==========================================================================
   CAT CLIENT-SIDE PDF GENERATOR
   --------------------------------------------------------------------------
   Runs entirely in the browser via jsPDF — no Cloud Function, no Storage,
   no Blaze plan required. Loaded as a plain <script src="pdf-generator.js">
   (not a module) so it works over file:// exactly like the rest of the app.

   Load order required in the HTML:
     <script src="https://cdnjs.cloudflare.com/.../jspdf.umd.min.js"></script>
     <script src="pdf-generator.js"></script>

   This mirrors functions/main.py's design (colors, row cards, quote box,
   CTA block) as closely as jsPDF's drawing primitives allow. Keep both
   files in sync if you edit wording or layout.
   ========================================================================== */

/* ---------------- TEXT BLOCK CONTENT BANK (mirrors content-blocks.js) ---------------- */
const CAT_BLOCKS = {
  "INTEREST:ANIMATION": "Your instincts keep pulling you toward character and story — the way something moves, feels alive, or carries emotion is what catches your eye before anything else. That's a classic Animation mindset.",
  "INTEREST:VFX": "You're drawn to the moments where the impossible looks completely real — explosions, creatures, worlds that shouldn't exist but do on screen. That instinct is the foundation of a strong VFX artist.",
  "INTEREST:GAMING": "You don't just play games, you notice how they're built — the pacing, the world, the mechanics behind the fun. That's the mindset of someone who belongs on the design side of Game Development, not just the player side.",
  "INTEREST:ILLUSTRATION": "You gravitate toward the visual — style, composition, character design, the art itself. That eye for aesthetics is exactly what Illustration and Design careers are built on.",
  "INTEREST:CONTENT": "You think in videos, reels, and narratives that could hook an audience. That instinct for what people will actually watch is the core skill behind a Digital Content Creation career.",
  "INTEREST:AUTOMATION": "You're pulled toward the systems and tools behind the scenes — the things that make everything else run smoother. That's a builder's mindset, and it points toward Tech, Automation, or Production-Pipeline roles.",

  "NEEDS:CERTAINTY": "A strong need for Certainty shows up in how you're evaluating this decision — you want to know the path is stable, structured, and predictable before you commit to it.",
  "NEEDS:VARIETY": "A strong need for Variety is driving you — routine wears you down fast, and you'll thrive in a field that keeps throwing new problems and new creative challenges at you.",
  "NEEDS:SIGNIFICANCE": "A strong need for Significance is at play — you want your work to be seen, respected, and recognised, not just completed.",
  "NEEDS:CONNECTION": "A strong need for Connection is shaping your choices — you do your best work around people who believe in you, mentor you, or work alongside you.",
  "NEEDS:GROWTH": "A strong need for Growth is showing up here — you're motivated by visibly becoming better, not by staying comfortable.",
  "NEEDS:CONTRIBUTION": "A strong need for Contribution is present — knowing your work or skill genuinely helps someone else matters more to you than most people realise.",

  "DECISION:TOWARD": "you move fastest when you're chasing something exciting, not escaping something painful",
  "DECISION:AWAY": "you move fastest when there's a clear cost to not acting — pressure motivates you more than pure excitement",
  "DECISION:INTERNAL": "you trust your own read on a situation more than outside opinions, even well-meaning ones",
  "DECISION:EXTERNAL": "you make your best decisions when you can validate them against outside proof, mentors, or results",
  "DECISION:VISUAL": "you get convinced once you can actually see yourself doing the work",
  "DECISION:AUDITORY": "you get convinced when someone you trust tells you, in their own words, that it's the right move",
  "DECISION:READ": "you get convinced after you've read up on it and studied the details yourself",
  "DECISION:DO": "you get convinced once you've actually tried it hands-on",

  "COMMIT:LOW": "Your commitment pattern shows a history of starting strong and losing steam. This isn't a character flaw — it usually means past attempts lacked structure, accountability, or a clear enough reason to push through. With the right support system around you, this pattern can change.",
  "COMMIT:MEDIUM": "Your commitment pattern shows you can push through difficulty when there's a reason to, but you're not fully bulletproof against distraction or discouragement yet. A structured environment with regular check-ins will make the difference between finishing and drifting.",
  "COMMIT:HIGH": "Your commitment pattern is strong — you follow through even when things get hard or unpopular with people around you. This is one of your biggest assets, and the right program will be the one that matches your intensity rather than holding you back.",

  "READY:LOW": "Right now you're in the early exploration phase — no fixed timeline, no confirmed budget, decision not yet discussed at home. That's completely fine at this stage; this assessment is meant to help you get clarity before you commit to anything.",
  "READY:MEDIUM": "You're fairly close to being decision-ready — some pieces (timeline, budget, or family conversation) are still loosely defined, but you're not starting from zero. A short counselling conversation would likely close the remaining gaps quickly.",
  "READY:HIGH": "You're highly decision-ready — clear timeline, clear budget awareness, and the people around you are in the loop. At this stage, the main blocker to starting is simply choosing the right program.",
};

// *** PLACEHOLDER — replace with Faiz's real Arena course list ***
const CAT_COURSE_MAP = {
  ANIMATION:    { course: "Animation (2D/3D Character Animation)", reasoningKey: "COURSE:ANIMATION" },
  VFX:          { course: "VFX & Compositing", reasoningKey: "COURSE:VFX" },
  GAMING:       { course: "Game Art & Design", reasoningKey: "COURSE:GAMING" },
  ILLUSTRATION: { course: "Illustration & Comic Art / Graphic Design", reasoningKey: "COURSE:ILLUSTRATION" },
  CONTENT:      { course: "Digital Content Creation & Video Editing", reasoningKey: "COURSE:CONTENT" },
  AUTOMATION:   { course: "Digital Production Tools & AI-Assisted Workflows", reasoningKey: "COURSE:AUTOMATION" },
};

const CAT_COURSE_REASONING = {
  "COURSE:ANIMATION": "This course builds the exact character-and-motion instincts you already lean toward, taking them from raw instinct to an industry-ready skill.",
  "COURSE:VFX": "This course channels your eye for the impossible-made-real into the technical compositing and simulation skills studios actually hire for.",
  "COURSE:GAMING": "This course turns your instinct for how games are built into a structured design and production skillset.",
  "COURSE:ILLUSTRATION": "This course sharpens your natural eye for visual style into a portfolio-ready design skillset.",
  "COURSE:CONTENT": "This course takes your instinct for what people will actually watch and turns it into a monetisable content and editing skillset.",
  "COURSE:AUTOMATION": "This course builds on your builder's mindset, giving you the production-pipeline and tool skills that keep studios running efficiently.",
};

/* ---------------- COUNSELOR TALKING POINTS (mirrors main.py) ---------------- */
function catCounselorTalkingPoints(profile) {
  const points = [];
  const interestLabel = (CAT_COURSE_MAP[profile.interest] || {}).course || "their recommended course";
  points.push(`Confirm their interest in ${interestLabel} feels right to them before anything else — don't let the report replace their own answer.`);

  if (profile.commitment.bucket === "LOW") {
    points.push("Their commitment history is patchy — ask what's been different about times they DID finish something, and build the enrolment plan around that, not around willpower alone.");
  } else if (profile.commitment.bucket === "HIGH") {
    points.push("They follow through reliably — this is a genuine strength, worth naming out loud so they know it's part of why this could work.");
  }

  if (profile.readiness.bucket === "LOW") {
    points.push("They're still early on timeline/budget/family buy-in — don't push for enrolment today; focus this conversation on closing one of those gaps.");
  } else if (profile.readiness.bucket === "HIGH") {
    points.push("They're practically ready — the only real blocker left is picking the program, so keep the conversation focused on specifics (batch, fees, start date).");
  }

  if (profile.decisionStyle.internalExternal === "EXTERNAL") {
    points.push("They lean on outside proof to decide — bring portfolios, placement stories, or a call with a current student rather than just your own assurance.");
  } else {
    points.push("They trust their own read on things — give them space to reach the conclusion rather than pushing; over-selling will likely backfire with this profile.");
  }

  return points.slice(0, 4);
}

function catBuildReportTexts(profile) {
  const needsText = profile.needsTop2.map(n => CAT_BLOCKS[`NEEDS:${n}`]).join(" ");
  const ds = profile.decisionStyle;
  const decisionText = `On decisions, ${CAT_BLOCKS["DECISION:" + ds.towardAway]}, ${CAT_BLOCKS["DECISION:" + ds.internalExternal]}, and ${CAT_BLOCKS["DECISION:" + ds.convincer]}.`;
  const courseInfo = CAT_COURSE_MAP[profile.interest] || CAT_COURSE_MAP.ANIMATION;

  return {
    interestBlock: CAT_BLOCKS[`INTEREST:${profile.interest}`],
    needsBlock: needsText,
    decisionBlock: decisionText,
    commitBlock: CAT_BLOCKS[`COMMIT:${profile.commitment.bucket}`],
    readyBlock: CAT_BLOCKS[`READY:${profile.readiness.bucket}`],
    courseName: courseInfo.course,
    courseReasoning: CAT_COURSE_REASONING[courseInfo.reasoningKey] || "",
    counselorPoints: catCounselorTalkingPoints(profile),
  };
}

/* ---------------- PDF DESIGN (warm cream/yellow/orange, mirrors main.py) ---------------- */
const CAT_PDF_COLORS = {
  charcoal:  [51, 46, 42],
  orange:    [225, 84, 27],
  orangeDk:  [184, 66, 15],
  yellow:    [255, 201, 60],
  yellowDk:  [224, 168, 0],
  warmGray:  [74, 69, 64],
  bodyGray:  [90, 84, 80],
  muted:     [154, 144, 136],
  pageBg:    [246, 242, 234],
  paleCard:  [255, 243, 214],
  numBg:     [255, 243, 214],
  white:     [255, 255, 255],
  ctaBg:     [255, 239, 224],
};

// *** PLACEHOLDER — set your exact center name ***
const CAT_CENTER_BRANDING = "ARENA ANIMATION — CST";

function catFillPageBg(doc, pageW, pageH) {
  const c = CAT_PDF_COLORS;
  doc.setFillColor(...c.pageBg);
  doc.rect(0, 0, pageW, pageH, "F");
}

function catDrawHeaderFooter(doc, pageW, pageH, studentName, pageNum, totalPages) {
  const c = CAT_PDF_COLORS;
  const HEADER_H = 26, FOOTER_H = 14;

  doc.setFillColor(...c.orange);
  doc.rect(0, 0, pageW, HEADER_H, "F");
  doc.setFillColor(...c.yellow);
  doc.rect(0, HEADER_H, pageW, 1.2, "F");

  const badgeW = 34, badgeH = 15, badgeX = 22 - 2, badgeY = HEADER_H / 2 - badgeH / 2;
  doc.setFillColor(...c.white);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");
  const logoB64 = window.ARENA_LOGO_BASE64 || null;
  if (logoB64) {
    try { doc.addImage(logoB64, "PNG", badgeX + 2, badgeY + 2, badgeW - 4, badgeH - 4, undefined, "FAST"); } catch (e) {}
  }

  doc.setTextColor(...c.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(CAT_CENTER_BRANDING, badgeX + badgeW + 5, HEADER_H / 2 - 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 227, 204);
  doc.text("CAREER ASSESSMENT TEST", badgeX + badgeW + 5, HEADER_H / 2 + 4.5);

  doc.setTextColor(...c.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("REPORT FOR", pageW - 22, HEADER_H / 2 - 1, { align: "right" });
  doc.setFontSize(9.5);
  doc.text(studentName.toUpperCase(), pageW - 22, HEADER_H / 2 + 5, { align: "right" });

  doc.setFillColor(...c.warmGray);
  doc.rect(0, pageH - FOOTER_H, pageW, FOOTER_H, "F");
  doc.setFillColor(...c.orange);
  doc.rect(0, pageH - FOOTER_H - 0.8, pageW, 0.8, "F");

  doc.setFillColor(...c.yellow);
  doc.rect(0, HEADER_H, 4, pageH - HEADER_H - FOOTER_H, "F");

  doc.setTextColor(...c.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Arena Animation | Career Assessment Test", 22, pageH - 5.5);
  doc.setTextColor(...c.yellow);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(`0${pageNum}  /  0${totalPages}`, pageW - 22, pageH - 5.5, { align: "right" });
}

function catDrawSectionBar(doc, x, y, w, label) {
  const c = CAT_PDF_COLORS;
  const h = 8.5;
  doc.setFillColor(...c.warmGray);
  doc.rect(x, y, w, h, "F");
  doc.setFillColor(...c.orange);
  doc.rect(x, y, 3, h, "F");
  doc.setTextColor(...c.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(label, x + 5.5, y + h / 2 + 1);
  return y + h;
}

function catDrawRowCard(doc, x, y, w, numText, title, body) {
  const c = CAT_PDF_COLORS;
  const numColW = 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const bodyLines = doc.splitTextToSize(body, w - numColW - 12);
  const titleH = 6;
  const contentH = titleH + 2 + bodyLines.length * 4.6 + 8; // padding
  const cardH = Math.max(contentH, 20);

  doc.setFillColor(...c.numBg);
  doc.rect(x, y, numColW, cardH, "F");
  doc.setFillColor(...c.white);
  doc.rect(x + numColW, y, w - numColW, cardH, "F");
  doc.setDrawColor(...c.yellow);
  doc.setLineWidth(0.4);
  doc.rect(x, y, w, cardH, "S");
  doc.setFillColor(...c.orange);
  doc.rect(x + numColW - 0.8, y, 0.8, cardH, "F");

  doc.setTextColor(...c.yellowDk);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(numText, x + numColW / 2, y + cardH / 2 + 2, { align: "center" });

  let ty = y + 8;
  doc.setTextColor(...c.charcoal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, x + numColW + 6, ty);
  ty += 6;
  doc.setTextColor(...c.bodyGray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  bodyLines.forEach(line => { doc.text(line, x + numColW + 6, ty); ty += 4.6; });

  return y + cardH;
}

function catDrawQuoteBox(doc, x, y, w, text) {
  const c = CAT_PDF_COLORS;
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(11.5);
  const lines = doc.splitTextToSize(`\u201c${text}\u201d`, w - 30);
  const boxH = lines.length * 5.5 + 16;

  doc.setFillColor(...c.paleCard);
  doc.rect(x, y, w, boxH, "F");
  doc.setDrawColor(...c.orange);
  doc.setLineWidth(0.6);
  doc.rect(x, y, w, boxH, "S");

  doc.setTextColor(...c.charcoal);
  let ty = y + 10;
  lines.forEach(line => { doc.text(line, x + w / 2, ty, { align: "center" }); ty += 5.5; });
  return y + boxH;
}

function catDrawCtaBlock(doc, x, y, w, centerName) {
  const c = CAT_PDF_COLORS;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const text = `Bring this report to a free 15-minute session at ${centerName} — we'll map it to the exact course and batch for you.`;
  const lines = doc.splitTextToSize(text, w - 22 - 12);
  const boxH = Math.max(lines.length * 5 + 18, 26);

  doc.setFillColor(...c.ctaBg);
  doc.rect(x, y, w, boxH, "F");
  doc.setDrawColor(...c.orange);
  doc.setLineWidth(0.5);
  doc.rect(x, y, w, boxH, "S");
  doc.setDrawColor(...c.yellow);
  doc.line(x + w - 22, y, x + w - 22, y + boxH);

  doc.setTextColor(...c.orangeDk);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("YOUR NEXT STEP", x + 8, y + 8);

  doc.setTextColor(...c.charcoal);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  let ty = y + 14;
  lines.forEach(line => { doc.text(line, x + 8, ty); ty += 5; });

  doc.setTextColor(...c.orange);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("\u2192", x + w - 11, y + boxH / 2 + 3, { align: "center" });

  return y + boxH;
}

/**
 * Builds and returns a jsPDF document for the given student + profile.
 * Call .save(filename) or .output('blob') on the result.
 */
function generateCatReportPdf(studentName, profile) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const MARGIN = 22, CONTENT_TOP = 32, CONTENT_BOTTOM = pageH - 18;
  const CW = pageW - MARGIN * 2;

  const texts = catBuildReportTexts(profile);
  const c = CAT_PDF_COLORS;
  let y = CONTENT_TOP;

  catFillPageBg(doc, pageW, pageH); // page 1 background

  function ensureSpace(neededH) {
    if (y + neededH > CONTENT_BOTTOM) {
      doc.addPage();
      catFillPageBg(doc, pageW, pageH); // fill background on every new page too
      y = CONTENT_TOP;
    }
  }

  // Title block
  doc.setTextColor(...c.orange);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("CAREER ASSESSMENT REPORT", MARGIN, y);
  y += 8;
  doc.setTextColor(...c.charcoal);
  doc.setFontSize(22);
  doc.text(`${studentName}'s Personalised Career Profile`, MARGIN, y);
  y += 4;
  doc.setFillColor(...c.orange);
  doc.rect(MARGIN, y, CW, 1.2, "F");
  y += 8;

  const rows = [
    ["01", "Interest Direction", texts.interestBlock],
    ["02", "What Drives You (Six Human Needs)", texts.needsBlock],
    ["03", "How You Decide", texts.decisionBlock],
    ["04", "Commitment Pattern", texts.commitBlock],
    ["05", "Practical Readiness", texts.readyBlock],
  ];
  rows.forEach(([num, title, body]) => {
    ensureSpace(24);
    y = catDrawRowCard(doc, MARGIN, y, CW, num, title, body) + 3;
  });

  ensureSpace(20);
  y = catDrawSectionBar(doc, MARGIN, y, CW, "RECOMMENDED PROGRAM") + 5;
  doc.setTextColor(...c.charcoal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(texts.courseName, MARGIN, y);
  y += 6;
  doc.setTextColor(...c.bodyGray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const courseLines = doc.splitTextToSize(texts.courseReasoning, CW);
  courseLines.forEach(line => { doc.text(line, MARGIN, y); y += 4.6; });
  y += 4;

  ensureSpace(20);
  y = catDrawSectionBar(doc, MARGIN, y, CW, "FOR YOUR COUNSELLOR — TALKING POINTS") + 5;
  doc.setTextColor(...c.bodyGray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  texts.counselorPoints.forEach(point => {
    const lines = doc.splitTextToSize(`\u2022  ${point}`, CW);
    ensureSpace(lines.length * 4.6 + 2);
    lines.forEach(line => { doc.text(line, MARGIN, y); y += 4.6; });
    y += 1.5;
  });
  y += 4;

  ensureSpace(30);
  y = catDrawQuoteBox(doc, MARGIN, y,
    CW, "The right career isn't the one that sounds impressive — it's the one that matches how you already think.") + 6;

  ensureSpace(30);
  y = catDrawCtaBlock(doc, MARGIN, y, CW, CAT_CENTER_BRANDING) + 4;

  // Second pass: draw header/footer chrome on every page (reserved zones only)
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    catDrawHeaderFooter(doc, pageW, pageH, studentName, p, totalPages);
  }

  return doc;
}

/** Convenience: generate + trigger browser download in one call. */
function downloadCatReportPdf(studentName, profile) {
  const doc = generateCatReportPdf(studentName, profile);
  const safeName = studentName.replace(/[^a-zA-Z0-9 _-]/g, "").trim().replace(/\s+/g, "_");
  doc.save(`${safeName}_CAT_Report.pdf`);
}
