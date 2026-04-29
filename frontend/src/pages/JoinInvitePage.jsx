import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useUser } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Building2, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function JoinInvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, login } = useUser();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchInvite();
  }, [code]);

  const fetchInvite = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API}/invites/${code}`);
      setInvite(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("This invite link is invalid or no longer exists.");
      } else if (err.response?.status === 410) {
        setError("This invite link has expired.");
      } else {
        setError("Failed to load invite details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setJoining(true);
    try {
      // Join via invite link
      const response = await axios.post(`${API}/invites/${code}/join?username=${encodeURIComponent(username.trim())}`);
      const player = response.data;
      
      // Log in with the returned player
      await login(player.username, player.society_id);
      
      toast.success(`Welcome to ${invite.society_name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to join society");
    } finally {
      setJoining(false);
    }
  };

  // Format expiration date
  const formatExpiry = (isoDate) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      return "Expires soon";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Invite Not Valid</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is already logged in, show option to join with existing account
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{invite.society_name}</CardTitle>
            <CardDescription>You've been invited to join this golf society</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {invite.member_count} member{invite.member_count !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatExpiry(invite.expires_at)}
              </span>
            </div>

            <div className="bg-secondary/50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Logged in as</p>
              <p className="font-medium">{user.username}</p>
            </div>

            <Button
              className="w-full"
              onClick={async () => {
                setJoining(true);
                try {
                  await axios.post(`${API}/invites/${code}/join?username=${encodeURIComponent(user.username)}`);
                  await login(user.username, invite.society_id);
                  toast.success(`Welcome to ${invite.society_name}!`);
                  navigate("/dashboard");
                } catch (err) {
                  toast.error(err.response?.data?.detail || "Failed to join");
                } finally {
                  setJoining(false);
                }
              }}
              disabled={joining}
            >
              {joining ? "Joining..." : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Join as {user.username}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{invite.society_name}</CardTitle>
          <CardDescription>You've been invited to join this golf society</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {invite.member_count} member{invite.member_count !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatExpiry(invite.expires_at)}
            </span>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Your Name</Label>
              <Input
                id="username"
                placeholder="e.g., Phil G"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={joining}
                data-testid="join-username-input"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={joining}
              data-testid="join-society-btn"
            >
              {joining ? "Joining..." : "Join Society"}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            By joining, you'll be able to participate in competitions and track your handicap with this society.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
