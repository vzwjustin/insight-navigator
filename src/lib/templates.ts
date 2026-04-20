// Industry templates — drives intake question sets per industry.
// Designed as data so new industries can be added without UI changes.

export type IntakeQuestion = {
  key: string;
  label: string;
  hint?: string;
  type: "text" | "textarea" | "number";
  required?: boolean;
};

export type IndustryKey =
  | "retail"
  | "local_service"
  | "medical"
  | "dental_medspa"
  | "salon_barber"
  | "real_estate"
  | "home_services"
  | "other";

export type IndustryTemplate = {
  key: IndustryKey;
  label: string;
  description: string;
  questions: IntakeQuestion[];
};

const baseQuestions: IntakeQuestion[] = [
  { key: "biggest_problems", label: "What are the biggest stated problems?", type: "textarea", required: true,
    hint: "Use the owner's own words where possible." },
  { key: "time_drains", label: "Where is time being wasted today?", type: "textarea", required: true },
  { key: "money_leaks", label: "Where do you suspect money is leaking?", type: "textarea" },
  { key: "lead_handling", label: "How are leads / new customers handled today?", type: "textarea" },
  { key: "follow_up", label: "How is follow-up handled?", type: "textarea" },
  { key: "scheduling", label: "How is scheduling handled?", type: "textarea" },
  { key: "reporting", label: "How is reporting / dashboards handled?", type: "textarea" },
  { key: "billing", label: "How is payment / billing handled?", type: "textarea" },
  { key: "what_feels_broken", label: "What feels most broken right now?", type: "textarea" },
  { key: "already_tried", label: "What has already been tried that didn't work?", type: "textarea" },
];

const medicalExtras: IntakeQuestion[] = [
  { key: "patient_intake", label: "How does patient intake work?", type: "textarea" },
  { key: "no_shows", label: "What is the no-show situation?", type: "textarea" },
  { key: "front_desk", label: "How is the front desk phone load handled?", type: "textarea" },
  { key: "prior_auth", label: "How is prior authorization handled?", type: "textarea" },
  { key: "billing_friction", label: "Where is billing friction worst?", type: "textarea" },
];

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  { key: "retail", label: "Retail", description: "Storefront / e-commerce blends.",
    questions: baseQuestions },
  { key: "local_service", label: "Local Service Business", description: "Plumbers, cleaners, contractors, etc.",
    questions: baseQuestions },
  { key: "medical", label: "Medical / Doctor's Office", description: "Practice operations assessment.",
    questions: [...baseQuestions, ...medicalExtras] },
  { key: "dental_medspa", label: "Dental / Med Spa", description: "Appointment-driven practices.",
    questions: [...baseQuestions, ...medicalExtras] },
  { key: "salon_barber", label: "Salon / Barber", description: "Booking-heavy service shops.",
    questions: baseQuestions },
  { key: "real_estate", label: "Real Estate Team", description: "Agents, lead-volume teams.",
    questions: baseQuestions },
  { key: "home_services", label: "Home Services", description: "HVAC, roofing, lawn, pest, etc.",
    questions: baseQuestions },
  { key: "other", label: "Other", description: "Generic intake.",
    questions: baseQuestions },
];

export const getTemplate = (key: string): IndustryTemplate =>
  INDUSTRY_TEMPLATES.find(t => t.key === key) ?? INDUSTRY_TEMPLATES[INDUSTRY_TEMPLATES.length - 1];

export const isHealthcare = (key: string) => key === "medical" || key === "dental_medspa";
