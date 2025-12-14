import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileQuestion,
  Users,
  Settings,
  BarChart3,
  PlusCircle,
  List,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
    ],
  },
  {
    title: "Quizzes",
    items: [
      { icon: PlusCircle, label: "Create Quiz", href: "/dashboard/create" },
      { icon: List, label: "My Quizzes", href: "/dashboard/quizzes" },
    ],
  },
  {
    title: "Management",
    items: [
      { icon: Users, label: "Participants", href: "/dashboard/participants" },
      { icon: Bell, label: "Notifications", href: "/dashboard/notifications", badge: 3 },
      { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ],
  },
];

export const DashboardSidebar = () => {
  const location = useLocation();

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border p-4 flex flex-col"
    >
      <Link to="/" className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">Q</span>
        </div>
        <span className="font-bold text-xl text-sidebar-foreground">Quizify</span>
      </Link>

      <nav className="flex-1 space-y-6">
        {menuItems.map((section) => (
          <div key={section.title}>
            <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge variant="glow" className="text-[10px] px-2 py-0.5">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-semibold">JD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-sidebar-foreground">John Doe</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
