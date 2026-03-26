import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, useUser } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  Trophy,
  Users,
  Flag,
  CalendarIcon,
  MoreVertical,
  Trash2,
  Play,
  CheckCircle,
  ChevronRight,
  Medal,
  Check,
  X,
} from "lucide-react";

export default function CompetitionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const [competition, setCompetition] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddRoundDialog, setShowAddRoundDialog] = useState(false);
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newRound, setNewRound] = useState({ 
    name: "", 
    course_name: "",
    tee: "White",
    slope_rating: 113,
    course_par: 72 
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [compRes, roundsRes, leaderboardRes, playersRes] = await Promise.all([
        axios.get(`${API}/competitions/${id}`),
        axios.get(`${API}/rounds?competition_id=${id}`),
        axios.get(`${API}/leaderboard/${id}`),
        axios.get(`${API}/players`),
      ]);
      setCompetition(compRes.data);
      setRounds(roundsRes.data);
      setLeaderboard(leaderboardRes.data);
      setAllPlayers(playersRes.data);
    } catch (error) {
      toast.error("Failed to load competition");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRound = async () => {
    const roundNumber = rounds.length + 1;
    const roundName = newRound.name || `Round ${roundNumber}`;

    try {
      await axios.post(`${API}/rounds`, {
        competition_id: id,
        round_number: roundNumber,
        name: roundName,
        date: format(selectedDate, "yyyy-MM-dd"),
        course_name: newRound.course_name,
        tee: newRound.tee,
        slope_rating: newRound.slope_rating,
        course_par: newRound.course_par,
      });
      toast.success("Round added!");
      setShowAddRoundDialog(false);
      setNewRound({ name: "", course_name: "", tee: "White", slope_rating: 113, course_par: 72 });
      fetchData();
    } catch (error) {
      toast.error("Failed to add round");
    }
  };

  const handleDeleteRound = async (roundId) => {
    if (!window.confirm("Delete this round and all scores?")) return;

    try {
      await axios.delete(`${API}/rounds/${roundId}`);
      toast.success("Round deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete round");
    }
  };

  const handleAddPlayerToCompetition = async (playerId) => {
    try {
      await axios.post(`${API}/competitions/${id}/players/${playerId}`);
      toast.success("Player added to competition");
      fetchData();
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to add player");
      }
    }
  };

  const handleRemovePlayerFromCompetition = async (playerId) => {
    try {
      await axios.delete(`${API}/competitions/${id}/players/${playerId}`);
      toast.success("Player removed from competition");
      fetchData();
    } catch (error) {
      toast.error("Failed to remove player");
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await axios.put(`${API}/competitions/${id}`, { status });
      toast.success(`Competition ${status}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getCompetitionPlayers = () => {
    if (!competition) return [];
    return allPlayers.filter((p) => competition.player_ids?.includes(p.id));
  };

  const getAvailablePlayers = () => {
    if (!competition) return [];
    return allPlayers.filter(
      (p) => !competition.player_ids?.includes(p.id) && p.is_active
    );
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

  const getMedalIcon = (position) => {
    if (position === 0) return <Medal className="w-5 h-5 text-[#D4AF37]" />;
    if (position === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!competition) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="golf-header text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Button
                data-testid="back-btn"
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="text-white hover:bg-white/10 p-2"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold uppercase tracking-tight">
                    {competition.name}
                  </h1>
                  <Badge className={`${getStatusColor(competition.status)} uppercase text-xs font-bold`}>
                    {competition.status}
                  </Badge>
                </div>
                {competition.description && (
                  <p className="text-white/70">{competition.description}</p>
                )}
                {(competition.start_date || competition.end_date) && (
                  <p className="text-white/60 text-sm mt-1 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {competition.start_date && new Date(competition.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {competition.start_date && competition.end_date && " - "}
                    {competition.end_date && new Date(competition.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">Min {competition.min_rounds || 13} rounds</span>
                  </p>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-testid="competition-menu-btn"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {competition.status === "upcoming" && (
                  <DropdownMenuItem
                    data-testid="start-competition-btn"
                    onClick={() => handleUpdateStatus("active")}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Competition
                  </DropdownMenuItem>
                )}
                {competition.status === "active" && (
                  <DropdownMenuItem
                    data-testid="complete-competition-btn"
                    onClick={() => handleUpdateStatus("completed")}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  data-testid="delete-competition-btn"
                  className="text-destructive"
                  onClick={async () => {
                    if (window.confirm("Delete this competition?")) {
                      try {
                        await axios.delete(`${API}/competitions/${id}`);
                        toast.success("Competition deleted");
                        navigate("/dashboard");
                      } catch {
                        toast.error("Failed to delete");
                      }
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Competition
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="bg-secondary rounded-none">
            <TabsTrigger
              data-testid="tab-leaderboard"
              value="leaderboard"
              className="rounded-none uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-rounds"
              value="rounds"
              className="rounded-none uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Flag className="w-4 h-4 mr-2" />
              Rounds
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-players"
              value="players"
              className="rounded-none uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="w-4 h-4 mr-2" />
              Players
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="relative overflow-hidden border-0 shadow-xl">
              {/* The Open Style Header */}
              <div className="bg-[#1a1a1a] text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-[#D4AF37]" />
                    <div>
                      <h2 className="text-2xl font-bold uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {competition.name}
                      </h2>
                      <p className="text-sm text-gray-400 uppercase tracking-widest">Leaderboard</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Rounds Played</p>
                    <p className="text-2xl font-bold text-[#D4AF37]">{rounds.length}</p>
                  </div>
                </div>
              </div>
              
              {/* Column Headers - The Open Style */}
              <div className="bg-[#2d2d2d] text-white px-6 py-3 grid grid-cols-12 gap-2 items-center text-xs uppercase tracking-wider font-semibold">
                <div className="col-span-1 text-center">Pos</div>
                <div className="col-span-2">Player</div>
                <div className="col-span-1 text-center">Hcp</div>
                <div className="col-span-1 text-center">Played</div>
                <div className="col-span-1 text-center text-green-400">Qual</div>
                <div className="col-span-3 text-center">Recent Pts</div>
                <div className="col-span-1 text-center">Total Pts</div>
                <div className="col-span-2 text-center text-[#D4AF37]">Avg Pts</div>
              </div>

              <CardContent className="p-0">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-[#f5f5dc]">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No scores yet. Add rounds and enter scores to see the leaderboard.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {leaderboard.map((entry, index) => {
                      const isLeader = index === 0 && entry.qualified;
                      const isTop3 = index < 3 && entry.qualified;
                      const minRounds = competition.min_rounds || 13;
                      const recentScores = entry.round_scores.filter(s => s >= 0).slice(-5);
                      return (
                        <div
                          key={entry.player_id}
                          data-testid={`leaderboard-row-${entry.player_id}`}
                          className={`grid grid-cols-12 gap-2 items-center px-6 py-4 transition-colors ${
                            isLeader 
                              ? 'bg-[#D4AF37]/20 border-l-4 border-l-[#D4AF37]' 
                              : isTop3 
                                ? 'bg-[#f5f5dc]' 
                                : entry.qualified 
                                  ? 'bg-white hover:bg-gray-50'
                                  : 'bg-gray-100 opacity-70'
                          }`}
                        >
                          {/* Position */}
                          <div className="col-span-1 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                              isLeader 
                                ? 'bg-[#D4AF37] text-black' 
                                : isTop3 
                                  ? 'bg-[#1a1a1a] text-white' 
                                  : entry.qualified
                                    ? 'bg-gray-200 text-gray-700'
                                    : 'bg-gray-300 text-gray-500'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                          
                          {/* Player Name & Team */}
                          <div className="col-span-2 flex items-center gap-2">
                            {entry.player_team_logo ? (
                              <img src={entry.player_team_logo} alt="Team" className="w-6 h-6 object-contain" />
                            ) : (
                              <div className="w-6 h-6" />
                            )}
                            <span className={`font-semibold uppercase tracking-wide ${isLeader ? 'text-lg' : ''} ${!entry.qualified ? 'text-gray-500' : ''}`}>
                              {entry.player_username}
                            </span>
                          </div>
                          
                          {/* Handicap */}
                          <div className="col-span-1 text-center font-mono text-sm text-gray-500">
                            {entry.player_handicap.toFixed(1)}
                          </div>
                          
                          {/* Rounds Played */}
                          <div className="col-span-1 text-center">
                            <span className={`font-mono font-bold ${entry.rounds_played >= minRounds ? 'text-green-600' : 'text-orange-500'}`}>
                              {entry.rounds_played}/{minRounds}
                            </span>
                          </div>
                          
                          {/* Qualified Status */}
                          <div className="col-span-1 text-center">
                            {entry.qualified ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white">
                                <Check className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 text-gray-500">
                                <X className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                          
                          {/* Recent Round Scores - Stableford Points */}
                          <div className="col-span-3 flex items-center justify-center gap-1">
                            {recentScores.length > 0 ? recentScores.map((score, idx) => (
                              <span key={idx} className="inline-flex items-center justify-center w-9 h-8 rounded bg-[#1a1a1a] text-white text-center font-mono text-sm font-bold">
                                {score}
                              </span>
                            )) : (
                              <span className="text-gray-400 text-sm">No rounds</span>
                            )}
                          </div>
                          
                          {/* Total Points */}
                          <div className="col-span-1 text-center font-mono font-bold text-lg">
                            {entry.total_stableford}
                          </div>
                          
                          {/* Average Points - Highlighted */}
                          <div className="col-span-2 text-center">
                            <span className={`inline-block px-4 py-1 rounded font-mono font-bold text-lg ${
                              isLeader 
                                ? 'bg-[#D4AF37] text-black' 
                                : entry.qualified
                                  ? 'bg-[#1a1a1a] text-[#D4AF37]'
                                  : 'bg-gray-400 text-white'
                            }`}>
                              {entry.average_stableford.toFixed(1)} <span className="text-xs font-normal">pts</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              
              {/* Footer */}
              <div className="bg-[#1a1a1a] text-white px-6 py-3 flex justify-between items-center text-xs uppercase tracking-wider">
                <span className="text-gray-400">Stableford Points</span>
                <span className="text-[#D4AF37]">{competition.num_holes} Holes</span>
              </div>
            </Card>
          </TabsContent>

          {/* Rounds Tab */}
          <TabsContent value="rounds">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold uppercase tracking-tight">Rounds</h2>
              <Dialog open={showAddRoundDialog} onOpenChange={setShowAddRoundDialog}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="add-round-btn"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-widest"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Round
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold uppercase tracking-tight">
                      Add Round
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Round Name (Optional)</Label>
                      <Input
                        data-testid="round-name-input"
                        value={newRound.name}
                        onChange={(e) => setNewRound({ ...newRound, name: e.target.value })}
                        placeholder={`Round ${rounds.length + 1}`}
                        className="border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Course Name</Label>
                      <Input
                        data-testid="course-name-input"
                        value={newRound.course_name}
                        onChange={(e) => setNewRound({ ...newRound, course_name: e.target.value })}
                        placeholder="e.g., Royal Portrush"
                        className="border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tee</Label>
                        <Select
                          value={newRound.tee}
                          onValueChange={(val) => setNewRound({ ...newRound, tee: val })}
                        >
                          <SelectTrigger data-testid="tee-select" className="rounded-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Black">Black</SelectItem>
                            <SelectItem value="Blue">Blue</SelectItem>
                            <SelectItem value="White">White</SelectItem>
                            <SelectItem value="Yellow">Yellow</SelectItem>
                            <SelectItem value="Red">Red</SelectItem>
                            <SelectItem value="Green">Green</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Slope Rating</Label>
                        <Input
                          data-testid="slope-rating-input"
                          type="number"
                          min="55"
                          max="155"
                          value={newRound.slope_rating}
                          onChange={(e) => setNewRound({ ...newRound, slope_rating: parseInt(e.target.value) || 113 })}
                          className="border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            data-testid="round-date-btn"
                            variant="outline"
                            className="w-full justify-start text-left font-normal rounded-none"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(selectedDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Course Par</Label>
                      <Select
                        value={newRound.course_par.toString()}
                        onValueChange={(val) => setNewRound({ ...newRound, course_par: parseInt(val) })}
                      >
                        <SelectTrigger data-testid="course-par-select" className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="70">70</SelectItem>
                          <SelectItem value="71">71</SelectItem>
                          <SelectItem value="72">72</SelectItem>
                          <SelectItem value="73">73</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-testid="submit-round-btn"
                      onClick={handleAddRound}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-widest"
                    >
                      Add Round
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {rounds.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Flag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No rounds yet. Add your first round!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rounds
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((round) => (
                    <RoundCard
                      key={round.id}
                      round={round}
                      competition={competition}
                      players={getCompetitionPlayers()}
                      onDelete={() => handleDeleteRound(round.id)}
                      onRefresh={fetchData}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold uppercase tracking-tight">
                Competition Players ({getCompetitionPlayers().length})
              </h2>
              <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="add-player-to-comp-btn"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-widest"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Player
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold uppercase tracking-tight">
                      Add Player to Competition
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    {getAvailablePlayers().length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No available players. All active players are in this competition.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {getAvailablePlayers().map((player) => (
                          <Button
                            key={player.id}
                            data-testid={`add-comp-player-${player.id}`}
                            variant="outline"
                            className="w-full justify-between rounded-none"
                            onClick={() => {
                              handleAddPlayerToCompetition(player.id);
                              setShowAddPlayerDialog(false);
                            }}
                          >
                            <span>{player.username}</span>
                            <span className="font-mono text-muted-foreground">
                              HCP {player.handicap.toFixed(1)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {getCompetitionPlayers().length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No players in this competition yet.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="uppercase text-xs tracking-wider">Player</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider text-center">Handicap</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCompetitionPlayers().map((player) => (
                      <TableRow key={player.id} data-testid={`comp-player-row-${player.id}`}>
                        <TableCell className="font-medium">{player.username}</TableCell>
                        <TableCell className="text-center font-mono">
                          {player.handicap.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            data-testid={`remove-comp-player-${player.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePlayerFromCompetition(player.id)}
                            className="hover:bg-destructive/10 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Round Card Component
function RoundCard({ round, competition, players, onDelete, onRefresh }) {
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(true);

  useEffect(() => {
    fetchScores();
  }, [round.id]);

  const fetchScores = async () => {
    try {
      const response = await axios.get(`${API}/scores?round_id=${round.id}`);
      setScores(response.data);
    } catch (error) {
      console.error("Failed to load scores");
    } finally {
      setLoadingScores(false);
    }
  };

  const handleCreateScore = async (playerId) => {
    try {
      await axios.post(`${API}/scores`, {
        round_id: round.id,
        player_id: playerId,
      });
      fetchScores();
    } catch (error) {
      if (error.response?.data?.detail?.includes("already exists")) {
        // Score exists, navigate to it
        const existingScore = scores.find((s) => s.player_id === playerId);
        if (existingScore) {
          navigate(`/score/${round.id}/${playerId}`);
        }
      }
    }
  };

  const getPlayerScore = (playerId) => {
    return scores.find((s) => s.player_id === playerId);
  };

  return (
    <Card className="border-l-4 border-l-primary" data-testid={`round-card-${round.id}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold uppercase tracking-tight">
              {round.name || `Round ${round.round_number}`}
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <CalendarIcon className="w-4 h-4" />
              {round.date}
            </p>
            {round.course_name && (
              <p className="text-sm font-medium mt-1">
                {round.course_name}
                {round.tee && <span className="text-muted-foreground"> • {round.tee} Tees</span>}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Par {round.course_par}
              {round.slope_rating && <span> • Slope {round.slope_rating}</span>}
            </p>
          </div>
          <Button
            data-testid={`delete-round-${round.id}`}
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="hover:bg-destructive/90"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Add players to the competition to enter scores.
          </p>
        ) : (
          <div className="space-y-2">
            {players.map((player) => {
              const playerScore = getPlayerScore(player.id);
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{player.username}</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      HCP {player.handicap.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {playerScore ? (
                      <>
                        <span className="font-mono text-xl font-bold text-primary">
                          {playerScore.total_stableford} pts
                        </span>
                        <Button
                          data-testid={`edit-score-${round.id}-${player.id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/score/${round.id}/${player.id}`)}
                          className="rounded-none"
                        >
                          Edit
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        data-testid={`enter-score-${round.id}-${player.id}`}
                        size="sm"
                        onClick={() => {
                          handleCreateScore(player.id);
                          navigate(`/score/${round.id}/${player.id}`);
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase text-xs tracking-wider"
                      >
                        Enter Score
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
