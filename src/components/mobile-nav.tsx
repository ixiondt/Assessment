"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Camera,
  FileText,
} from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
];

const surveyTabs = [
  { suffix: "", label: "Overview", icon: ClipboardList },
  { suffix: "/checklist", label: "Checklist", icon: ClipboardList },
  { suffix: "/risk-matrix", label: "Risks", icon: AlertTriangle },
  { suffix: "/photos", label: "Photos", icon: Camera },
  { suffix: "/report", label: "Report", icon: FileText },
];

export function MobileNav() {
  const pathname = usePathname();

  const surveyMatch = pathname.match(/^\/surveys\/([^/]+)/);
  const surveyId = surveyMatch?.[1];

  const activeTabs = surveyId
    ? surveyTabs.map((tab) => ({
        ...tab,
        href: `/surveys/${surveyId}${tab.suffix}`,
      }))
    : tabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around">
        {activeTabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === pathname ||
            (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition-colors min-w-[56px]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
