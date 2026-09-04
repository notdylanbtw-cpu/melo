import type { Industry } from "./types";

export type Labels = {
  job: string;
  jobs: string;
  staff: string;
  staffPlural: string;
  book: string;
  customer: string;
  site: string;
  pipeline: string;
};

export const INDUSTRY_LABELS: Record<Industry, Labels> = {
  trades: {
    job: "Job",
    jobs: "Jobs",
    staff: "Technician",
    staffPlural: "Technicians",
    book: "Book job",
    customer: "Customer",
    site: "Site",
    pipeline: "Jobs",
  },
  hospitality: {
    job: "Reservation",
    jobs: "Reservations",
    staff: "Host",
    staffPlural: "Floor staff",
    book: "Book reservation",
    customer: "Guest",
    site: "Venue",
    pipeline: "Bookings",
  },
  clinics: {
    job: "Appointment",
    jobs: "Appointments",
    staff: "Practitioner",
    staffPlural: "Practitioners",
    book: "Book appointment",
    customer: "Patient",
    site: "Clinic",
    pipeline: "Appointments",
  },
  salons: {
    job: "Appointment",
    jobs: "Appointments",
    staff: "Stylist",
    staffPlural: "Stylists",
    book: "Book appointment",
    customer: "Client",
    site: "Salon",
    pipeline: "Bookings",
  },
  retail: {
    job: "Order",
    jobs: "Orders",
    staff: "Associate",
    staffPlural: "Team",
    book: "Place order",
    customer: "Customer",
    site: "Store",
    pipeline: "Orders",
  },
  property: {
    job: "Inspection",
    jobs: "Inspections",
    staff: "Agent",
    staffPlural: "Agents",
    book: "Book inspection",
    customer: "Client",
    site: "Property",
    pipeline: "Listings",
  },
  professional: {
    job: "Matter",
    jobs: "Matters",
    staff: "Associate",
    staffPlural: "Team",
    book: "Schedule work",
    customer: "Client",
    site: "Office",
    pipeline: "Matters",
  },
  agencies: {
    job: "Project",
    jobs: "Projects",
    staff: "Lead",
    staffPlural: "Team",
    book: "Schedule work",
    customer: "Client",
    site: "Studio",
    pipeline: "Projects",
  },
};

export const INDUSTRY_OPTIONS: { id: Industry; label: string }[] = [
  { id: "trades", label: "Trades & field services" },
  { id: "hospitality", label: "Hospitality" },
  { id: "clinics", label: "Clinics & allied health" },
  { id: "salons", label: "Salons & beauty" },
  { id: "retail", label: "Retail & ecommerce" },
  { id: "property", label: "Property & real estate" },
  { id: "professional", label: "Professional services" },
  { id: "agencies", label: "Agencies & consultants" },
];
