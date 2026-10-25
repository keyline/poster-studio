import { styleGuide, type AdStyle } from "./craft";
import type { LogoPos } from "./types";

// The creative-director brief that becomes the final image prompt (one per ad).
// The section structure is fixed here; the creative content comes from the team.

export type BriefParts = {
  adType: string; // e.g. "Recruitment Advertisement: Telecaller for Technology Products"
  brandDescriptor: string; // e.g. "a Kolkata-based digital technology company"
  objective: string; // what this ad must achieve, 1–3 sentences from the client brief
  mustNotLookLike: string[];
  insightHeadline: string; // the "Most X… Great X…" contrast
  insightBody: string;
  insightPoints: string[]; // what the product / role / offer really is
  challenge: string;
  centralThought: string;
  territories: { name: string; description: string }[];
  selectedDirection: string; // the ONE chosen visual, described in detail
  philosophy: { name: string; principle: string; text: string }[];
  visualRequirements: string[];
  avoid: string[];
  typography: string;
  palette: string;
  composition: string;
  creativeTest: string[];
  objectiveShort: string; // "makes the right person interested in the opportunity"
};

export type LogoUsage = {
  description: string; // what the real logo looks like (from the Creative Director looking at it)
  zone: Exclude<LogoPos, "auto">;
  background: string; // what the area behind the logo must be like
  notes: string; // any further guidance for this ad
};

const ZONE_WORDS: Record<LogoUsage["zone"], string> = {
  "bottom-right": "bottom-right corner",
  "bottom-left": "bottom-left corner",
  "top-right": "top-right corner",
  "top-left": "top-left corner",
  "bottom-center": "bottom centre",
};

export type BriefCopy = {
  brandName: string;
  headlineOptions: string[];
  headline: string;
  supportingLine: string;
  keyInfo: string; // the one essential fact line, e.g. "TELECALLER — TECHNOLOGY PRODUCTS"
  cta: string;
};

const bullets = (items: string[]) => items.filter(Boolean).map((i) => `* ${i}`).join("\n");
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function listWithOr(items: string[]) {
  const xs = items.filter(Boolean);
  if (xs.length <= 2) return xs.join(" or ");
  return `${xs.slice(0, -1).join(", ")}, or ${xs[xs.length - 1]}`;
}

function listWithAnd(items: string[]) {
  const xs = items.filter(Boolean);
  if (xs.length <= 2) return xs.join(" and ");
  return `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`;
}

