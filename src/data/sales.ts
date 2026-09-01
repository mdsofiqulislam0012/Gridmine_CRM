import { Invoice, Estimate, Proposal, Payment, Item } from "@/types";

const invStatuses: Invoice["status"][] = ["Draft", "Not Sent", "Unpaid", "Partially Paid", "Overdue", "Paid"];
export const invoices: Invoice[] = Array.from({ length: 14 }).map((_, i) => ({
  id: `INV-${1000 + i}`,
  customer: ["elvan_tw", "tawhid_wp", "figma_flows", "arif_pro"][i % 4],
  amount: `$${(200 + i * 37).toFixed(2)}`,
  tax: `$${(i * 2).toFixed(2)}`,
  date: `2026-0${(i % 8) + 1}-1${i % 9}`,
  dueDate: `2026-0${(i % 8) + 1}-2${i % 9}`,
  status: invStatuses[i % invStatuses.length],
}));

const estStatuses: Estimate["status"][] = ["Draft", "Not Sent", "Sent", "Expired", "Declined", "Accepted"];
export const estimates: Estimate[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `EST-${2000 + i}`,
  customer: ["elvan_tw", "tawhid_wp", "figma_flows"][i % 3],
  amount: `$${(400 + i * 55).toFixed(2)}`,
  date: `2026-0${(i % 8) + 1}-0${(i % 9) + 1}`,
  expiryDate: `2026-0${(i % 8) + 1}-2${i % 9}`,
  status: estStatuses[i % estStatuses.length],
}));

const propStatuses: Proposal["status"][] = ["Draft", "Sent", "Open", "Revised", "Declined", "Accepted"];
export const proposals: Proposal[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `PRO-${3000 + i}`,
  subject: `Website redesign proposal #${i + 1}`,
  customer: ["elvan_tw", "tawhid_wp", "vertexline_agency"][i % 3],
  total: `$${(600 + i * 80).toFixed(2)}`,
  date: `2026-0${(i % 8) + 1}-0${(i % 9) + 1}`,
  openTill: `2026-0${(i % 8) + 1}-2${i % 9}`,
  status: propStatuses[i % propStatuses.length],
}));

export const payments: Payment[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `PAY-${4000 + i}`,
  invoiceId: `INV-${1000 + i}`,
  mode: ["Bank Transfer", "Card", "PayPal", "Wise"][i % 4],
  transactionId: `TXN${9000 + i * 7}`,
  customer: ["elvan_tw", "tawhid_wp", "figma_flows", "arif_pro"][i % 4],
  amount: `$${(200 + i * 37).toFixed(2)}`,
  date: `2026-0${(i % 8) + 1}-1${i % 9}`,
}));

export const items: Item[] = [
  { id: 1, description: "WordPress Website Setup", longDescription: "Full custom WordPress build with theme setup", rate: "$450.00", tax: "0%", unit: "project" },
  { id: 2, description: "SEO Optimization", longDescription: "On-page SEO and speed optimization", rate: "$120.00", tax: "0%", unit: "hour" },
  { id: 3, description: "Landing Page Design", longDescription: "Single landing page UI/UX design", rate: "$180.00", tax: "0%", unit: "page" },
  { id: 4, description: "Maintenance Retainer", longDescription: "Monthly website maintenance and support", rate: "$90.00", tax: "0%", unit: "month" },
  { id: 5, description: "Custom Plugin Development", longDescription: "Bespoke WordPress plugin build", rate: "$300.00", tax: "0%", unit: "project" },
];
