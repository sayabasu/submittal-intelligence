"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RISK_COLORS,
  RISK_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  SUBMITTAL_STATUSES,
  RISK_LEVELS,
  DISCIPLINES,
} from "@/lib/constants";
import { formatShortDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  X,
} from "lucide-react";

interface SubmittalRow {
  id: string;
  submittalNumber: string;
  specSection: string;
  description: string;
  discipline: string;
  status: string;
  riskLevel: string | null;
  riskScore: number | null;
  reviewDueDate: string | null;
  requiredOnSiteDate: string;
  vendor: string;
  marginDays?: number;
}

interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-muted-foreground">--</span>;
  const color = RISK_COLORS[level] || "#6b7280";
  const label = RISK_LABELS[level] || level;
  return (
    <span
      className={cn("risk-badge-" + level, "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold")}
      style={{
        backgroundColor: color + "18",
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "#6b7280";
  const label = STATUS_LABELS[status] || status;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: color + "18",
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}

export function SubmittalTable() {
  const [data, setData] = useState<SubmittalRow[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("all");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pagination.page));
      params.set("pageSize", String(pagination.pageSize));

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (riskFilter && riskFilter !== "all") params.set("riskLevel", riskFilter);
      if (disciplineFilter && disciplineFilter !== "all") params.set("discipline", disciplineFilter);

      if (sorting.length > 0) {
        params.set("sortBy", sorting[0].id);
        params.set("sortDir", sorting[0].desc ? "desc" : "asc");
      }

      const res = await fetch(`/api/submittals?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response but got HTML/Text");
      }
      const json = await res.json();
      setData(json.data || []);
      setPagination((prev) => ({
        ...prev,
        total: json.pagination?.total ?? 0,
        totalPages: json.pagination?.totalPages ?? 0,
      }));
    } catch (err) {
      console.error("Failed to fetch submittals:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, statusFilter, riskFilter, disciplineFilter, sorting]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, statusFilter, riskFilter, disciplineFilter]);

  const columns = useMemo<ColumnDef<SubmittalRow>[]>(
    () => [
      {
        accessorKey: "submittalNumber",
        header: "Submittal #",
        size: 110,
        cell: ({ row }) => (
          <Link
            href={`/submittals/${row.original.id}`}
            className="font-mono text-xs font-semibold text-primary hover:underline"
          >
            {row.original.submittalNumber}
          </Link>
        ),
      },
      {
        accessorKey: "specSection",
        header: "Spec Section",
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 280,
        cell: ({ getValue }) => {
          const desc = getValue() as string;
          const truncated = desc.length > 60 ? desc.slice(0, 60) + "..." : desc;
          return (
            <span className="text-xs" title={desc}>
              {truncated}
            </span>
          );
        },
      },
      {
        accessorKey: "discipline",
        header: "Discipline",
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-xs">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
      {
        accessorKey: "riskLevel",
        header: "Risk",
        size: 100,
        cell: ({ getValue }) => <RiskBadge level={getValue() as string | null} />,
      },
      {
        accessorKey: "reviewDueDate",
        header: "Review Due",
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {formatShortDate(getValue() as string | null)}
          </span>
        ),
      },
      {
        accessorKey: "requiredOnSiteDate",
        header: "Req. On Site",
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {formatShortDate(getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: "vendor",
        header: "Vendor",
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-xs">{getValue() as string}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <Link
            href={`/submittals/${row.original.id}`}
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setRiskFilter("all");
    setDisciplineFilter("all");
  };

  const hasActiveFilters =
    debouncedSearch || statusFilter !== "all" || riskFilter !== "all" || disciplineFilter !== "all";

  return (
    <div className="flex flex-col gap-3">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search submittals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(SUBMITTAL_STATUSES).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s] || s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v ?? "all")}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            {Object.values(RISK_LEVELS).map((r) => (
              <SelectItem key={r} value={r}>
                {RISK_LABELS[r] || r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={disciplineFilter} onValueChange={(v) => setDisciplineFilter(v ?? "all")}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Discipline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Disciplines</SelectItem>
            {DISCIPLINES.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}

        <div className="ml-auto text-xs text-muted-foreground">
          {pagination.total} submittal{pagination.total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={cn(
                      "text-xs",
                      header.column.getCanSort() && "cursor-pointer select-none"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && header.id !== "actions" && (
                        <>
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                          )}
                        </>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No submittals found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const riskLevel = row.original.riskLevel;
                const borderColor =
                  riskLevel === "critical" || riskLevel === "high"
                    ? RISK_COLORS[riskLevel]
                    : undefined;
                return (
                  <TableRow
                    key={row.id}
                    className="group"
                    style={
                      borderColor
                        ? { borderLeft: `3px solid ${borderColor}` }
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Showing {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}
          {" - "}
          {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
          {pagination.total}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={pagination.page <= 1}
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2 text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
