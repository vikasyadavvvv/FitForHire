// utils/atsDetector.js
const ISSUE_POINTS = 10;              // points deducted per warning (tweak)

export function detectATSIssues(text) {
  const warnings = [];

  // 1️⃣ No contact info
  if (!/@/.test(text) || !/\d{10}/.test(text)) {
    warnings.push("Missing or invalid contact information.");
  }

  // 2️⃣ Tables & columns (box-drawing / multiple consecutive spaces or | )
  if (/[\u2500-\u257F]/.test(text) || /(\s{2,}\w+\s{2,})/.test(text)) {
    warnings.push("Tables or multi-column layout detected – ATS may mis-read.");
  }

  // 3️⃣ Uncommon symbols / emojis
  if (/[^\x00-\x7F]/.test(text.replace(/\n/g, ""))) {
    warnings.push("Non-ASCII characters (fancy fonts / emojis) detected.");
  }

  // 4️⃣ Low keyword density (fewer than 3 skills verbs like 'developed|built')
  const verbs = (text.match(/\b(developed|built|managed|created|designed)\b/gi) || []).length;
  if (verbs < 3) warnings.push("Very few action verbs – may hurt keyword ranking.");

  // 5️⃣ Images (rough heuristic: 'image' tag text artifacts or 0 text on first page)
  if (/image|graphics/i.test(text.substr(0, 500))) {
    warnings.push("Possible image-based header or profile photo detected.");
  }

  return warnings;
}

export function calcATSScore(warnings) {
  return Math.max(0, 100 - warnings.length * ISSUE_POINTS);
}

