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

  const [deleteRoundId, setDeleteRoundId] = useState(null);
  const [showDeleteRoundDialog, setShowDeleteRoundDialog] = useState(false);

  const handleDeleteRound = async () => {
    if (!deleteRoundId) return;

    try {
      await axios.delete(`${API}/rounds/${deleteRoundId}`);
      toast.success("Round deleted");
      setShowDeleteRoundDialog(false);
      setDeleteRoundId(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete round");
    }
  };

  const openDeleteRoundDialog = (roundId) => {
    setDeleteRoundId(roundId);
    setShowDeleteRoundDialog(true);
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
              {/* Header */}
              <div className="bg-[#1a1a1a] text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-[#D4AF37]" />
                    <h2 className="text-xl font-bold uppercase tracking-wider">
                      {competition.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 bg-gray-500 rounded"></span>
                      <span>Round dropped</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-bold">Red</span>
                      <span>= non-counting round</span>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-0 overflow-x-auto">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No scores yet. Add rounds and enter scores to see the leaderboard.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    {/* Round numbers row */}
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-2 py-1 text-left w-10"></th>
                        <th className="px-2 py-1 text-left w-10"></th>
                        <th className="px-2 py-1 text-left w-40"></th>
                        <th className="px-2 py-1 text-center w-16 font-normal text-xs text-gray-500">Avg</th>
                        <th className="px-2 py-1 text-center w-12 font-normal text-xs text-gray-500">Played</th>
                        {rounds.sort((a, b) => new Date(a.date) - new Date(b.date)).map((round, idx) => (
                          <th key={round.id} className="px-1 py-1 text-center w-10 font-normal text-xs text-gray-500">
                            {idx + 1}
                          </th>
                        ))}
                      </tr>
                      {/* Tee row */}
                      <tr className="bg-gray-50 border-b">
                        <th className="px-2 py-1"></th>
                        <th className="px-2 py-1"></th>
                        <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600">TEE</th>
                        <th className="px-2 py-1"></th>
                        <th className="px-2 py-1"></th>
                        {rounds.sort((a, b) => new Date(a.date) - new Date(b.date)).map((round) => (
                          <th key={round.id} className="px-1 py-1 text-center text-xs font-normal text-gray-500">
                            {round.tee ? round.tee.substring(0, 2).toUpperCase() : 'WH'}
                          </th>
                        ))}
                      </tr>
                      {/* Date row */}
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="px-2 py-1"></th>
                        <th className="px-2 py-1"></th>
                        <th className="px-2 py-1"></th>
                        <th className="px-2 py-1"></th>
                        <th className="px-2 py-1"></th>
                        {rounds.sort((a, b) => new Date(a.date) - new Date(b.date)).map((round) => (
                          <th key={round.id} className="px-1 py-1 text-center text-xs font-normal text-gray-600" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '50px' }}>
                            {new Date(round.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, index) => {
                        const minRounds = competition.min_rounds || 13;
                        const isQualified = entry.rounds_played >= minRounds;
                        // Calculate which scores count (best 8 of last 20 for WHS-style)
                        const validScores = entry.round_scores.filter(s => s >= 0);
                        const sortedScores = [...validScores].sort((a, b) => b - a);
                        const countingScores = sortedScores.slice(0, 8);
                        
                        return (
                          <tr 
                            key={entry.player_id}
                            data-testid={`leaderboard-row-${entry.player_id}`}
                            className={`border-b ${index % 2 === 0 ? 'bg-blue-50/50' : 'bg-white'} hover:bg-blue-100/50`}
                          >
                            {/* Position */}
                            <td className="px-2 py-2 text-center font-bold text-gray-700">
                              {index + 1}
                            </td>
                            {/* Team Logo */}
                            <td className="px-2 py-2">
                              {entry.player_team_logo ? (
                                <img src={entry.player_team_logo} alt="Team" className="w-6 h-6 object-contain" />
                              ) : (
                                <div className="w-6 h-6" />
                              )}
                            </td>
                            {/* Player Name */}
                            <td className="px-2 py-2 font-medium">
                              {entry.player_username.split(' ').map((part, i, arr) => 
                                i === arr.length - 1 ? part.toUpperCase() : part
                              ).join(' ')}
                            </td>
                            {/* Average */}
                            <td className="px-2 py-2 text-center font-mono font-bold text-lg">
                              {entry.average_stableford.toFixed(2)}
                            </td>
                            {/* Played */}
                            <td className="px-2 py-2 text-center font-mono text-sm text-gray-600">
                              {entry.rounds_played}
                            </td>
                            {/* Round Scores */}
                            {rounds.sort((a, b) => new Date(a.date) - new Date(b.date)).map((round, idx) => {
                              const score = entry.round_scores[idx];
                              const hasScore = score !== undefined && score >= 0;
                              const isCounting = hasScore && countingScores.includes(score);
                              const isDropped = hasScore && !isCounting && validScores.length > 8;
                              
                              // Color coding based on score
                              let bgColor = '';
                              let textColor = 'text-gray-900';
                              if (hasScore) {
                                if (score >= 40) {
                                  bgColor = 'bg-green-400';
                                } else if (score >= 36) {
                                  bgColor = 'bg-green-300';
                                } else if (score >= 33) {
                                  bgColor = 'bg-yellow-200';
                                } else if (score >= 30) {
                                  bgColor = 'bg-orange-300';
                                } else if (score >= 27) {
                                  bgColor = 'bg-orange-400';
                                } else {
                                  bgColor = 'bg-gray-400';
                                  textColor = 'text-white';
                                }
                                if (isDropped) {
                                  bgColor = 'bg-gray-400';
                                  textColor = 'text-red-600';
                                }
                              }
                              
                              return (
                                <td key={round.id} className="px-0 py-1 text-center">
                                  {hasScore ? (
                                    <span className={`inline-block w-8 h-7 leading-7 text-sm font-bold rounded ${bgColor} ${textColor}`}>
                                      {score}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
              
              {/* Footer */}
              <div className="bg-[#1a1a1a] text-white px-4 py-2 flex justify-between items-center text-xs">
                <span>Min {competition.min_rounds || 13} rounds to qualify</span>
                <span className="text-[#D4AF37]">{competition.num_holes} Holes • Stableford Points</span>
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
                      onDelete={() => openDeleteRoundDialog(round.id)}
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

        {/* Delete Round Confirmation Dialog */}
        <Dialog open={showDeleteRoundDialog} onOpenChange={setShowDeleteRoundDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-destructive">
                Delete Round?
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                This will permanently delete this round and all player scores for it.
              </p>
              <p className="text-destructive font-semibold mt-2">
                This action cannot be undone.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteRoundDialog(false)}
                className="rounded-none"
              >
                Cancel
              </Button>
              <Button
                data-testid="confirm-delete-round"
                variant="destructive"
                onClick={handleDeleteRound}
                className="rounded-none"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Round
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
