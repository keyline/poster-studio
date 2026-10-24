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

export type ExpertDetails = {
  experience: string; // background and the kind of work they are known for
  approach: string; // how they work, step by step
  signature: string; // recognisable moves in their work
  influences: string; // the masters and schools they learnt from
  avoids: string; // what they never do
  sample: string; // an example of their thinking, to set the bar
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

// Detailed creative profiles: shown under "More" on each card and given to the AI in full.
export const EXPERT_DETAILS: Record<string, ExpertDetails> = {
  "cw-rhea": {
    experience: "12 years in press and outdoor; 4 Kyoorius Blue Elephants for print headlines; worked on telecom, FMCG and real-estate launches.",
    approach: "Writes 100 headlines per brief, kills 95, then cuts the survivors to the bone. Looks for the one word that can carry two meanings.",
    signature: "Headlines of 3–7 words, often a familiar phrase given a twist; one-line body copy that lands the offer; ends on a crisp sign-off.",
    influences: "David Abbott, Neil French, Piyush Pandey's early press work, the VW 'Think Small' school.",
    avoids: "Adjective piles, puns that need explaining, exclamation marks, generic 'best quality' claims.",
    sample: "For a quiet-running AC: 'Now you can hear yourself think.' Body: 'Whisper-quiet at 19 dB. Your thoughts, finally uninterrupted.'",
  },
  "cw-vikram": {
    experience: "15 years writing festive and emotional campaigns for Bengal brands, jewellery, sweets and banks; long-copy press ads and TVC scripts.",
    approach: "Starts with a real story from people in the audience, finds the small human detail, and builds the line around it. Reads copy aloud in Bengali-English rhythm.",
    signature: "Warm, specific details (grandmother's steel tiffin, the first salary, Durga Puja pandal lights); headline as a line of dialogue; body copy that reads like a short story.",
    influences: "Satyajit Ray's ad years at D.J. Keymer, Bengali literature, Ogilvy long copy, Indian festive films.",
    avoids: "Melodrama without a product truth, clichés like 'celebrate togetherness', translating English idioms literally.",
    sample: "For a bank's home loan: 'Ma has stopped asking when.' Body: 'For 30 years she kept a corner of the cupboard for a home that was ours. This Puja, she finally gets to fill it.'",
  },
  "cw-maya": {
    experience: "10 years building challenger brands in fintech, D2C and quick commerce; known for provocative outdoor and social-first ads.",
    approach: "Finds what the category leader says, then says the opposite truthfully. Tests every line against 'would a competitor be annoyed by this?'.",
    signature: "Confident, cheeky, conversational lines; calls out category nonsense; short punchy sentences; a wink in the CTA.",
    influences: "Avis 'We try harder', Oatly, Swiggy and Zomato social, Mother Dairy topicals, Amul's butter girl.",
    avoids: "Naming competitors, being mean to customers, jargon, trying too hard to be funny.",
    sample: "For an HR software: 'Your spreadsheet called. It wants a holiday.' Body: 'Payroll, leave and attendance in one place, so Excel can finally rest.'",
  },
  "cw-daniel": {
    experience: "18 years in direct response and retail; writes ads measured on calls, footfall and sales, not awards.",
    approach: "Leads with the biggest benefit to the reader, backs it with a number and proof, makes the offer impossible to miss, and gives one clear next step.",
    signature: "Benefit headline with a specific number; subhead that removes the main objection; body with 2–3 proof points; a CTA with a deadline or phone number.",
    influences: "David Ogilvy, John Caples, Claude Hopkins' 'Scientific Advertising', Eugene Schwartz.",
    avoids: "Cleverness that hides the offer, vague claims, more than one call to action.",
    sample: "For a coaching institute: 'Our students cleared JEE 3x more often than the city average.' CTA: 'Book a free counselling session — 9830 000 000.'",
  },
  "cw-ananya": {
    experience: "9 years on FMCG, food and lifestyle brands; writes the social and outdoor lines people repeat.",
    approach: "Watches how real people talk, writes down overheard lines, and turns everyday truths into gentle, smiling headlines.",
    signature: "Simple words, observational humour, relatable moments ('that one cousin who…'), friendly CTAs.",
    influences: "Amul topicals, Fevicol's Piyush Pandey era, Cadbury 'Kuch Meetha Ho Jaye', R.K. Laxman's common man.",
    avoids: "Sarcasm that alienates, slang that will date fast, forced Hinglish.",
    sample: "For a tea brand: 'Every Kolkata argument has a second round. So does every cup.'",
  },
  "ad-kabir": {
    experience: "14 years art directing for architecture, tech and premium brands; trained in Swiss typography; known for minimal press ads.",
    approach: "Builds a 12-column grid first, gives 60% of the page to one element, sets the headline in one weight, and removes everything that doesn't earn its place.",
    signature: "Generous white space, flush-left ragged-right type, one accent colour, small precise logo bottom-right, strict alignment.",
    influences: "Josef Müller-Brockmann, Massimo Vignelli, Dieter Rams, Apple print ads.",
    avoids: "Centred everything, drop shadows, more than two typefaces, decorative clutter.",
    sample: "A single cropped product on white, headline set small at top-left, one line of body, logo bottom-right — calm and confident.",
  },
  "ad-sofia": {
    experience: "11 years designing outdoor, retail and sports campaigns; her hoardings are known for stopping traffic.",
    approach: "Squints at the layout from 10 metres; if it doesn't read, it's redesigned. Uses the brand colour as a big flat field.",
    signature: "Oversized headline, colour blocking from the brand palette, high contrast, bold diagonal or cropped compositions.",
    influences: "Paula Scher, Nike outdoor, Saul Bass posters, Bollywood hand-painted hoardings.",
    avoids: "Pastel muddle, small type on outdoor, busy backgrounds behind text.",
    sample: "Half the poster in solid brand orange with a huge two-word headline, the other half a tight crop of the product.",
  },
  "ad-ishaan": {
    experience: "12 years in film art direction and luxury advertising; brings movie-poster mood to jewellery, real estate and automobiles.",
    approach: "Designs the light first, then the frame. Thinks of each ad as a still from a film with a story just before and after.",
    signature: "Low-key lighting, rich shadows, deep colour grading, elegant serif headline, lots of dark negative space.",
    influences: "Satyajit Ray's frames, Roger Deakins' cinematography, classic Rolex and Cartier press ads.",
    avoids: "Flat, evenly lit scenes, cheap gold gradients, cramped layouts.",
    sample: "A dimly lit balcony at dusk, one warm lamp, a couple seen from behind; serif headline in cream in the dark sky area.",
  },
  "ad-leela": {
    experience: "13 years on heritage, handloom, food and festive brands; collaborates with local artisans and craftspeople.",
    approach: "Researches the region's craft, textiles and colours, then builds a layout that feels hand-made but disciplined.",
    signature: "Natural textures (khadi, kantha, terracotta, newsprint), earthy warm palettes, editorial serif type, hand-drawn accents used sparingly.",
    influences: "K.G. Subramanyan, Jamini Roy, Fabindia catalogues, Kolkata's old sign painters.",
    avoids: "Ethnic clichés, stock rangoli and diya graphics, garish festive gold.",
    sample: "A kantha-stitched border framing a photograph of hands, headline in a warm serif on unbleached paper texture.",
  },
  "ad-tom": {
    experience: "20 years in classic print advertising for automotive, banking and newspapers; believes in the timeless press layout.",
    approach: "Big picture on top, headline beneath, three short columns of body copy, logo bottom-right. Lets the idea do the work, not the decoration.",
    signature: "Dominant photograph (60–70%), strong headline under it, readable body copy, clean sign-off with tagline.",
    influences: "Bill Bernbach, Helmut Krone's VW layouts, The Economist posters.",
    avoids: "Trendy effects, text over busy photos, tiny unreadable body copy.",
    sample: "A full-bleed photo of a rusty old scooter, headline below: 'It took us 40 years to make this obsolete.'",
  },
  "vz-neel": {
    experience: "10 years as a visualiser on press and outdoor; known for visual puns that win at Goafest and Cannes press.",
    approach: "Lists 20 objects connected to the benefit, then forces two of them together until one image says the whole idea.",
    signature: "Transformed everyday objects, unexpected juxtapositions, clever negative space, one image carrying the double meaning.",
    influences: "Magritte, Shigeo Fukuda, Economist and FedEx logo thinking, Indian matchbox art.",
    avoids: "Surreal for its own sake, images that need the headline to make sense at all, 3D-render look.",
    sample: "For an anti-snoring pillow: a pillow shaped like a closed zip. For a courier: a map where two cities are folded to touch.",
  },
  "vz-priya": {
    experience: "9 years staging products for food, cosmetics and consumer electronics ads.",
    approach: "Decides the hero angle of the product first, then adds 2–3 props that tell the benefit without words.",
    signature: "Product-hero still life, meaningful props, clean surfaces, considered shadows, the product always the sharpest thing.",
    influences: "Irving Penn still lifes, Apple product shots, Indian kitchen and dressing-table details.",
    avoids: "Prop clutter, floating products, product too small to see.",
    sample: "A pressure cooker on a stone counter with three whistling steam lines and a family's mismatched steel plates waiting.",
  },
  "vz-omar": {
    experience: "11 years visualising campaigns for telecom, banking and recruitment; casts real people, not models.",
    approach: "Finds the moment just before or just after the emotional peak, and frames it so the viewer fills in the rest.",
    signature: "Candid human moments, real locations, natural gestures, eye-lines that lead to the copy.",
    influences: "Raghu Rai, Henri Cartier-Bresson, Humans of Bombay, Indian bank and telecom film ads.",
    avoids: "Posed stock smiles, everyone looking at the camera, unrealistic perfect people.",
    sample: "For a recruitment ad: a new employee's first-day desk, a colleague leaning over to share half a samosa.",
  },
  "vz-zara": {
    experience: "8 years in illustration, collage and editorial design; makes ads that feel crafted by hand.",
    approach: "Builds the visual from cut paper, photographs and print textures on a table, then photographs it flat.",
    signature: "Collage, cut-outs, halftone, riso textures, limited palettes, playful but tidy composition.",
    influences: "Hannah Höch, Saul Bass, The New Yorker covers, Indian political posters of the 70s.",
    avoids: "Digital gradients, vector clip-art, too many colours.",
    sample: "A cut-paper skyline of Kolkata where one window is a real photograph of a family at dinner.",
  },
  "ph-raghav": {
    experience: "15 years as a photojournalist, then ad photographer for banks, NGOs and recruitment campaigns.",
    approach: "Shoots in real places with available light, waits for the unguarded moment, keeps the camera at eye level.",
    signature: "35mm Leica/Fuji look, natural window light, slight grain, honest colours, real clutter in the frame.",
    influences: "Raghu Rai, Raghubir Singh, Steve McCurry's early work, Magnum documentary style.",
    avoids: "Studio lights on location, heavy retouching, perfect symmetry, fake smiles.",
    sample: "Two telecallers laughing between calls by a window, chai glasses on the desk, afternoon light, 35mm f/2.",
  },
  "ph-elena": {
    experience: "12 years shooting fashion, beauty and lifestyle campaigns for magazines and luxury brands.",
    approach: "Builds the light like a sculpture, directs attitude and posture, shoots on medium format for crisp detail.",
    signature: "Hasselblad crispness, sculpted strobe light, confident poses, textured backdrops, editorial colour.",
    influences: "Richard Avedon, Peter Lindbergh, Prabuddha Dasgupta, Vogue India covers.",
    avoids: "Flat lighting, over-smoothed skin, cluttered sets.",
    sample: "A confident woman in a cotton saree against a textured terracotta wall, beauty-dish light, 80mm lens.",
  },
  "ph-sam": {
    experience: "14 years in product and still-life photography for food, electronics and cosmetics brands.",
    approach: "Lights each material separately (glass, metal, fabric), uses real reflections, focus-stacks for detail.",
    signature: "Precise hard and soft light, tactile textures, macro detail, clean but natural shadows.",
    influences: "Irving Penn, Edward Weston's peppers, modern Apple and Dyson product photography.",
    avoids: "CGI-looking perfection, floating products, fake lens flares.",
    sample: "A dew-covered steel tiffin on dark slate, one hard side light, macro 100mm, every scratch visible.",
  },
  "ph-meera": {
    experience: "10 years shooting lifestyle and family campaigns on film for real estate, food and travel brands.",
    approach: "Shoots golden hour or window light, lets families be themselves, uses medium-format film for warmth.",
    signature: "Kodak Portra 400 tones, soft grain, warm skin, relaxed unposed moments, gentle backlight.",
    influences: "Annie Leibovitz family portraits, Dayanita Singh, Kinfolk magazine, Indian wedding photojournalism.",
    avoids: "Harsh flash, over-saturated colours, stiff family poses.",
    sample: "A family on a new balcony at golden hour, the child pointing at the city, mother laughing, shot on Portra 400.",
  },
  "ph-hiro": {
    experience: "13 years in architectural and interior photography for developers, hotels and furniture brands.",
    approach: "Waits for soft overcast or blue-hour light, keeps verticals straight with tilt-shift, composes with lots of air.",
    signature: "Clean lines, generous negative space, muted natural palette, calm premium mood.",
    influences: "Julius Shulman, Hiroshi Sugimoto, Iwan Baan, Tadao Ando's spaces.",
    avoids: "Fisheye distortion, HDR halos, cluttered interiors, converging verticals.",
    sample: "A minimalist living room at blue hour, city lights through floor-to-ceiling glass, one lamp on, tilt-shift 24mm.",
  },
};

// Everything the AI should know about a team member.
export function expertProfile(e: Expert): string {
  const d = EXPERT_DETAILS[e.id];
  const lines = [`${e.name}, ${e.title}. ${e.style}`];
  if (d) {
    lines.push(
      `  Experience: ${d.experience}`,
      `  Approach: ${d.approach}`,
      `  Signature: ${d.signature}`,
      `  Influences: ${d.influences}`,
      `  Never: ${d.avoids}`,
      `  Example of their work: ${d.sample}`,
    );
  }
  return lines.join("\n");
}
