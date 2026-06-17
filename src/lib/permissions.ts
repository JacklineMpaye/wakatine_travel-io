export const ADMIN_MODULES = [
  { key: "dashboard",     label: "Dashboard",       description: "View overview statistics and summary cards" },
  { key: "applicants",    label: "Applicants",       description: "View and manage applicant profiles" },
  { key: "applications",  label: "Applications",     description: "Review and update application statuses" },
  { key: "payments",      label: "Payments",         description: "Track and verify payment records" },
  { key: "receipts",      label: "Receipts",         description: "View and manage payment receipts" },
  { key: "invoices",      label: "Invoices",         description: "Create and manage invoices" },
  { key: "forms",         label: "Form Templates",   description: "Upload and manage downloadable form templates" },
  { key: "jobs",          label: "Jobs",             description: "Post and manage job listings" },
  { key: "reports",       label: "Reports",          description: "View analytics and generate reports" },
  { key: "notifications", label: "Notifications",    description: "Send notifications to applicants" },
  { key: "settings",      label: "Settings",         description: "Configure system-wide settings" },
] as const;

export type AdminModuleKey = (typeof ADMIN_MODULES)[number]["key"];

// Maps URL path prefixes → permission key.
// The admin dashboard root (/admin) has no restriction — all admins land there.
const PATH_MODULE_MAP: Record<string, string> = {
  "/admin/applicants":    "applicants",
  "/admin/applications":  "applications",
  "/admin/payments":      "payments",
  "/admin/receipts":      "receipts",
  "/admin/invoices":      "invoices",
  "/admin/forms":         "forms",
  "/admin/jobs":          "jobs",
  "/admin/reports":       "reports",
  "/admin/notifications": "notifications",
  "/admin/settings":      "settings",
  "/admin/roles":         "user_management", // super-admin only
};

export function getModuleForPath(path: string): string | null {
  for (const [prefix, module] of Object.entries(PATH_MODULE_MAP)) {
    if (path === prefix || path.startsWith(prefix + "/")) return module;
  }
  return null;
}
