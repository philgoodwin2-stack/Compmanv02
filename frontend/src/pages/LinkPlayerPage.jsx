import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Flag, User, Search, CheckCircle, Plus, Link as LinkIcon } from "lucide-react";
import axios from "axios";

export default function LinkPlayerPage() {
  const navigate = useNavigate();
  const { authUser, linkPlayer, createAndLinkPlayer } = useUser();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState("link"); // "link" or "create"
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerHandicap, setNewPlayerHandicap] = useState("18.0");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    fetchAvailablePlayers();
  }, []);

  const fetchAvailablePlayers = async () => {
    try {
      const response = await axios.get(`${API}/auth/available-players`);
      setPlayers(response.data);
    } catch (error) {
      console.error("Failed to fetch players:", error);
      toast.error("Failed to load available players");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPlayer = async (playerId) => {
    setLinking(true);
    try {
      await linkPlayer(playerId);
      toast.success("Player profile linked successfully!");
      // Navigate to dashboard after successful linking
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to link player";
      toast.error(message);
    } finally {
      setLinking(false);
    }
  };

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      toast.error("Please enter a player name");
      return;
    }
    if (!joinCode.trim()) {
      toast.error("Please enter a society join code");
      return;
    }

    setLinking(true);
    try {
      await createAndLinkPlayer(newPlayerName.trim(), parseFloat(newPlayerHandicap) || 18.0, joinCode.trim().toUpperCase());
      toast.success("Player created and linked successfully!");
      // Navigate to dashboard after successful creation and linking
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to create player";
      toast.error(message);
    } finally {
      setLinking(false);
    }
  };

  const filteredPlayers = players.filter(p => 
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Link Your Profile
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-light">
            Welcome, {authUser?.name}!
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-4 bg-secondary/30">
        <div className="max-w-2xl mx-auto">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              type="button"
              variant={mode === "link" ? "default" : "outline"}
              className="flex-1 rounded-none"
              onClick={() => setMode("link")}
              data-testid="link-existing-tab"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Link Existing Player
            </Button>
            <Button
              type="button"
              variant={mode === "create" ? "default" : "outline"}
              className="flex-1 rounded-none"
              onClick={() => setMode("create")}
              data-testid="create-new-tab"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Player
            </Button>
          </div>

          {mode === "link" ? (
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold uppercase tracking-tight">
                  Select Your Player Profile
                </CardTitle>
                <CardDescription>
                  Link your account to an existing player in your society
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    data-testid="player-search-input"
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-none pl-10"
                  />
                </div>

                {/* Player List */}
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading available players...
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "No players match your search" : "No available players to link"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try creating a new player profile instead
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 border rounded-none hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{player.username}</p>
                            <p className="text-sm text-muted-foreground">
                              Handicap: {player.handicap?.toFixed(1) || "N/A"}
                            </p>
                          </div>
                        </div>
                        <Button
                          data-testid={`link-player-${player.id}`}
                          size="sm"
                          variant="outline"
                          className="rounded-none"
                          onClick={() => handleLinkPlayer(player.id)}
                          disabled={linking}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Link
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold uppercase tracking-tight">
                  Create New Player
                </CardTitle>
                <CardDescription>
                  Join a society and create your player profile
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleCreatePlayer} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Society Join Code</label>
                    <Input
                      data-testid="society-join-code-input"
                      type="text"
                      placeholder="e.g., ABC123"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="rounded-none font-mono text-lg tracking-widest text-center uppercase"
                      maxLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get this code from your society admin
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Player Name</label>
                    <Input
                      data-testid="new-player-name-input"
                      type="text"
                      placeholder="e.g., Phil G"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Starting Handicap</label>
                    <Input
                      data-testid="new-player-handicap-input"
                      type="number"
                      step="0.1"
                      min="0"
                      max="54"
                      placeholder="18.0"
                      value={newPlayerHandicap}
                      onChange={(e) => setNewPlayerHandicap(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                  <Button
                    data-testid="create-player-submit"
                    type="submit"
                    disabled={linking}
                    className="w-full rounded-none uppercase font-bold tracking-widest py-5"
                  >
                    {linking ? "Creating..." : "Create & Link Player"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
