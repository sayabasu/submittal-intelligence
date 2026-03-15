import { SubmittalTable } from "@/components/submittals/submittal-table";

export const metadata = {
  title: "Submittal Log | Submittal Intelligence",
  description: "View and manage all project submittals",
};

export default function SubmittalsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Submittal Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Track, filter, and manage all project submittals and their risk
            status.
          </p>
        </div>
      </div>
      <SubmittalTable />
    </div>
  );
}
