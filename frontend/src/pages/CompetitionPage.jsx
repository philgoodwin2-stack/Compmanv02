import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, useUser } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  LayoutGrid,
  List,
  Share2,
  Copy,
  Download,
  CheckCircle2,
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
  const [societies, setSocieties] = useState([]);

  const [showAddRoundDialog, setShowAddRoundDialog] = useState(false);
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [leaderboardView, setLeaderboardView] = useState("detailed"); // "detailed" or "simple"
  const [courses, setCourses] = useState([]);
  const [newRound, setNewRound] = useState({ 
    name: "", 
    course_name: "",
    course_id: "",
    tee: "White",
    slope_rating: 113,
    course_rating: 72.0,
    course_par: 72 
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const societyId = user?.society_id;
      const playersUrl = societyId ? `${API}/players?society_id=${societyId}` : `${API}/players`;
      const coursesUrl = societyId ? `${API}/courses?society_id=${societyId}` : `${API}/courses`;
      
      const [compRes, roundsRes, leaderboardRes, playersRes, coursesRes, societiesRes] = await Promise.all([
        axios.get(`${API}/competitions/${id}`),
        axios.get(`${API}/rounds?competition_id=${id}`),
        axios.get(`${API}/leaderboard/${id}`),
        axios.get(playersUrl),
        axios.get(coursesUrl),
        axios.get(`${API}/societies`),
      ]);
      setCompetition(compRes.data);
      setRounds(roundsRes.data);
      setLeaderboard(leaderboardRes.data);
      setAllPlayers(playersRes.data);
      setCourses(coursesRes.data);
      setSocieties(societiesRes.data);
    } catch (error) {
      toast.error("Failed to load competition");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getSocietyName = (societyId) => {
    if (!societyId) return null;
    const society = societies.find(s => s.id === societyId);
    return society ? society.name : null;
  };

  const handleCourseSelect = (courseId) => {
    if (courseId === "manual") {
      // Manual entry - reset to defaults
      setNewRound({
        ...newRound,
        course_id: "",
        course_name: "",
        tee: "White",
        slope_rating: 113,
        course_rating: 72.0,
        course_par: 72
      });
    } else {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        setNewRound({
          ...newRound,
          course_id: course.id,
          course_name: course.name,
          tee: course.tee,
          slope_rating: course.slope_rating,
          course_rating: course.course_rating || course.total_par,
          course_par: course.total_par
        });
      }
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
        course_id: newRound.course_id || null,
        tee: newRound.tee,
        slope_rating: newRound.slope_rating,
        course_rating: newRound.course_rating,
        course_par: newRound.course_par,
      });
      toast.success("Round added!");
      setShowAddRoundDialog(false);
      setNewRound({ name: "", course_name: "", course_id: "", tee: "White", slope_rating: 113, course_rating: 72.0, course_par: 72 });
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

  const getShareUrl = () => {
    return window.location.href;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const topPlayers = leaderboard.slice(0, 3).map((e, i) => 
          `${i + 1}. ${e.player_username} - ${e.average_stableford.toFixed(1)} pts`
        ).join('\n');
        
        await navigator.share({
          title: `${competition.name} Leaderboard`,
          text: `Check out the ${competition.name} leaderboard!\n\nTop 3:\n${topPlayers}`,
          url: getShareUrl(),
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error("Failed to share");
        }
      }
    }
  };

  const generateLeaderboardText = () => {
    const header = `🏆 ${competition.name.toUpperCase()} LEADERBOARD\n`;
    const divider = '─'.repeat(35) + '\n';
    const standings = leaderboard.map((e, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      return `${medal} ${e.player_username} - ${e.average_stableford.toFixed(1)} pts (${e.rounds_played} rounds)`;
    }).join('\n');
    const footer = `\n${divider}Min ${competition.min_rounds || 13} rounds to qualify\n${getShareUrl()}`;
    
    return header + divider + standings + footer;
  };

  const handleCopyLeaderboard = async () => {
    try {
      await navigator.clipboard.writeText(generateLeaderboardText());
      toast.success("Leaderboard copied!");
      setShowShareDialog(false);
    } catch (error) {
      toast.error("Failed to copy");
    }
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
      <header className="golf-header text-white py-4 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                data-testid="back-btn"
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="text-white hover:bg-white/10 p-2 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold uppercase tracking-tight truncate">
                    {competition.name}
                  </h1>
                  <Badge className={`${getStatusColor(competition.status)} uppercase text-xs font-bold flex-shrink-0`}>
                    {competition.status}
                  </Badge>
                  {getSocietyName(competition.society_id) && (
                    <Badge variant="outline" className="text-white/80 border-white/30 text-xs flex-shrink-0">
                      {getSocietyName(competition.society_id)}
                    </Badge>
                  )}
                </div>
                <p className="text-white/60 text-xs sm:text-sm mt-1 flex items-center gap-1 flex-wrap">
                  <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">
                    {competition.start_date && new Date(competition.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {competition.start_date && competition.end_date && " - "}
                    {competition.end_date && new Date(competition.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  <span className="hidden sm:inline px-2 py-0.5 bg-white/20 rounded text-xs">Min {competition.min_rounds || 13} rounds</span>
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-testid="competition-menu-btn"
                  variant="ghost"
                  className="text-white hover:bg-white/10 p-2 flex-shrink-0"
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
          <TabsList className="bg-secondary rounded-none w-full justify-start overflow-x-auto">
            <TabsTrigger
              data-testid="tab-leaderboard"
              value="leaderboard"
              className="rounded-none uppercase tracking-wider text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-shrink-0"
            >
              <Trophy className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-rounds"
              value="rounds"
              className="rounded-none uppercase tracking-wider text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-shrink-0"
            >
              <Flag className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Rounds</span>
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-players"
              value="players"
              className="rounded-none uppercase tracking-wider text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-shrink-0"
            >
              <Users className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Players</span>
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="relative overflow-hidden border-0 shadow-2xl">
              {/* Masters-Style Header with Competition Name */}
              <div className="bg-[#006747] text-white">
                {/* Competition Name Banner */}
                <div className="text-center py-6 px-4 border-b border-[#005538]">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-wide text-[#FFF200] drop-shadow-lg uppercase">
                    {competition.name}
                  </h1>
                  <p className="text-white/80 text-sm mt-2 tracking-widest uppercase">
                    Stableford Competition
                  </p>
                </div>
                
                {/* Controls Row */}
                <div className="px-4 py-3 flex items-center justify-between bg-[#005538]">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-[#FFF200]" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Leaderboard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center bg-[#004530] rounded overflow-hidden">
                      <button
                        data-testid="view-simple-btn"
                        onClick={() => setLeaderboardView("simple")}
                        className={`px-3 py-1.5 flex items-center gap-1.5 text-xs transition-colors ${
                          leaderboardView === "simple" 
                            ? "bg-[#FFF200] text-[#006747] font-bold" 
                            : "text-white/70 hover:text-white"
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Simple</span>
                      </button>
                      <button
                        data-testid="view-detailed-btn"
                        onClick={() => setLeaderboardView("detailed")}
                        className={`px-3 py-1.5 flex items-center gap-1.5 text-xs transition-colors ${
                          leaderboardView === "detailed" 
                            ? "bg-[#FFF200] text-[#006747] font-bold" 
                            : "text-white/70 hover:text-white"
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Detailed</span>
                      </button>
                    </div>
                    
                    {/* Share Button */}
                    <button
                      data-testid="share-leaderboard-btn"
                      onClick={() => setShowShareDialog(true)}
                      className="px-3 py-1.5 flex items-center gap-1.5 text-xs bg-[#004530] rounded text-white/70 hover:text-white hover:bg-[#003825] transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>
                </div>
              </div>

              <CardContent className="p-0 overflow-x-auto">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-[#006747]/10">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30 text-[#006747]" />
                    <p>No scores yet. Add rounds and enter scores to see the leaderboard.</p>
                  </div>
                ) : leaderboardView === "simple" ? (
                  /* Masters Tournament Style Leaderboard - By Date */
                  <div className="bg-[#006747] overflow-x-auto">
                    {/* Get sorted rounds for column headers */}
                    {(() => {
                      const sortedRounds = [...rounds].sort((a, b) => new Date(a.date) - new Date(b.date));
                      
                      return (
                        <>
                          {/* Header Row with Round Dates */}
                          <div className="min-w-[600px]">
                            <div className={`grid bg-[#005538] border-b-2 border-[#FFF200]`} style={{ gridTemplateColumns: `50px 1fr 60px repeat(${sortedRounds.length}, 50px) 70px` }}>
                              <div className="px-2 py-3 text-center text-white text-xs font-bold uppercase tracking-wider">
                                Pos
                              </div>
                              <div className="px-3 py-3 text-white text-xs font-bold uppercase tracking-wider">
                                Player
                              </div>
                              <div className="px-2 py-3 text-center text-white text-xs font-bold uppercase tracking-wider">
                                Avg
                              </div>
                              {sortedRounds.map((round, idx) => (
                                <div key={round.id} className="px-1 py-3 text-center text-white text-[10px] font-bold uppercase tracking-wider">
                                  <div>{new Date(round.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                </div>
                              ))}
                              <div className="px-2 py-3 text-center text-[#FFF200] text-xs font-bold uppercase tracking-wider">
                                Total
                              </div>
                            </div>
                          
                            {/* Player Rows */}
                            {leaderboard.map((entry, index) => {
                              const isLeader = index === 0;
                              const isTop3 = index < 3;
                              
                              // Calculate position (handle ties)
                              let position = index + 1;
                              if (index > 0 && entry.total_stableford === leaderboard[index - 1].total_stableford && entry.average_stableford === leaderboard[index - 1].average_stableford) {
                                position = leaderboard.findIndex(e => e.total_stableford === entry.total_stableford && e.average_stableford === entry.average_stableford) + 1;
                              }
                              
                              return (
                                <div 
                                  key={entry.player_id}
                                  data-testid={`simple-row-${entry.player_id}`}
                                  className={`grid border-b border-[#005538] transition-all ${
                                    isLeader ? 'bg-[#FFF200]' : isTop3 ? 'bg-[#90EE90]' : 'bg-white'
                                  } hover:brightness-95`}
                                  style={{ gridTemplateColumns: `50px 1fr 60px repeat(${sortedRounds.length}, 50px) 70px` }}
                                >
                                  {/* Position */}
                                  <div className="px-2 py-3 flex items-center justify-center text-[#006747]">
                                    <span className="text-lg font-bold font-mono">
                                      {position}
                                    </span>
                                  </div>
                                  
                                  {/* Player Name */}
                                  <div className="px-3 py-3 flex items-center gap-2 min-w-0">
                                    {entry.player_team_logo && (
                                      <img 
                                        src={entry.player_team_logo} 
                                        alt="" 
                                        className="w-6 h-6 object-contain flex-shrink-0"
                                      />
                                    )}
                                    <span className={`text-sm font-bold uppercase tracking-wide truncate ${isLeader ? 'text-[#006747]' : 'text-[#1a1a1a]'}`}>
                                      {entry.player_username}
                                    </span>
                                  </div>
                                  
                                  {/* Average */}
                                  <div className="px-1 py-3 flex items-center justify-center">
                                    <span className="text-sm font-bold font-mono text-[#006747]">
                                      {entry.average_stableford.toFixed(1)}
                                    </span>
                                  </div>
                                  
                                  {/* Round Scores by Date */}
                                  {sortedRounds.map((round, roundIdx) => {
                                    const roundScore = entry.round_scores?.[roundIdx];
                                    const hasScore = roundScore !== null && roundScore !== undefined && roundScore >= 0;
                                    
                                    return (
                                      <div 
                                        key={round.id} 
                                        className={`px-1 py-3 flex items-center justify-center ${!hasScore ? 'text-gray-300' : ''}`}
                                      >
                                        <span className={`text-sm font-mono ${hasScore ? 'font-semibold text-[#1a1a1a]' : ''}`}>
                                          {hasScore ? roundScore : '-'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                  
                                  {/* Total Points */}
                                  <div className="px-2 py-3 flex items-center justify-center bg-[#006747]/10">
                                    <span className="text-lg font-bold font-mono text-[#006747]">
                                      {entry.total_stableford}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Footer */}
                          <div className="bg-[#005538] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
                            <div className="flex items-center gap-4">
                              <span>{leaderboard.length} Players</span>
                              <span>{sortedRounds.length} Rounds</span>
                              <span>Min {competition.min_rounds || 13} to qualify</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-[#FFF200] rounded"></div>
                                <span>Leader</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-[#90EE90] rounded"></div>
                                <span>Top 3</span>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  /* Detailed View - Spreadsheet with all rounds */
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
                            {new Date(round.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, index) => {
                        const minRounds = competition.min_rounds || 13;
                        const isQualified = entry.rounds_played >= minRounds;
                        // Use dropped_rounds from API if available, otherwise calculate
                        const droppedIndices = entry.dropped_rounds || [];
                        
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
                              const isDropped = droppedIndices.includes(idx);
                              
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
                    
                    {/* Course Selection */}
                    <div className="space-y-2">
                      <Label>Select Course</Label>
                      <Select
                        value={newRound.course_id || "manual"}
                        onValueChange={handleCourseSelect}
                      >
                        <SelectTrigger data-testid="course-select" className="rounded-none">
                          <SelectValue placeholder="Select a saved course or enter manually" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">-- Enter Manually --</SelectItem>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name} ({course.tee} • Par {course.total_par} • Slope {course.slope_rating})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {courses.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No saved courses. Add courses in Course Management to auto-fill details.
                        </p>
                      )}
                    </div>

                    {/* Course Name - editable or auto-filled */}
                    <div className="space-y-2">
                      <Label>Course Name {newRound.course_id && <span className="text-xs text-muted-foreground">(from saved course)</span>}</Label>
                      <Input
                        data-testid="course-name-input"
                        value={newRound.course_name}
                        onChange={(e) => setNewRound({ ...newRound, course_name: e.target.value })}
                        placeholder="e.g., Royal Portrush"
                        className={`border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary ${newRound.course_id ? 'text-primary font-medium' : ''}`}
                        readOnly={!!newRound.course_id}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tee {newRound.course_id && <span className="text-xs text-green-600">✓</span>}</Label>
                        <Select
                          value={newRound.tee}
                          onValueChange={(val) => setNewRound({ ...newRound, tee: val })}
                          disabled={!!newRound.course_id}
                        >
                          <SelectTrigger data-testid="tee-select" className={`rounded-none ${newRound.course_id ? 'bg-muted' : ''}`}>
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
                        <Label>Slope Rating {newRound.course_id && <span className="text-xs text-green-600">✓</span>}</Label>
                        <Input
                          data-testid="slope-rating-input"
                          type="number"
                          min="55"
                          max="155"
                          value={newRound.slope_rating}
                          onChange={(e) => setNewRound({ ...newRound, slope_rating: parseInt(e.target.value) || 113 })}
                          className={`border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary ${newRound.course_id ? 'text-primary font-medium' : ''}`}
                          readOnly={!!newRound.course_id}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Course Rating {newRound.course_id && <span className="text-xs text-green-600">✓</span>}</Label>
                        <Input
                          data-testid="course-rating-input"
                          type="number"
                          step="0.1"
                          min="60"
                          max="80"
                          value={newRound.course_rating}
                          onChange={(e) => setNewRound({ ...newRound, course_rating: parseFloat(e.target.value) || 72.0 })}
                          className={`border-x-0 border-t-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary ${newRound.course_id ? 'text-primary font-medium' : ''}`}
                          readOnly={!!newRound.course_id}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Course Par {newRound.course_id && <span className="text-xs text-green-600">✓</span>}</Label>
                        <Select
                          value={newRound.course_par.toString()}
                          onValueChange={(val) => setNewRound({ ...newRound, course_par: parseInt(val) })}
                          disabled={!!newRound.course_id}
                        >
                        <SelectTrigger data-testid="course-par-select" className={`rounded-none ${newRound.course_id ? 'bg-muted' : ''}`}>
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
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <div className="flex gap-2">
                        <Input
                          data-testid="round-date-input"
                          type="date"
                          value={format(selectedDate, "yyyy-MM-dd")}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            if (!isNaN(date.getTime())) {
                              setSelectedDate(date);
                            }
                          }}
                          className="flex-1 rounded-none"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              data-testid="round-date-calendar-btn"
                              variant="outline"
                              size="icon"
                              className="rounded-none"
                              title="Pick from calendar"
                            >
                              <CalendarIcon className="h-4 w-4" />
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

        {/* Share Leaderboard Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                <Share2 className="w-6 h-6 text-[#D4AF37]" />
                Share Leaderboard
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {/* Preview */}
              <div className="bg-[#1a1a1a] text-white p-4 rounded-lg text-sm font-mono">
                <div className="text-[#D4AF37] font-bold mb-2">🏆 {competition.name.toUpperCase()}</div>
                <div className="border-t border-gray-700 pt-2 space-y-1">
                  {leaderboard.slice(0, 5).map((e, i) => (
                    <div key={e.player_id} className="flex justify-between">
                      <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {e.player_username}</span>
                      <span className="text-[#D4AF37]">{e.average_stableford.toFixed(1)} pts</span>
                    </div>
                  ))}
                  {leaderboard.length > 5 && (
                    <div className="text-gray-500 text-xs mt-2">+{leaderboard.length - 5} more players...</div>
                  )}
                </div>
              </div>

              {/* Share Options */}
              <div className="grid gap-3">
                {/* Copy Link */}
                <Button
                  data-testid="copy-link-btn"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="w-full justify-start gap-3 rounded-none h-12"
                >
                  {linkCopied ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  {linkCopied ? "Link Copied!" : "Copy Link"}
                </Button>

                {/* Copy Full Leaderboard */}
                <Button
                  data-testid="copy-leaderboard-btn"
                  variant="outline"
                  onClick={handleCopyLeaderboard}
                  className="w-full justify-start gap-3 rounded-none h-12"
                >
                  <Download className="w-5 h-5" />
                  Copy Full Leaderboard Text
                </Button>

                {/* Native Share (mobile) */}
                {typeof navigator !== 'undefined' && navigator.share && (
                  <Button
                    data-testid="native-share-btn"
                    onClick={handleNativeShare}
                    className="w-full justify-start gap-3 rounded-none h-12 bg-[#D4AF37] text-black hover:bg-[#c4a030]"
                  >
                    <Share2 className="w-5 h-5" />
                    Share via...
                  </Button>
                )}
              </div>
            </div>
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
  const [isIncluded, setIsIncluded] = useState(round.is_included !== false);
  const [countsForHandicap, setCountsForHandicap] = useState(round.counts_for_handicap !== false);

  useEffect(() => {
    fetchScores();
  }, [round.id]);

  useEffect(() => {
    setIsIncluded(round.is_included !== false);
    setCountsForHandicap(round.counts_for_handicap !== false);
  }, [round.is_included, round.counts_for_handicap]);

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

  const handleToggleInclusion = async () => {
    try {
      const response = await axios.put(`${API}/rounds/${round.id}/toggle-inclusion`);
      setIsIncluded(response.data.is_included);
      toast.success(response.data.message);
      onRefresh();
    } catch (error) {
      toast.error("Failed to toggle round inclusion");
    }
  };

  const handleToggleHandicap = async () => {
    try {
      const response = await axios.put(`${API}/rounds/${round.id}/toggle-handicap`);
      setCountsForHandicap(response.data.counts_for_handicap);
      toast.success(response.data.message);
      onRefresh();
    } catch (error) {
      toast.error("Failed to toggle handicap setting");
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

  const handleDeleteScore = async (scoreId, playerUsername) => {
    if (!confirm(`Remove ${playerUsername}'s score from this round? This will also recalculate their handicap.`)) {
      return;
    }
    try {
      await axios.delete(`${API}/scores/${scoreId}`);
      toast.success(`${playerUsername}'s score removed`);
      fetchScores();
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete score");
    }
  };

  const handleToggleScoreComp = async (scoreId, currentStatus) => {
    try {
      const response = await axios.put(`${API}/scores/${scoreId}/toggle-comp`);
      toast.success(response.data.message);
      fetchScores();
      onRefresh();
    } catch (error) {
      toast.error("Failed to toggle competition inclusion");
    }
  };

  const handleToggleScoreHandicap = async (scoreId, currentStatus) => {
    try {
      const response = await axios.put(`${API}/scores/${scoreId}/toggle-handicap`);
      toast.success(response.data.message);
      fetchScores();
      onRefresh();
    } catch (error) {
      toast.error("Failed to toggle handicap inclusion");
    }
  };

  return (
    <Card className={`border-l-4 ${isIncluded ? 'border-l-primary' : 'border-l-gray-300 opacity-60'}`} data-testid={`round-card-${round.id}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl font-bold uppercase tracking-tight">
                {round.name || `Round ${round.round_number}`}
              </CardTitle>
              {!isIncluded && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Excluded
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <CalendarIcon className="w-4 h-4" />
              {new Date(round.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor={`include-${round.id}`} className="text-xs text-muted-foreground">
                {isIncluded ? 'Comp' : 'Excl'}
              </Label>
              <Switch
                id={`include-${round.id}`}
                checked={isIncluded}
                onCheckedChange={handleToggleInclusion}
                data-testid={`toggle-round-${round.id}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`handicap-${round.id}`} className="text-xs text-muted-foreground">
                {countsForHandicap ? 'HCP' : 'No HCP'}
              </Label>
              <Switch
                id={`handicap-${round.id}`}
                checked={countsForHandicap}
                onCheckedChange={handleToggleHandicap}
                data-testid={`toggle-handicap-${round.id}`}
              />
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
              const isScoreIncludedInComp = playerScore?.is_included_in_comp !== false;
              const isScoreIncludedInHandicap = playerScore?.is_included_in_handicap !== false;
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
                  <div className="flex items-center gap-2">
                    {playerScore ? (
                      <>
                        {/* Score-level toggles */}
                        <div className="flex items-center gap-1 mr-2">
                          <div className="flex items-center gap-1">
                            <Label 
                              htmlFor={`score-comp-${playerScore.id}`} 
                              className={`text-[10px] ${isScoreIncludedInComp ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                              Comp
                            </Label>
                            <Switch
                              id={`score-comp-${playerScore.id}`}
                              checked={isScoreIncludedInComp}
                              onCheckedChange={() => handleToggleScoreComp(playerScore.id, isScoreIncludedInComp)}
                              data-testid={`toggle-score-comp-${playerScore.id}`}
                              className="scale-75"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Label 
                              htmlFor={`score-hcp-${playerScore.id}`} 
                              className={`text-[10px] ${isScoreIncludedInHandicap ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                              HCP
                            </Label>
                            <Switch
                              id={`score-hcp-${playerScore.id}`}
                              checked={isScoreIncludedInHandicap}
                              onCheckedChange={() => handleToggleScoreHandicap(playerScore.id, isScoreIncludedInHandicap)}
                              data-testid={`toggle-score-hcp-${playerScore.id}`}
                              className="scale-75"
                            />
                          </div>
                        </div>
                        <span className={`font-mono text-xl font-bold ${isScoreIncludedInComp ? 'text-primary' : 'text-muted-foreground line-through'}`}>
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
                        <Button
                          data-testid={`delete-score-${round.id}-${player.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteScore(playerScore.id, player.username)}
                          className="text-destructive hover:bg-destructive/10 rounded-none"
                        >
                          <Trash2 className="w-4 h-4" />
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
