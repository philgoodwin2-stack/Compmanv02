import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flag, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import axios from "axios";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
      navigate("/");
    }
  }, [token, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, {
        token,
        new_password: password
      });
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to reset password. The link may have expired.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="golf-header text-white py-12 px-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 p-3 rounded-full">
              <Flag className="w-10 h-10 text-[#D4AF37]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-2">
            Stableford Golf
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-light">
            Set your new password
          </p>
        </div>
      </div>

      {/* Reset Form Section */}
      <div className="flex-1 flex items-center justify-center p-4 bg-secondary/30">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold uppercase tracking-tight">
              {success ? "Password Reset" : "New Password"}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {success 
                ? "Your password has been updated" 
                : "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-muted-foreground mb-6">
                  You can now sign in with your new password.
                </p>
                <Button
                  data-testid="go-to-login-button"
                  onClick={() => navigate("/")}
                  className="w-full rounded-none uppercase font-bold tracking-widest py-5"
                >
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      data-testid="new-password-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-none pl-10 pr-10"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      data-testid="confirm-password-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-none pl-10 pr-10"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <Button
                  data-testid="reset-password-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-none uppercase font-bold tracking-widest py-5"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