export function buildImageBrief(o: {
  parts: BriefParts;
  copy: BriefCopy;
  style: AdStyle;
  channel: string;
  formatLine: string; // e.g. "a 4:5 vertical format, 1080 × 1350 pixels"
  logo?: LogoUsage; // set when the brand has a logo: it is composited afterwards, never drawn by the AI
  experts?: { role: string; name: string; text: string }[]; // each team member's direction in their own field
}): string {
  const { parts: p, copy: c } = o;
  const brandUpper = c.brandName.toUpperCase();
  const adTypeShort = (p.adType.split(":")[0].trim() || "advertisement").toLowerCase();
  const territories = p.territories
    .slice(0, 4)
    .map((t, i) => `${String.fromCharCode(65 + i)}. ${t.name.toUpperCase()}\n${t.description}`)
    .join("\n");
  const philosophy = p.philosophy
    .slice(0, 6)
    .map((m) => `${m.name.toUpperCase()} — ${m.principle.toUpperCase()}\n${m.text}`)
    .join("\n");
  const combine = listWithAnd(p.philosophy.slice(0, 4).map((m) => `the ${lower(m.principle)} of ${m.name}`));

  const finalCopy = [
    `A powerful headline: “${c.headline}”`,
    c.supportingLine && `A short supporting line: “${c.supportingLine}”`,
    c.keyInfo && `The key information: “${c.keyInfo}”`,
    o.logo ? "" : `The company name: “${brandUpper}”`,
    c.cta && `A concise call to action: “${c.cta}”`,
  ].filter(Boolean) as string[];

  return `${brandUpper}
${p.adType}
THE BRIEF
Act as a world-class advertising creative director tasked with creating an unconventional ${adTypeShort} for ${c.brandName}, ${p.brandDescriptor}.
${p.objective}
The advertisement will appear on ${o.channel}.
However, it must NOT look like ${listWithOr(p.mustNotLookLike)}.
It should look and feel like an iconic print advertisement from a legendary advertising agency.
${combine ? `The creative must combine ${combine}.` : ""}
Think deeply before designing.
1. THE STRATEGIC INSIGHT
${p.insightHeadline}
${p.insightBody}
${bullets(p.insightPoints)}
${p.challenge}
2. THE CENTRAL CREATIVE IDEA
Explore the thought:
“${p.centralThought}”
Investigate unexpected visual metaphors that make this idea immediately understandable.
Possible creative territories include:
${territories}
These are exploratory directions. Choose ONE central visual idea. Do not combine several metaphors into one advertisement.
THE CHOSEN DIRECTION FOR THIS ADVERTISEMENT:
${p.selectedDirection}
3. CREATIVE PHILOSOPHY
Apply these principles:
${philosophy}
4. ART DIRECTION
Create a sophisticated, editorial-style ${adTypeShort} inspired by classic print advertising.
${styleGuide(o.style)}
Visual requirements:
${bullets(p.visualRequirements)}
Avoid:
${bullets(p.avoid)}
Typography: ${p.typography}
Colour palette: ${p.palette}
Composition: ${p.composition}
The advertisement should feel intelligent, confident and memorable.
${
    o.experts?.some((e) => e.text)
      ? `4B. EXPERT DIRECTION
Each specialist's direction for this advertisement, in their own field:
${o.experts
          .filter((e) => e.text)
          .map((e) => `${e.role.toUpperCase()} — ${e.name}\n${e.text}`)
          .join("\n")}
`
      : ""
  }5. COPYWRITING
Headline options considered:
${c.headlineOptions.slice(0, 3).map((h, i) => `${i + 1}. “${h}”`).join("\n")}
Selected headline: “${c.headline}”
The final advertisement should contain only:
${finalCopy.map((l, i) => `${i + 1}. ${l}`).join("\n")}
Render every one of these words exactly as written, spelled correctly, and no other words, numbers or letters anywhere.
Do not invent salary, prices, qualifications, benefits, dates or claims that are not given above.
${
    o.logo
      ? `The company is identified by its real logo, which is placed on the finished image afterwards. Do not write the company name anywhere and do not draw any logo, emblem, monogram or wordmark.
5B. LOGO USAGE
The real ${c.brandName} logo: ${o.logo.description}
Sign-off position: the ${ZONE_WORDS[o.logo.zone]}, inside the margins.
Reserve a clean, empty sign-off area there about 24% of the image width and 9% of its height, with clear space around it equal to at least half its height. Nothing else may enter this area: no text, objects, people or busy texture.
Background behind the logo: ${o.logo.background}
${o.logo.notes}
Treat the logo the way a brand guideline would: it is the sign-off of the advertisement, calm and confident, never decorative, never repeated.`
      : "Leave the bottom-right corner (about 20% of the width) clear for the sign-off, and do not draw any logo or emblem."
  }
6. ${o.channel.toUpperCase()} EXECUTION
Design the main creative in ${o.formatLine}.
It must remain legible on a mobile screen.
The final result should look like a real advertising agency's considered creative execution, not a template.
7. THE CREATIVE TEST
Before finalising, ask:
${bullets(p.creativeTest)}
If the answer to any of these questions is no, simplify and rethink.
FINAL DELIVERABLE
Produce ONE finished, production-ready advertisement image that executes the chosen direction above.
Show only the advertisement itself: do not write this brief, its section titles, the headline options, lists or notes anywhere in the image.
The objective is not to make ${/^[aeiou]/i.test(adTypeShort) ? "an" : "a"} ${adTypeShort} that looks impressive.
The objective is to create an advertisement that ${p.objectiveShort}.`;
}
