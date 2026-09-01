import { Project } from "@/types";

const names = ["elvan_tw", "tawhid_wp", "figma_flows", "silverbyte_dev", "vertexline_agency"];
const statuses: Project["status"][] = ["Finished", "In Progress", "Not Started", "On Hold", "Cancelled"];

export const projects: Project[] = Array.from({ length: 24 }).map((_, i) => {
  const status = statuses[i % 5 === 0 ? 4 : i % 7 === 0 ? 3 : i % 4 === 0 ? 0 : i % 3 === 0 ? 1 : 2];
  return {
    id: 200 + i,
    name: `${names[i % names.length]}__project${i}_#FO${3140 + i}_(WordPress Website)_Batch${i}`,
    customer: names[i % names.length],
    tags: i % 3 === 0 ? ["Priority"] : [],
    startDate: `2025-11-${(1 + (i % 27)).toString().padStart(2, "0")}`,
    deadline: `2025-12-${(1 + (i % 27)).toString().padStart(2, "0")}`,
    members: ["Silk", "MD", i % 2 === 0 ? "Tanvir" : "Rafi"],
    status,
    deliveredWork: status === "Finished" ? "Delivered" : "",
    workingFile: "",
    profitShare: status === "Finished" ? (Math.random() * 12000).toFixed(2) : status === "Cancelled" ? "00" : "",
  };
});

export const projectStatusCounts = {
  "Not Started": 13, "In Progress": 59, "On Hold": 2, "Cancelled": 27, "Finished": 492,
};
