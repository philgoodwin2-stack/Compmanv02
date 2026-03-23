import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useUser } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Users, Flag } from "lucide-react";

// Sports team logos - popular teams
const TEAM_LOGOS = [
  { name: "None", logo: "" },
  { name: "Man United", logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg" },
  { name: "Liverpool", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" },
  { name: "Chelsea", logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" },
  { name: "Arsenal", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" },
  { name: "Man City", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" },
  { name: "Tottenham", logo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg" },
  { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" },
  { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" },
  { name: "Bayern Munich", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg" },
  { name: "PSG", logo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg" },
  { name: "Juventus", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Juventus_FC_-_pictogram.svg" },
  { name: "AC Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg" },
  { name: "Inter Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg" },
  { name: "Borussia Dortmund", logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg" },
  { name: "Ajax", logo: "https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg" },
  { name: "Celtic", logo: "https://upload.wikimedia.org/wikipedia/en/3/35/Celtic_FC.svg" },
  { name: "Rangers", logo: "https://upload.wikimedia.org/wikipedia/en/4/43/Rangers_FC.svg" },
];

export default function PlayersPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [newPlayer, setNewPlayer] = useState({ username: "", handicap: 18, team_logo: "" });

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${API}/players`);
      setPlayers(response.data);
    } catch (error) {
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    try {
      await axios.post(`${API}/players`, newPlayer);
      toast.success("Player added!");
      setShowAddDialog(false);
      setNewPlayer({ username: "", handicap: 18, team_logo: "" });
      fetchPlayers();
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to add player");
      }
    }
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;

    try {
      await axios.put(`${API}/players/${editingPlayer.id}`, {
        username: editingPlayer.username,
        handicap: editingPlayer.handicap,
        is_active: editingPlayer.is_active,
        team_logo: editingPlayer.team_logo,
      });
      toast.success("Player updated!");
      setShowEditDialog(false);
      setEditingPlayer(null);
      fetchPlayers();
    } catch (error) {
      toast.error("Failed to update player");
    }
  };

  const handleToggleActive = async (player) => {
    try {
      await axios.put(`${API}/players/${player.id}`, {
        is_active: !player.is_active,
      });
      toast.success(`Player ${!player.is_active ? "included" : "excluded"}`);
      fetchPlayers();
    } catch (error) {
      toast.error("Failed to update player");
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm("Are you sure you want to delete this player?")) return;

    try {
      await axios.delete(`${API}/players/${playerId}`);
      toast.success("Player deleted");
      fetchPlayers();
    } catch (error) {
      toast.error("Failed to delete player");
    }
  };

  const openEditDialog = (player) => {
    setEditingPlayer({ ...player });
    setShowEditDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="golf-header text-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              data-testid="back-btn"
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-[#D4AF37]" />
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight">Players</h1>
                <p className="text-white/70 text-sm">Manage handicaps and status</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Players</p>
                  <p className="text-4xl font-mono font-bold">{players.length}</p>
                </div>
                <Users className="w-10 h-10 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Active Players</p>
                  <p className="text-4xl font-mono font-bold">
                    {players.filter((p) => p.is_active).length}
                  </p>
                </div>
                <Flag className="w-10 h-10 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold uppercase tracking-tight">All Players</h2>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-player-btn"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-widest"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold uppercase tracking-tight">
                  Add Player
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Player Name</Label>
                  <Input
                    data-testid="new-player-name-input"
                    id="username"
                    value={newPlayer.username}
                    onChange={(e) => setNewPlayer({ ...newPlayer, username: e.target.value })}
                    placeholder="John Smith"
                    className="border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handicap">Handicap</Label>
                  <Input
                    data-testid="new-player-handicap-input"
                    id="handicap"
                    type="number"
                    step="0.1"
                    min="0"
                    max="54"
                    value={newPlayer.handicap}
                    onChange={(e) => setNewPlayer({ ...newPlayer, handicap: parseFloat(e.target.value) || 0 })}
                    className="border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Team Logo</Label>
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 border rounded">
                    {TEAM_LOGOS.map((team) => (
                      <button
                        key={team.name}
                        type="button"
                        onClick={() => setNewPlayer({ ...newPlayer, team_logo: team.logo })}
                        className={`w-10 h-10 p-1 rounded border-2 transition-all ${
                          newPlayer.team_logo === team.logo ? 'border-primary bg-primary/10' : 'border-transparent hover:border-muted'
                        }`}
                        title={team.name}
                      >
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-muted rounded flex items-center justify-center text-xs">✕</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  data-testid="submit-new-player-btn"
                  onClick={handleAddPlayer}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-widest"
                >
                  Add Player
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Players Table */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : players.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No players yet. Add your first player!</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="uppercase text-xs tracking-wider w-12">Team</TableHead>
                  <TableHead className="uppercase text-xs tracking-wider">Player</TableHead>
                  <TableHead className="uppercase text-xs tracking-wider">Handicap</TableHead>
                  <TableHead className="uppercase text-xs tracking-wider text-center">Status</TableHead>
                  <TableHead className="uppercase text-xs tracking-wider text-center">Include</TableHead>
                  <TableHead className="uppercase text-xs tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id} data-testid={`player-row-${player.id}`}>
                    <TableCell>
                      {player.team_logo ? (
                        <img src={player.team_logo} alt="Team" className="w-8 h-8 object-contain" />
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded-full" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{player.username}</TableCell>
                    <TableCell>
                      <span className="font-mono text-lg">{player.handicap.toFixed(1)}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          player.is_active
                            ? "bg-green-500 text-white"
                            : "bg-gray-400 text-white"
                        }
                      >
                        {player.is_active ? "Active" : "Excluded"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        data-testid={`toggle-player-${player.id}`}
                        checked={player.is_active}
                        onCheckedChange={() => handleToggleActive(player)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          data-testid={`edit-player-${player.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(player)}
                          className="hover:bg-primary/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          data-testid={`delete-player-${player.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlayer(player.id)}
                          className="hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold uppercase tracking-tight">
                Edit Player
              </DialogTitle>
            </DialogHeader>
            {editingPlayer && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Player Name</Label>
                  <Input
                    data-testid="edit-player-name-input"
                    id="edit-username"
                    value={editingPlayer.username}
                    onChange={(e) =>
                      setEditingPlayer({ ...editingPlayer, username: e.target.value })
                    }
                    className="border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-handicap">Handicap</Label>
                  <Input
                    data-testid="edit-player-handicap-input"
                    id="edit-handicap"
                    type="number"
                    step="0.1"
                    min="0"
                    max="54"
                    value={editingPlayer.handicap}
                    onChange={(e) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        handicap: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Team Logo</Label>
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 border rounded">
                    {TEAM_LOGOS.map((team) => (
                      <button
                        key={team.name}
                        type="button"
                        onClick={() => setEditingPlayer({ ...editingPlayer, team_logo: team.logo })}
                        className={`w-10 h-10 p-1 rounded border-2 transition-all ${
                          editingPlayer.team_logo === team.logo ? 'border-primary bg-primary/10' : 'border-transparent hover:border-muted'
                        }`}
                        title={team.name}
                      >
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-muted rounded flex items-center justify-center text-xs">✕</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                data-testid="submit-edit-player-btn"
                onClick={handleUpdatePlayer}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-widest"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
