import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type WipExportButtonProps = {
  projectId: number;
};

function toCsv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell ?? "";
          if (/[",\n]/.test(value)) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    )
    .join("\n");
}

const WipExportButton = ({ projectId }: WipExportButtonProps) => {
  const utils = trpc.useUtils();

  const handleExport = async () => {
    try {
      const data = await utils.liveRun.getWipExport.fetch({ projectId });
      const header = [
        "Order",
        "Step",
        "Description",
        "Status",
        "Started",
        "Completed",
      ];
      const body = data.rows.map((row) => [
        String(row.order),
        row.label,
        row.description,
        row.status,
        row.startedAt ? new Date(row.startedAt).toISOString() : "",
        row.completedAt ? new Date(row.completedAt).toISOString() : "",
      ]);
      const meta = [
        ["Project", data.projectTitle],
        ["Stage", data.commercialStage],
        [
          "Commit date",
          data.commitDate ? new Date(data.commitDate).toISOString() : "",
        ],
        ["Generated at", data.generatedAt],
        ["Live run", data.run?.title || ""],
        ["Percent complete", data.run ? String(data.run.percentComplete) : ""],
        [],
      ];
      const csv = toCsv([...meta, header, ...body]);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wip-${projectId}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("WIP exported (Excel-ready CSV)");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  };

  return (
    <Button variant="outline" className="border-white/15" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export WIP
    </Button>
  );
};

export default WipExportButton;
