import { useState } from "react";
import { useUser, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flag, Trophy, Users, Plus, LogIn, UserPlus, ArrowLeft } from "lucide-react";
import axios from "axios";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [societyName, setSocietyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login", "join", or "create"
  const [needsCode, setNeedsCode] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const { login } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      // Try to login with just username first
      const result = await login(username.trim(), null, null);
      
      // Check if user needs to join a society
      if (result.needs_society) {
        setNeedsCode(true);
        toast.info("Please join or create a society to continue");
      } else {
        // User already has a society - go straight to dashboard
        toast.success(result.message);
        // Navigation happens automatically via App.js redirect when user state is set
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserCheck = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      // Check if username exists
      const response = await axios.get(`${API}/check-username/${encodeURIComponent(username.trim())}`);
      
      if (response.data.exists) {
        if (response.data.has_society) {
          toast.error("This name is already taken. Please use 'Returning User' to login or choose a different name.");
        } else {
          // User exists but has no society - let them join/create
          setNeedsCode(true);
          setIsNewUser(false);
          toast.info("Account found! Please join or create a society.");
        }
      } else {
        // Username is available - proceed to society selection
        setNeedsCode(true);
        toast.success("Name available! Now join or create a society.");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to check username");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSociety = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!joinCode.trim()) {
      toast.error("Please enter a society code");
      return;
    }

    setLoading(true);
    try {
      const result = await login(username.trim(), null, joinCode.trim().toUpperCase());
      toast.success(result.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid society code");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSociety = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!societyName.trim()) {
      toast.error("Please enter a society name");
      return;
    }

    setLoading(true);
    try {
      // First create the society
      const societyResponse = await axios.post(`${API}/societies`, {
        name: societyName.trim()
      });
      const society = societyResponse.data;
      
      // Then login with the new society
      const result = await login(username.trim(), society.id, null);
      
      toast.success(`Society created! Your join code is: ${society.join_code}`);
      
      // Show the join code in an alert for copying
      setTimeout(() => {
        alert(`Share this code with your society members:\n\n${society.join_code}\n\nYou are now the admin of ${society.name}`);
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create society");
    } finally {
      setLoading(false);
    }
  };

  // If user needs to join/create a society after initial login attempt
  if (needsCode) {
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
              Welcome, {username}!
            </p>
          </div>
        </div>

        {/* Society Selection */}
        <div className="flex-1 flex items-center justify-center p-4 bg-secondary/30">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold uppercase tracking-tight">
                {mode === "join" ? "Join a Society" : "Create a Society"}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {mode === "join" 
                  ? "Enter the code from your society admin" 
                  : "Start a new golf society and invite members"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6">
                <Button
                  type="button"
                  variant={mode === "join" ? "default" : "outline"}
                  className="flex-1 rounded-none"
                  onClick={() => setMode("join")}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Join
                </Button>
                <Button
                  type="button"
                  variant={mode === "create" ? "default" : "outline"}
                  className="flex-1 rounded-none"
                  onClick={() => setMode("create")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>

              {mode === "join" ? (
                <form onSubmit={handleJoinSociety} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Society Code</Label>
                    <Input
                      data-testid="join-code-input"
                      type="text"
                      placeholder="e.g., ABC123"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="rounded-none font-mono text-lg tracking-widest text-center uppercase"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  <Button
                    data-testid="join-button"
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-none uppercase font-bold tracking-widest py-5"
                  >
                    {loading ? "Joining..." : "Join Society"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleCreateSociety} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Society Name</Label>
                    <Input
                      data-testid="society-name-input"
                      type="text"
                      placeholder="e.g., Newport Golf Society"
                      value={societyName}
                      onChange={(e) => setSocietyName(e.target.value)}
                      className="rounded-none"
                      autoFocus
                    />
                  </div>
                  <Button
                    data-testid="create-button"
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-none uppercase font-bold tracking-widest py-5"
                  >
                    {loading ? "Creating..." : "Create Society"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    You'll receive a code to share with members
                  </p>
                </form>
              )}

              <Button
                variant="ghost"
                className="w-full mt-4 text-muted-foreground"
                onClick={() => {
                  setNeedsCode(false);
                  setUsername("");
                }}
              >
                ← Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // New User registration flow
  if (isNewUser) {
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
              Create your account
            </p>
          </div>
        </div>

        {/* New User Form */}
        <div className="flex-1 flex items-center justify-center p-4 bg-secondary/30">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold uppercase tracking-tight">
                New Player
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Choose a name to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleNewUserCheck} className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input
                    data-testid="new-username-input"
                    type="text"
                    placeholder="e.g., Phil G"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="rounded-none"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be your display name in competitions
                  </p>
                </div>
                <Button
                  data-testid="check-name-button"
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-none uppercase font-bold tracking-widest py-5"
                >
                  {loading ? "Checking..." : "Continue"}
                </Button>
              </form>

              <Button
                variant="ghost"
                className="w-full mt-4 text-muted-foreground"
                onClick={() => {
                  setIsNewUser(false);
                  setUsername("");
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
            Track scores. Compete. Win.
          </p>
        </div>
      </div>

      {/* Login Section */}
      <div className="flex-1 flex items-center justify-center p-4 bg-secondary/30">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold uppercase tracking-tight">
              Welcome
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Sign in to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Returning User Section */}
            <div className="space-y-3">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input
                    data-testid="username-input"
                    type="text"
                    placeholder="e.g., Phil G"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="rounded-none"
                    autoFocus
                  />
                </div>
                <Button
                  data-testid="login-button"
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-none uppercase font-bold tracking-widest py-5"
                >
                  {loading ? "Loading..." : "Sign In"}
                </Button>
              </form>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* New User Button */}
            <Button
              data-testid="new-user-button"
              type="button"
              variant="outline"
              onClick={() => setIsNewUser(true)}
              className="w-full rounded-none py-5"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              I'm a New Player
            </Button>
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
