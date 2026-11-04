export type WelcomeSlide = { slide_number: number; eyebrow: string; title: string; description: string };

export const defaultWelcomeSlides: WelcomeSlide[] = [
  { slide_number: 1, eyebrow: "WELCOME TO VITALPILOT", title: "A little more clarity.\nA little more you.", description: "Meet your health companion: a place for your readings, everyday habits, and the questions that come with them." },
  { slide_number: 2, eyebrow: "START WITH YOUR EVERYDAY", title: "Small check-ins.\nA fuller picture.", description: "Choose what matters to you—from blood pressure and glucose to sleep, water, and movement. Build a routine that fits your life." },
  { slide_number: 3, eyebrow: "MAKE SENSE OF YOUR STORY", title: "More than numbers.\nRoom to understand.", description: "VitalPilot is being built to bring your readings into trends, reports, and helpful explanations. Start with the tools available today." },
  { slide_number: 4, eyebrow: "TAKE YOUR NEXT STEP", title: "Your questions.\nYour care. Your pace.", description: "Find healthcare providers by location and specialty. Bring your questions to your next visit—searching never shares your health information." },
];

export function mergeWelcomeSlides(overrides: WelcomeSlide[]): WelcomeSlide[] {
  return defaultWelcomeSlides.map((slide) => overrides.find((item) => item.slide_number === slide.slide_number) ?? slide);
}
