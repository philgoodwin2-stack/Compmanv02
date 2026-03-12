import { useState } from "react";
import { useUser } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Flag, Trophy, Users } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setLoading(true);
    try {
      const result = await login(username.trim());
      toast.success(result.message);
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="golf-header text-white py-16 px-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 p-4 rounded-full">
              <Flag className="w-12 h-12 text-[#D4AF37]" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight uppercase mb-4">
            Stableford Golf
          </h1>
          <p className="text-xl md:text-2xl text-white/80 font-light">
            Track scores. Compete. Win.
          </p>
        </div>
      </div>

      {/* Login Section */}
      <div className="flex-1 flex items-center justify-center p-6 bg-secondary/30">
        <Card className="w-full max-w-md shadow-lg border-l-4 border-l-primary">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold uppercase tracking-tight">
              Enter the Clubhouse
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Enter your name to join or create your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  data-testid="username-input"
                  type="text"
                  placeholder="Your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-lg py-6 border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
                />
              </div>
              <Button
                data-testid="login-button"
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-widest py-6 text-lg"
              >
                {loading ? "Entering..." : "Enter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold uppercase tracking-wide mb-2">Stableford Scoring</h3>
              <p className="text-muted-foreground text-sm">
                Automatic point calculation based on your handicap
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold uppercase tracking-wide mb-2">Competitions</h3>
              <p className="text-muted-foreground text-sm">
                Create and manage multi-round tournaments
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold uppercase tracking-wide mb-2">Handicap Tracking</h3>
              <p className="text-muted-foreground text-sm">
                Track and update player handicaps easily
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
