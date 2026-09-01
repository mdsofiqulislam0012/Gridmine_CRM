"use client";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import NewRecordButton from "@/components/ui/NewRecordButton";
import { items } from "@/data/sales";
import { Column, Item } from "@/types";

const columns: Column<Item>[] = [
  { key: "description", header: "Description" },
  { key: "longDescription", header: "Long Description" },
  { key: "rate", header: "Rate" },
  { key: "tax", header: "Tax" },
  { key: "unit", header: "Unit" },
];

export default function ItemsPage() {
  return (
    <div>
      <PageHeader title="Items" actions={<NewRecordButton label="New Item" fields={["Description", "Rate", "Unit"]} />} />
      <DataTable columns={columns} rows={items} searchKeys={["description"]} selectable bulkActions />
    </div>
  );
}
