import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, Flag, TrendingUp, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/App";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/players", icon: Users, label: "Players" },
  { path: "/courses", icon: Flag, label: "Courses" },
  { path: "/handicap-tracking", icon: TrendingUp, label: "HCP" },
  { path: "/subscription", icon: CreditCard, label: "Sub" },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useUser();

  // Don't show on login page
  if (location.pathname === "/" || location.pathname === "/login") {
    return null;
  }

  return (
    <nav className="mobile-nav 2xl:hidden bg-[#2E7D32] border-t border-[#4CAF50]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/dashboard" && location.pathname.startsWith("/competition"));
          
          return (
            <button
              key={item.path}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95",
                isActive 
                  ? "text-white" 
                  : "text-white/60 active:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span className="text-[9px] mt-1 font-semibold tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
