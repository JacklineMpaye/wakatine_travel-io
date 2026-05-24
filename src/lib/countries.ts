export interface Country {
  code: string;
  name: string;
  flag: string;
  blurb: string;
  averageSalary: string;
  topJobs: string[];
}

export const COUNTRIES: Country[] = [
  {
    code: "AE", name: "United Arab Emirates", flag: "🇦🇪",
    blurb: "Tax-free salaries, vibrant cities, year-round opportunities in Dubai & Abu Dhabi.",
    averageSalary: "AED 3,000 - 12,000",
    topJobs: ["Hospitality", "Security", "Construction", "Domestic Work", "Drivers"],
  },
  {
    code: "QA", name: "Qatar", flag: "🇶🇦",
    blurb: "Strong demand for skilled and semi-skilled workers across hospitality and infrastructure.",
    averageSalary: "QAR 2,500 - 10,000",
    topJobs: ["Hospitality", "Construction", "Cleaning", "Security"],
  },
  {
    code: "SA", name: "Saudi Arabia", flag: "🇸🇦",
    blurb: "Vision 2030 projects mean massive demand for foreign labor.",
    averageSalary: "SAR 2,000 - 9,000",
    topJobs: ["Construction", "Domestic", "Hospitality", "Healthcare"],
  },
  {
    code: "GB", name: "United Kingdom", flag: "🇬🇧",
    blurb: "Care, hospitality and skilled worker visas for qualified Ugandans.",
    averageSalary: "£1,800 - £3,500/mo",
    topJobs: ["Care Worker", "Nurse", "Hospitality", "Truck Driver"],
  },
  {
    code: "CA", name: "Canada", flag: "🇨🇦",
    blurb: "Permanent residency pathways for skilled workers and caregivers.",
    averageSalary: "CAD 2,800 - 6,000",
    topJobs: ["Caregiver", "Truck Driver", "Farm Worker", "Hospitality"],
  },
  {
    code: "US", name: "United States", flag: "🇺🇸",
    blurb: "Seasonal and skilled visa programs for nurses, IT, and agriculture.",
    averageSalary: "USD 2,500 - 7,000",
    topJobs: ["Nurse", "IT", "Farm Worker", "Hospitality"],
  },
];