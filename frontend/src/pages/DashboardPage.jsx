import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useUser } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trophy, Users, LogOut, Flag, Calendar, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCompetition, setNewCompetition] = useState({
    name: "",
    description: "",
    num_holes: 18,
  });

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const response = await axios.get(`${API}/competitions`);
      setCompetitions(response.data);
    } catch (error) {
      toast.error("Failed to load competitions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompetition = async () => {
    if (!newCompetition.name.trim()) {
      toast.error("Please enter a competition name");
      return;
    }

    try {
      await axios.post(`${API}/competitions`, newCompetition);
      toast.success("Competition created!");
      setShowCreateDialog(false);
      setNewCompetition({ name: "", description: "", num_holes: 18 });
      fetchCompetitions();
    } catch (error) {
      toast.error("Failed to create competition");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500 text-white";
      case "completed":
        return "bg-gray-500 text-white";
      default:
        return "bg-[#D4AF37] text-black";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="golf-header text-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Flag className="w-8 h-8 text-[#D4AF37]" />
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight">Golf Stableford</h1>
              <p className="text-white/70 text-sm">Welcome, {user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="players-nav-btn"
              variant="ghost"
              onClick={() => navigate("/players")}
              className="text-white hover:bg-white/10"
            >
              <Users className="w-5 h-5 mr-2" />
              Players
            </Button>
            <Button
              data-testid="logout-btn"
              variant="ghost"
              onClick={logout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Competitions</p>
                  <p className="text-4xl font-mono font-bold">{competitions.length}</p>
                </div>
                <Trophy className="w-10 h-10 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-[#D4AF37]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Active</p>
                  <p className="text-4xl font-mono font-bold">
                    {competitions.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <Flag className="w-10 h-10 text-[#D4AF37]/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Completed</p>
                  <p className="text-4xl font-mono font-bold">
                    {competitions.filter((c) => c.status === "completed").length}
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Competitions Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold uppercase tracking-tight">Competitions</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                data-testid="create-competition-btn"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-widest"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Competition
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold uppercase tracking-tight">
                  Create Competition
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Competition Name</Label>
                  <Input
                    data-testid="competition-name-input"
                    id="name"
                    value={newCompetition.name}
                    onChange={(e) => setNewCompetition({ ...newCompetition, name: e.target.value })}
                    placeholder="Summer Championship"
                    className="border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    data-testid="competition-description-input"
                    id="description"
                    value={newCompetition.description}
                    onChange={(e) => setNewCompetition({ ...newCompetition, description: e.target.value })}
                    placeholder="Annual club championship..."
                    className="border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holes">Number of Holes</Label>
                  <Select
                    value={newCompetition.num_holes.toString()}
                    onValueChange={(val) => setNewCompetition({ ...newCompetition, num_holes: parseInt(val) })}
                  >
                    <SelectTrigger data-testid="holes-select" className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">9 Holes</SelectItem>
                      <SelectItem value="18">18 Holes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  data-testid="submit-competition-btn"
                  onClick={handleCreateCompetition}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-widest"
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Competition Cards */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : competitions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No competitions yet. Create your first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((competition) => (
              <Card
                key={competition.id}
                data-testid={`competition-card-${competition.id}`}
                className="hover-lift cursor-pointer border-l-4 border-l-primary group"
                onClick={() => navigate(`/competition/${competition.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold uppercase tracking-tight">
                      {competition.name}
                    </CardTitle>
                    <Badge className={`${getStatusColor(competition.status)} uppercase text-xs font-bold`}>
                      {competition.status}
                    </Badge>
                  </div>
                  {competition.description && (
                    <CardDescription className="line-clamp-2">
                      {competition.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Flag className="w-4 h-4" />
                        {competition.num_holes} holes
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {competition.player_ids?.length || 0} players
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
