"use client";
import { LayoutGrid } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import NewRecordButton from "@/components/ui/NewRecordButton";
import { articles } from "@/data/articles";
import { Column, Article } from "@/types";

const columns: Column<Article>[] = [
  { key: "name", header: "Article Name" },
  { key: "group", header: "Group" },
  { key: "datePublished", header: "Date Published" },
];

export default function KnowledgeBasePage() {
  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        subtitle={
          <div className="flex gap-3">
            <a href="#" className="text-brand hover:underline">Groups →</a>
            <span className="flex items-center gap-1 text-gray-500"><LayoutGrid size={13} /> View Kanban</span>
          </div>
        }
        actions={<NewRecordButton label="New Article" fields={["Article Name", "Group"]} />}
      />
      <DataTable columns={columns} rows={articles} searchKeys={["name", "group"]} />
    </div>
  );
}
