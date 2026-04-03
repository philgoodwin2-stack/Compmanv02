import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, Flag, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/players", icon: Users, label: "Players" },
  { path: "/courses", icon: Flag, label: "Courses" },
  { path: "/handicap-tracking", icon: TrendingUp, label: "HCP" },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on login page
  if (location.pathname === "/" || location.pathname === "/login") {
    return null;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1B4D3E] border-t border-[#2D5A4A] z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/dashboard" && location.pathname.startsWith("/competition"));
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95",
                isActive 
                  ? "text-[#D4AF37]" 
                  : "text-white/60 active:text-white"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] mt-1 font-semibold tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
