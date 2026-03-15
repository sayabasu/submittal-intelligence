"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Send,
  Upload,
  Zap,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ProjectSummary } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `API error [${res.status}]: ${text.slice(0, 100)}${
          text.length > 100 ? "..." : ""
        }`
      );
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Expected JSON response but got something else");
    }
    return res.json();
  });

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "riskAlerts";
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Submittals", href: "/submittals", icon: FileText },
  {
    label: "Risk Alerts",
    href: "/risk-alerts",
    icon: AlertTriangle,
    badgeKey: "riskAlerts",
  },
  { label: "Escalations", href: "/escalations", icon: Send },
  { label: "Upload", href: "/upload", icon: Upload },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: project } = useSWR<ProjectSummary>("/api/projects", fetcher, {
    refreshInterval: 30000,
  });

  const riskAlertCount =
    project?.riskCounts
      ? (project.riskCounts.critical ?? 0) + (project.riskCounts.high ?? 0)
      : 0;

  function getBadgeCount(key: string | undefined): number | null {
    if (!key) return null;
    if (key === "riskAlerts") return riskAlertCount > 0 ? riskAlertCount : null;
    return null;
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-[#0f172a] text-slate-300">
      {/* Project Header */}
      <div className="flex items-center gap-3 border-b border-slate-700/50 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20">
          <Building2 className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium tracking-wider uppercase text-slate-500">
            Project
          </span>
          <span className="text-sm font-semibold text-white">
            Hyperion DC-01
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
          Navigation
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const badgeCount = getBadgeCount(item.badgeKey);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-blue-600/15 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      isActive
                        ? "text-blue-400"
                        : "text-slate-500 group-hover:text-slate-400"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {badgeCount !== null && (
                    <Badge
                      variant="destructive"
                      className="h-5 min-w-[20px] rounded-full px-1.5 text-[10px] font-bold"
                    >
                      {badgeCount}
                    </Badge>
                  )}
                  {isActive && (
                    <div className="h-5 w-0.5 rounded-full bg-blue-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/50 px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>Agentic Submittal Intelligence</span>
        </div>
        <div className="mt-1 text-[10px] text-slate-600">
          Powered by Terabase AI
        </div>
      </div>
    </aside>
  );
}
