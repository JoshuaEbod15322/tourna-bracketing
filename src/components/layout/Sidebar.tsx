import React, { useState } from "react";
import {
  Trophy,
  Plus,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Swords,
  Database,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export type NavTab = "dashboard" | "bracket" | "teams" | "matches" | "data";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreate: () => void;
  tournamentName?: string;
}

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: React.ElementType }> =
  [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "bracket", label: "Bracket", icon: Trophy },
    { id: "teams", label: "Teams", icon: Users },
    { id: "matches", label: "Matches", icon: Swords },
    { id: "data", label: "Backup & Data", icon: Database },
  ];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  tournamentName,
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("apex-sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem("apex-sidebar-collapsed", prev ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !prev;
    });
  };

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  const renderNavButton = (
    item: (typeof NAV_ITEMS)[number],
    iconOnly: boolean,
  ) => {
    const Icon = item.icon;
    const active = currentTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleSelect(item.id)}
        title={iconOnly ? item.label : undefined}
        className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-colors ${
          iconOnly ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
        } ${
          active
            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-semibold"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!iconOnly && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="md:hidden sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="h-14 px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSelect("dashboard")}
              className="flex items-center gap-2 min-w-0 text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                SPCBracket
              </span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl">
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  SPCBracket
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {tournamentName && (
              <div className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 truncate">
                / {tournamentName}
              </div>
            )}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV_ITEMS.map((item) => renderNavButton(item, false))}
            </nav>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onOpenCreate();
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>New Tournament</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 sticky top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ${
          collapsed ? "w-[72px]" : "w-60"
        }`}
      >
        {/* Brand */}
        <div
          className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-800 ${collapsed ? "justify-center px-0" : "px-4 justify-between"}`}
        >
          <button
            onClick={() => onSelectTab("dashboard")}
            className="flex items-center gap-2.5 text-left group min-w-0"
            title={collapsed ? "SPCBracket — Dashboard" : undefined}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:bg-blue-500 transition-colors shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                SPCBracket
              </span>
            )}
          </button>
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav
          className={`flex-1 overflow-y-auto space-y-1 ${collapsed ? "p-2" : "p-3"}`}
        >
          {NAV_ITEMS.map((item) => renderNavButton(item, collapsed))}
        </nav>

        {/* Footer actions */}
        <div
          className={`border-t border-slate-200 dark:border-slate-800 ${collapsed ? "p-2" : "p-3"}`}
        >
          {collapsed ? (
            <>
              <button
                onClick={toggleCollapsed}
                className="w-full flex items-center justify-center py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
              <button
                onClick={onOpenCreate}
                className="mt-2 w-full flex items-center justify-center py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-sm"
                title="New Tournament"
              >
                <Plus className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenCreate}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Tournament</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
