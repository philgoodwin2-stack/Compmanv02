import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Flag, 
  Trophy, 
  Users, 
  MapPin, 
  TrendingUp, 
  CreditCard, 
  LogOut,
  Clock,
  ChevronRight
} from "lucide-react";
import axios from "axios";

const menuItems = [
  {
    title: "Competitions",
    description: "View leaderboards & enter scores",
    icon: Trophy,
    path: "/dashboard",
    color: "bg-primary"
  },
  {
    title: "Players",
    description: "Manage players & handicaps",
    icon: Users,
    path: "/players",
    color: "bg-blue-600"
  },
  {
    title: "Courses",
    description: "View & manage courses",
    icon: MapPin,
    path: "/courses",
    color: "bg-emerald-600"
  },
  {
    title: "Handicap Tracking",
    description: "View handicap history",
    icon: TrendingUp,
    path: "/handicap-tracking",
    color: "bg-amber-600"
  },
  {
    title: "Subscription",
    description: "Manage your subscription",
    icon: CreditCard,
    path: "/subscription",
    color: "bg-purple-600"
  }
];

export default function MenuPage() {
  const navigate = useNavigate();
  const { user, authUser, logout } = useUser();
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`${API}/subscription/my-subscription`);
      setSubscription(response.data);
    } catch (error) {
      // Silently handle
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="golf-header text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-full">
                <Flag className="w-8 h-8 text-[#C0C0C0]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight uppercase">Golf Stableford</h1>
                <p className="text-white/70 text-sm">Welcome, {user?.username || authUser?.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/70 hover:text-white hover:bg-white/10"
              data-testid="menu-logout-btn"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* Subscription Status */}
          {subscription && (
            <div className={`rounded-lg p-4 ${subscription.is_active ? 'bg-white/10' : 'bg-amber-500/20'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <div>
                    <p className="font-medium text-sm">
                      {subscription.is_active 
                        ? `Subscription: ${subscription.days_remaining} days remaining`
                        : "No active subscription"}
                    </p>
                    {subscription.is_active && subscription.subscription_ends_at && (
                      <p className="text-xs text-white/60">
                        Expires: {new Date(subscription.subscription_ends_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {!subscription.is_active && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate("/subscription")}
                    className="text-xs"
                  >
                    Subscribe
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Grid with Golf Pattern Background */}
      <div className="flex-1 p-4 sm:p-6 relative overflow-hidden" style={{
        backgroundColor: '#f8faf8',
        backgroundImage: `
          radial-gradient(circle at 20px 20px, rgba(34, 139, 34, 0.08) 8px, transparent 8px),
          radial-gradient(circle at 60px 60px, rgba(34, 139, 34, 0.05) 12px, transparent 12px),
          radial-gradient(circle at 100px 30px, rgba(34, 139, 34, 0.06) 6px, transparent 6px),
          linear-gradient(135deg, rgba(34, 139, 34, 0.03) 25%, transparent 25%),
          linear-gradient(225deg, rgba(34, 139, 34, 0.03) 25%, transparent 25%),
          linear-gradient(45deg, rgba(34, 139, 34, 0.03) 25%, transparent 25%),
          linear-gradient(315deg, rgba(34, 139, 34, 0.03) 25%, transparent 25%)
        `,
        backgroundSize: '120px 120px, 120px 120px, 120px 120px, 40px 40px, 40px 40px, 40px 40px, 40px 40px',
        backgroundPosition: '0 0, 0 0, 0 0, 0 0, 20px 0, 0 20px, 20px 20px'
      }}>
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-lg font-bold uppercase tracking-tight mb-4 text-muted-foreground">
            Menu
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <Card
                key={item.path}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => navigate(item.path)}
                data-testid={`menu-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`${item.color} p-3 rounded-lg`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Current Handicap Display */}
          {user?.handicap !== undefined && (
            <Card className="mt-6 border-2 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Your Handicap Index</p>
                    <p className="text-4xl font-mono font-bold text-primary">
                      {typeof user.handicap === 'number' ? user.handicap.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/handicap-tracking")}
                    className="rounded-none"
                  >
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom spacing for mobile nav */}
      <div className="h-20" />
    </div>
  );
}
