export type Role = "copywriter" | "artDirector" | "visualizer" | "photographer";

export type Expert = {
  id: string;
  role: Role;
  name: string;
  title: string;
  brief: string; // two-line intro shown on the profile card
  style: string; // how this person works — fed to the AI
  avatarBg: string;
};

export const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: "copywriter", label: "Copywriter", hint: "Writes the idea, headline and copy" },
  { id: "artDirector", label: "Creative / Art Director", hint: "Owns the look, layout and typography" },
  { id: "visualizer", label: "Visualizer", hint: "Turns the idea into a visual concept" },
  { id: "photographer", label: "Photographer", hint: "Decides how the image is shot" },
];

// Fictional profiles. Edit, add or remove freely — the UI picks them up automatically.
export const EXPERTS: Expert[] = [
  // Copywriters
  {
    id: "cw-rhea",
    role: "copywriter",
    name: "Rhea Kapoor",
    title: "Headline Specialist",
    brief: "Ten years writing award-winning press ads. Believes the headline must do 80% of the work in under eight words.",
    style:
      "Sharp, witty, economical. Writes short, twisty headlines with a double meaning or unexpected turn. Cuts every unnecessary word. Body copy is 1–2 crisp lines.",
    avatarBg: "ffd5c2",
  },
  {
    id: "cw-vikram",
    role: "copywriter",
    name: "Vikram Sen",
    title: "Emotional Storyteller",
    brief: "Kolkata-born long-copy writer known for tear-jerker festive campaigns. Finds the human truth behind every product.",
    style:
      "Warm, emotional, insight-led. Starts from a real human truth, uses vivid everyday details and local cultural nuance. Headlines feel like a line from a story.",
    avatarBg: "c9e4de",
  },
  {
    id: "cw-maya",
    role: "copywriter",
    name: "Maya Fernandes",
    title: "Challenger Voice",
    brief: "Built voices for disruptor brands. Provocative, irreverent and never boring — she makes the category leader nervous.",
    style:
      "Bold, provocative, a little cheeky. Challenges category conventions and competitors (without naming them). Confident, punchy, conversational.",
    avatarBg: "f6d6ff",
  },
  {
    id: "cw-daniel",
    role: "copywriter",
    name: "Daniel Brooks",
    title: "Direct-Response Pro",
    brief: "Old-school direct-response writer in the Ogilvy tradition. Every word is there to sell, and he can prove it.",
    style:
      "Benefit-first, specific, credible. Uses numbers, proof points and a clear offer. Strong, explicit call to action. Clarity over cleverness.",
    avatarBg: "d6e4ff",
  },
  {
    id: "cw-ananya",
    role: "copywriter",
    name: "Ananya Iyer",
    title: "Everyday Insight Writer",
    brief: "Writes the lines people quote to each other. Simple words, honest observations, gentle humour.",
    style:
      "Simple, honest and observational. Spots small everyday moments the audience recognizes instantly. Gentle humour, no jargon, sounds like a real person talking.",
    avatarBg: "fff1b8",
  },

  // Creative / Art Directors
  {
    id: "ad-kabir",
    role: "artDirector",
    name: "Kabir Malhotra",
    title: "Minimal Typographer",
    brief: "Swiss-trained art director. Strict grids, generous white space and type that does the talking.",
    style:
      "Minimal, grid-based, typography-led. One strong image, lots of negative space, restrained palette, clean modern sans-serif type, precise alignment.",
    avatarBg: "e2e2e2",
  },
  {
    id: "ad-sofia",
    role: "artDirector",
    name: "Sofia Marín",
    title: "Bold Colour & Contrast",
    brief: "Known for posters you can spot from across the street. Bold colour blocking and big confident layouts.",
    style:
      "High-contrast, bold color fields drawn from the brand palette, graphic composition, oversized headline, strong focal point, energetic but controlled.",
    avatarBg: "ffcfcf",
  },
  {
    id: "ad-ishaan",
    role: "artDirector",
    name: "Ishaan Roy",
    title: "Cinematic Premium",
    brief: "Ex-film art director who brings movie-poster mood to brands. Dark, rich and luxurious.",
    style:
      "Cinematic, moody, premium. Low-key lighting, rich shadows, deep color grading, elegant serif typography, a sense of story and atmosphere.",
    avatarBg: "cfd8e6",
  },
  {
    id: "ad-leela",
    role: "artDirector",
    name: "Leela Nair",
    title: "Heritage & Craft",
    brief: "Celebrates local craft, textures and colour. Makes brands feel rooted, warm and authentic.",
    style:
      "Warm, tactile, rooted in local culture. Natural textures (paper, fabric, wood, clay), earthy warm palettes, handmade feel, editorial serif type.",
    avatarBg: "f4dcc0",
  },
  {
    id: "ad-tom",
    role: "artDirector",
    name: "Tom Hayes",
    title: "Editorial Print Classic",
    brief: "Grew up on classic 60s print ads. Big photo, sharp headline, short copy, logo bottom right — and it still works.",
    style:
      "Classic editorial print-ad layout: dominant photograph, headline beneath or above, short body copy, logo bottom corner. Honest, timeless, magazine quality.",
    avatarBg: "dfe7cf",
  },

  // Visualizers
  {
    id: "vz-neel",
    role: "visualizer",
    name: "Neel Banerjee",
    title: "Visual Metaphor Thinker",
    brief: "Turns abstract benefits into one unforgettable image. Surprising but always believable.",
    style:
      "Finds a single strong visual metaphor or juxtaposition that expresses the idea without words — surprising, but physically real and photographable.",
    avatarBg: "d9f2d0",
  },
  {
    id: "vz-priya",
    role: "visualizer",
    name: "Priya Desai",
    title: "Product Hero Stylist",
    brief: "Makes the product the undisputed star. Thoughtful props, staging and composition.",
    style:
      "Product-hero thinking: the product is the focal point, staged with meaningful props and setting that tell the benefit. Clean, considered still-life compositions.",
    avatarBg: "ffe0ec",
  },
  {
    id: "vz-omar",
    role: "visualizer",
    name: "Omar Khalid",
    title: "Human Moments",
    brief: "Looks for the real moment between people. Candid, relatable scenes your audience has lived.",
    style:
      "Slice-of-life scenes with real people in authentic local settings, candid expressions and genuine interactions that show the emotional payoff.",
    avatarBg: "e0e7ff",
  },
  {
    id: "vz-zara",
    role: "visualizer",
    name: "Zara Thomas",
    title: "Graphic Mixed-Media",
    brief: "Blends photography with paper cut-outs, print textures and collage for a crafted, human feel.",
    style:
      "Mixed-media and collage: real photography combined with physical paper cut-outs, print textures, halftone and hand-made graphic elements.",
    avatarBg: "fff0d6",
  },

  // Photographers
  {
    id: "ph-raghav",
    role: "photographer",
    name: "Raghav Bose",
    title: "Documentary Realist",
    brief: "Photojournalist turned ad photographer. Natural light, real places, real people — nothing staged-looking.",
    style:
      "Documentary photography: 35mm lens, available natural light, real locations, candid moments, slight grain, imperfect real-world details, Leica M / Fujifilm X-Pro look.",
    avatarBg: "e6dccf",
  },
  {
    id: "ph-elena",
    role: "photographer",
    name: "Elena Rossi",
    title: "Fashion & Editorial",
    brief: "Shoots for fashion magazines. Medium-format crispness, sculpted studio light, strong attitude.",
    style:
      "Editorial/fashion: medium format (Hasselblad X2D, 80mm), sculpted studio strobes with softbox and beauty dish, seamless or textured backdrop, confident posing.",
    avatarBg: "f3d1dc",
  },
  {
    id: "ph-sam",
    role: "photographer",
    name: "Sam Okafor",
    title: "Product & Still Life",
    brief: "Obsessive about light on surfaces. Makes everyday objects look tactile and irresistible.",
    style:
      "Product/still life: Phase One or Canon 100mm macro, controlled hard and soft light, real reflections, true materials and textures, precise but natural shadows.",
    avatarBg: "d4e9f7",
  },
  {
    id: "ph-meera",
    role: "photographer",
    name: "Meera Kulkarni",
    title: "Lifestyle on Film",
    brief: "Shoots lifestyle on real film. Golden hour, warm skin tones and that soft analogue feel.",
    style:
      "Lifestyle shot on film: Kodak Portra 400 / Contax 645, golden-hour or window light, warm natural skin tones, soft analogue grain, relaxed unposed moments.",
    avatarBg: "fde2c7",
  },
  {
    id: "ph-hiro",
    role: "photographer",
    name: "Hiro Tanaka",
    title: "Architectural Minimalist",
    brief: "Quiet, precise compositions with clean lines and soft daylight. Calm, considered and premium.",
    style:
      "Minimal architectural photography: tilt-shift or 24–45mm, soft overcast daylight, clean lines, generous negative space, muted natural palette.",
    avatarBg: "e4e4dc",
  },
];

export function getExpert(id: string): Expert | undefined {
  return EXPERTS.find((e) => e.id === id);
}

export function avatarUrl(e: Expert) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(e.name)}&backgroundColor=${e.avatarBg}`;
}
