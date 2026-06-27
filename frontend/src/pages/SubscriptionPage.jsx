import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Flag, Check, Clock, CreditCard, Loader2, LogOut } from "lucide-react";
import axios from "axios";

const PACKAGES = [
  { id: "monthly", amount: 1, duration: "1 Month", label: "Monthly", popular: false },
  { id: "biannual", amount: 5, duration: "6 Months", label: "Best Value", popular: true },
  { id: "annual", amount: 10, duration: "1 Year", label: "Annual", popular: false }
];

function CountdownTimer({ expiryDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const expiry = new Date(expiryDate);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  return (
    <div className="flex gap-4 justify-center">
      <div className="text-center">
        <div className="text-3xl sm:text-4xl font-mono font-bold">{timeLeft.days}</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Days</div>
      </div>
      <div className="text-center">
        <div className="text-3xl sm:text-4xl font-mono font-bold">{timeLeft.hours}</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Hours</div>
      </div>
      <div className="text-center">
        <div className="text-3xl sm:text-4xl font-mono font-bold">{timeLeft.minutes}</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Mins</div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { authUser, logout } = useUser();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPackage, setProcessingPackage] = useState(null);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/");
      toast.info("You have been logged out");
    } catch (error) {
      navigate("/");
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API}/subscription/my-subscription`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSubscription(response.data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast.error("Failed to load subscription status");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    toast.info("Refreshing subscription status...");
    await fetchSubscription();
    toast.success("Subscription status refreshed");
  };

  const handleSubscribe = async (packageId) => {
    setProcessingPackage(packageId);
    try {
      const response = await axios.post(`${API}/subscription/checkout`, {
        package_id: packageId,
        origin_url: window.location.origin
      });
      window.location.href = response.data.url;
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to start checkout";
      toast.error(message);
      setProcessingPackage(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Hero Section */}
      <div className="golf-header text-white py-8 sm:py-12 px-4 relative">
        {/* Logout Button - Top Right */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10"
          data-testid="subscription-logout-btn"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
        
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 p-3 rounded-full">
              <Flag className="w-8 h-8 sm:w-10 sm:h-10 text-[#C0C0C0]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight uppercase mb-2">
            {subscription?.is_active ? "Your Subscription" : "Choose Your Plan"}
          </h1>
          <p className="text-base sm:text-lg text-white/80 font-light">
            {subscription?.is_active 
              ? `Active until ${new Date(subscription.subscription_ends_at).toLocaleDateString()}`
              : "Unlock all features with a subscription"}
          </p>
          {subscription?.is_active && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Clock className="w-5 h-5" />
              <span className="text-lg font-bold">{subscription.days_remaining} days remaining</span>
            </div>
          )}
          {/* Refresh button for non-subscribed users */}
          {!subscription?.is_active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="mt-4 text-white/70 hover:text-white hover:bg-white/10"
              data-testid="refresh-subscription-btn"
            >
              Refresh Status
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          {/* Subscription Status Card - Always visible */}
          <Card className={`mb-6 border-2 ${subscription?.is_active ? 'border-primary' : 'border-amber-500'}`}>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                {subscription?.is_active ? (
                  <>
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                      <Check className="w-5 h-5" />
                      <span className="font-semibold uppercase tracking-wide text-sm">Active Subscription</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Time Remaining</h2>
                    <CountdownTimer expiryDate={subscription.subscription_ends_at} />
                    <div className="text-center text-sm text-muted-foreground mt-4">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Expires: {new Date(subscription.subscription_ends_at).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-2 rounded-full mb-4">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold uppercase tracking-wide text-sm">
                        {subscription?.subscription_package === 'trial' ? 'Trial Expired' : 'No Active Subscription'}
                      </span>
                    </div>
                    <div className="flex gap-4 justify-center my-4">
                      <div className="text-center">
                        <div className="text-3xl sm:text-4xl font-mono font-bold text-amber-600">0</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl sm:text-4xl font-mono font-bold text-amber-600">0</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl sm:text-4xl font-mono font-bold text-amber-600">0</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Mins</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.subscription_package === 'trial' 
                        ? 'Your free trial has ended. Subscribe to continue using the app.'
                        : 'Subscribe below to unlock all features'}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Extend or New Subscription */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
              {subscription?.is_active ? "Extend Your Subscription" : "Select a Plan"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {subscription?.is_active 
                ? "Add more time to your current subscription"
                : "One-time payment, no recurring charges"}
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PACKAGES.map((pkg) => (
              <Card 
                key={pkg.id}
                className={`relative ${pkg.popular ? 'border-2 border-primary shadow-lg' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1">
                      Best Value
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg font-bold uppercase">{pkg.duration}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">${pkg.amount}</span>
                    <span className="text-muted-foreground text-sm ml-1">USD</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                      Full app access
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                      All societies & competitions
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                      Handicap tracking
                    </li>
                  </ul>
                  <Button
                    data-testid={`subscribe-${pkg.id}`}
                    onClick={() => handleSubscribe(pkg.id)}
                    disabled={processingPackage !== null}
                    className={`w-full rounded-none uppercase font-bold tracking-widest ${
                      pkg.popular ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {processingPackage === pkg.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {subscription?.is_active ? "Extend" : "Subscribe"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Back to Dashboard */}
          {subscription?.is_active && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="rounded-none"
              >
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
