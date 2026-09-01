import { Task } from "@/types";

const taskNames = [
  "Review the full website flow from a real customer perspective",
  "Test the complete purchase journey (product page to checkout)",
  "Check purchase emails, confirmations, and account access",
  "Identify and fix any misconfigurations, broken settings",
  "Make minor layout or structure tweaks only where needed",
  "Align the overall customer experience with the requirements",
  "Basic SEO optimize",
  "Set up analytics and conversion tracking",
  "Cross-browser and mobile responsiveness check",
  "Final client handover and documentation",
];
const statuses: Task["status"][] = ["Not Started", "In Progress", "Testing", "Awaiting Feedback", "Complete"];
const priorities: Task["priority"][] = ["Low", "Medium", "High"];

export const tasks: Task[] = Array.from({ length: 18 }).map((_, i) => ({
  id: i + 1,
  name: taskNames[i % taskNames.length],
  project: "#235 - elvan_tw_digirushstudios_#FO1DA5B1BA43_(WordPress Website) - elvan_tw",
  status: i < 12 ? "Complete" : statuses[i % statuses.length],
  startDate: "2025-12-22",
  dueDate: "2025-12-24",
  assignedTo: "MD. Sofiq Islam",
  tags: [],
  priority: priorities[i % priorities.length],
}));

export const taskStatusCounts = { "Not Started": 38, "In Progress": 4, Testing: 0, "Awaiting Feedback": 0, Complete: 116 };
