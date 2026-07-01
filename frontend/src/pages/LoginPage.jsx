import { useState } from "react";
import { useUser, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flag, Trophy, Users, LogIn, UserPlus, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import axios from "axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login", "register", or "forgot"
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success("Welcome back!");
    } catch (error) {
      const message = error.response?.data?.detail || "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, name.trim());
      toast.success("Account created! Please link your player profile.");
    } catch (error) {
      const message = error.response?.data?.detail || "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: email.trim().toLowerCase() });
      toast.success("If that email exists, a reset link has been sent. Check your inbox!");
      setMode("login");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" login min-h-screen flex flex-col ">
      {/* Hero Section */}
      <div className="golf-header text-white py-12 px-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 p-3 rounded-full">
              <Flag className="w-10 h-10 text-[#C0C0C0]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-2">
            Stableford Golf
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-light">
            Track scores. Compete. Win.
          </p>
        </div>
      </div>

      {/* Auth Section */}
      <div className="flex-1 flex items-center justify-center p-4 bg-secondary/30">
        <Card className="bg-white-100/20 w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold uppercase tracking-tight">
              {mode === "login" ? "Welcome Back" : mode === "register" ? "Create Account" : "Reset Password"}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {mode === "login"
                ? "Sign in to your account"
                : mode === "register"
                  ? "Join the competition"
                  : "Enter your email to receive a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {mode === "forgot" ? (
              <>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        data-testid="forgot-email-input"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-none pl-10"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button
                    data-testid="forgot-submit-button"
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-none uppercase font-bold tracking-widest py-5"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="mt-4 flex items-center justify-center w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="back-to-login"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Sign In
                </button>
              </>
            ) : (
              <>
                {/* Mode Toggle */}
                <div className="flex gap-2 mb-6">
                  <Button
                    type="button"
                    variant={mode === "login" ? "default" : "outline"}
                    className="flex-1 rounded-none"
                    onClick={() => setMode("login")}
                    data-testid="login-tab"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "register" ? "default" : "outline"}
                    className="flex-1 rounded-none"
                    onClick={() => setMode("register")}
                    data-testid="register-tab"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register
                  </Button>
                </div>

                {mode === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          data-testid="login-email-input"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="rounded-none pl-10"
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-xs text-primary hover:underline"
                          data-testid="forgot-password-link"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          data-testid="login-password-input"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="rounded-none pl-10 pr-10"
                          autoComplete="current-password"
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
                    <Button
                      data-testid="login-submit-button"
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-none uppercase font-bold tracking-widest py-5"
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Your Name</Label>
                      <Input
                        id="register-name"
                        data-testid="register-name-input"
                        type="text"
                        placeholder="e.g., Phil G"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-none"
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        This will be your display name
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="register-email"
                          data-testid="register-email-input"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="rounded-none pl-10"
                          autoComplete="email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          data-testid="register-password-input"
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="rounded-none pl-10 pr-10"
                          autoComplete="new-password"
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
                    <Button
                      data-testid="register-submit-button"
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-none uppercase font-bold tracking-widest py-5"
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wide">Scoring</h3>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wide">Compete</h3>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Flag className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wide">Handicaps</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
