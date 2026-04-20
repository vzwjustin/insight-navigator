import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FilePlus2, LogOut, Brain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/assessments/new", label: "New assessment", icon: FilePlus2 },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-60 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-2">
          <div className="size-8 rounded-md bg-gradient-primary flex items-center justify-center">
            <Brain className="size-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Assessment</div>
            <div className="text-xs opacity-70 leading-tight">Copilot</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "hover:bg-sidebar-accent/60 text-sidebar-foreground"
                }`
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="px-2 text-xs opacity-70 truncate">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/60"
            onClick={async () => { await signOut(); navigate("/auth"); }}
          >
            <LogOut className="size-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="md:hidden border-b border-border px-4 py-3 flex items-center justify-between bg-card">
          <div className="font-semibold">Assessment Copilot</div>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/auth"); }}>
            <LogOut className="size-4" />
          </Button>
        </header>
        <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto animate-fade-in">{children}</div>
      </main>
    </div>
  );
};
