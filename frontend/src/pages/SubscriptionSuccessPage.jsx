import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Flag, CheckCircle, Loader2, XCircle } from "lucide-react";
import axios from "axios";

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [status, setStatus] = useState("checking"); // "checking", "success", "failed"
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10;

  useEffect(() => {
    if (!sessionId) {
      setStatus("failed");
      return;
    }
    pollPaymentStatus();
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    if (attempts >= maxAttempts) {
      setStatus("failed");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API}/subscription/status/${sessionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.data.payment_status === "paid") {
        setStatus("success");
        return;
      } else if (response.data.status === "expired") {
        setStatus("failed");
        return;
      }

      // Keep polling
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, 2000);
    } catch (error) {
      console.error("Payment status check error:", error);
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="golf-header text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 p-3 rounded-full">
              <Flag className="w-10 h-10 text-[#C0C0C0]" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase mb-2">
            {status === "checking" ? "Processing Payment" : 
             status === "success" ? "Payment Successful" : "Payment Issue"}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 bg-secondary/30">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 pb-8 text-center">
            {status === "checking" && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
                <p className="text-muted-foreground mb-6">
                  Please wait while we confirm your payment...
                </p>
                <div className="text-sm text-muted-foreground">
                  Attempt {attempts + 1} of {maxAttempts}
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Thank You!</h2>
                <p className="text-muted-foreground mb-6">
                  Your subscription has been activated. You now have full access to all features.
                </p>
                <Button
                  data-testid="go-to-dashboard"
                  onClick={() => navigate("/dashboard")}
                  className="w-full rounded-none uppercase font-bold tracking-widest py-5"
                >
                  Go to Dashboard
                </Button>
              </>
            )}

            {status === "failed" && (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Something Went Wrong</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't verify your payment. If you were charged, please contact support.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate("/subscription")}
                    className="w-full rounded-none uppercase font-bold tracking-widest"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="w-full rounded-none"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
