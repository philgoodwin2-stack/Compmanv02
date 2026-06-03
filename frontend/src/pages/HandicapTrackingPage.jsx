import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useUser } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, TrendingDown, TrendingUp, Minus, History, Flag, Calculator, LayoutGrid, List, Users } from "lucide-react";

export default function HandicapTrackingPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [playerData, setPlayerData] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // "list" (current user) or "spreadsheet" (all players)

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    try {
      // Fetch player's handicap history
      const historyRes = await axios.get(`${API}/players/${user.id}/handicap-history`);
      setPlayerData(historyRes.data);

      // Fetch courses for the playing handicap calculator
      const coursesRes = await axios.get(`${API}/courses`);
      setCourses(coursesRes.data);

      // Fetch all players for spreadsheet view
      const playersRes = await axios.get(`${API}/players`);
      setAllPlayers(playersRes.data);

      // Fetch handicap history for all players (for spreadsheet view)
      const historyPromises = playersRes.data.map(async (player) => {
        try {
          const hRes = await axios.get(`${API}/players/${player.id}/handicap-history`);
          return { ...hRes.data, team_logo: player.team_logo };
        } catch {
          return { player_id: player.id, username: player.username, current_handicap: player.handicap, history: [], team_logo: player.team_logo };
        }
      });
      const allHistoryData = await Promise.all(historyPromises);
      setAllHistory(allHistoryData);
    } catch (error) {
      toast.error("Failed to load handicap data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate playing handicap for a course
  const calculatePlayingHandicap = (course) => {
    if (!user?.handicap || !course) return null;
    
    const handicapIndex = user.handicap;
    const slopeRating = course.slope_rating || 113;
    const courseRating = course.course_rating || 72;
    const coursePar = course.total_par || 72;
    
    // WHS formula: Course Handicap = Handicap Index × (Slope Rating ÷ 113) + (Course Rating - Par)
    const courseHandicap = handicapIndex * (slopeRating / 113) + (courseRating - coursePar);
    
    // Playing Handicap = Course Handicap × 0.95 (95% for competition)
    const playingHandicap = Math.round(courseHandicap * 0.95);
    
    return {
      courseHandicap: courseHandicap.toFixed(1),
      playingHandicap: playingHandicap
    };
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  const playingHcpCalc = selectedCourseData ? calculatePlayingHandicap(selectedCourseData) : null;

  // Get history sorted by date (most recent first) for current user
  const sortedHistory = playerData?.history 
    ? [...playerData.history].sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  // Stats for current user
  const roundsPlayed = sortedHistory.length;
  const bestDiff = roundsPlayed > 0 
    ? Math.min(...sortedHistory.map(r => r.score_differential))
    : null;
  const latestChange = sortedHistory.length > 0 
    ? sortedHistory[0].handicap_after - sortedHistory[0].handicap_before
    : 0;

  // Spreadsheet view helpers
  const getAllUniqueDates = () => {
    const dates = new Set();
    allHistory.forEach((playerData) => {
      if (playerData.history) {
        playerData.history.forEach((record) => {
          dates.add(record.date);
        });
      }
    });
    return [...dates].sort((a, b) => new Date(a) - new Date(b));
  };

  const getStartingHandicap = (playerId) => {
    const playerHistory = allHistory.find((p) => p.player_id === playerId);
    if (!playerHistory || !playerHistory.history || playerHistory.history.length === 0) {
      const player = allPlayers.find(p => p.id === playerId);
      return player?.handicap || null;
    }
    const sorted = [...playerHistory.history].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted[0].handicap_before;
  };

  const getHandicapAfterDate = (playerId, date) => {
    const playerHistory = allHistory.find((p) => p.player_id === playerId);
    if (!playerHistory || !playerHistory.history) return null;
    const exactMatch = playerHistory.history.find((r) => r.date === date);
    if (exactMatch) return exactMatch.handicap_after;
    return null;
  };

  const getCumulativeHandicap = (playerId, targetDate) => {
    const playerHistory = allHistory.find((p) => p.player_id === playerId);
    if (!playerHistory || !playerHistory.history) return null;
    const records = playerHistory.history
      .filter((r) => r.date <= targetDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return records.length > 0 ? records[0].handicap_after : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
              <History className="w-8 h-8 text-[#C0C0C0]" />
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight">
                  {viewMode === "list" ? "My Handicap" : "Handicap Tracking"}
                </h1>
                <p className="text-white/70 text-sm">
                  {viewMode === "list" ? user?.username : "All Players"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Current Handicap Card - Only show in list view */}
        {viewMode === "list" && (
          <>
            <Card className="mb-6 border-l-4 border-l-[#C0C0C0]">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Current Handicap Index</p>
                    <p className="text-6xl font-mono font-bold text-primary">{user?.handicap?.toFixed(1) || "N/A"}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Rounds</p>
                      <p className="text-2xl font-mono font-bold">{roundsPlayed}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Best Diff</p>
                      <p className="text-2xl font-mono font-bold text-green-500">
                        {bestDiff !== null ? bestDiff.toFixed(1) : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Last Change</p>
                      <div className="flex items-center justify-center">
                        {latestChange !== 0 ? (
                          <span className={`text-2xl font-mono font-bold flex items-center ${latestChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {latestChange < 0 ? <TrendingDown className="w-5 h-5 mr-1" /> : <TrendingUp className="w-5 h-5 mr-1" />}
                            {Math.abs(latestChange).toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-2xl font-mono font-bold text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Playing Handicap Calculator */}
            <Card className="mb-6 border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Playing Handicap Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Select Course</p>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger data-testid="course-select" className="rounded-none">
                        <SelectValue placeholder="Choose a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.length === 0 ? (
                          <SelectItem value="none" disabled>No courses available</SelectItem>
                        ) : (
                          courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name} ({course.tee} • Slope {course.slope_rating} • CR {course.course_rating})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {playingHcpCalc && (
                    <div className="flex gap-6 items-center bg-secondary/50 px-6 py-4 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Course HCP</p>
                        <p className="text-2xl font-mono font-bold">{playingHcpCalc.courseHandicap}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Playing HCP (95%)</p>
                        <p className="text-3xl font-mono font-bold text-primary">{playingHcpCalc.playingHandicap}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedCourseData && (
                  <div className="mt-4 p-3 bg-muted/50 rounded text-sm text-muted-foreground">
                    <strong>{selectedCourseData.name}</strong> - {selectedCourseData.tee} Tees: 
                    Par {selectedCourseData.total_par}, Slope {selectedCourseData.slope_rating}, Course Rating {selectedCourseData.course_rating}
                  </div>
                )}
                
                {courses.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No courses saved yet. Add courses in Course Management to calculate playing handicaps.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Handicap History / Spreadsheet */}
        <Card className="overflow-hidden">
          <div className="bg-[#1a1a1a] text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-[#22c55e]" />
                <h2 className="text-xl font-bold uppercase tracking-wider">
                  Handicap Progression
                </h2>
              </div>
              {/* View Toggle */}
              <div className="flex items-center bg-[#2a2a2a] rounded overflow-hidden">
                <button
                  data-testid="view-list-btn"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 flex items-center gap-1.5 text-xs transition-colors ${
                    viewMode === "list" 
                      ? "bg-[#22c55e] text-black" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">My History</span>
                </button>
                <button
                  data-testid="view-spreadsheet-btn"
                  onClick={() => setViewMode("spreadsheet")}
                  className={`px-3 py-1.5 flex items-center gap-1.5 text-xs transition-colors ${
                    viewMode === "spreadsheet" 
                      ? "bg-[#22c55e] text-black" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">All Players</span>
                </button>
              </div>
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            {viewMode === "list" ? (
              /* List View - Current User */
              sortedHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No handicap history yet.</p>
                  <p className="text-sm mt-1">Your handicap will update after you play rounds.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="uppercase text-xs tracking-wider">Date</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider">Course</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider text-center">Score</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider text-center">Diff</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider text-center">Before</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider text-center">After</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider text-center">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedHistory.map((record, idx) => {
                      const change = record.handicap_after - record.handicap_before;
                      return (
                        <TableRow key={idx} data-testid={`history-row-${idx}`}>
                          <TableCell className="font-mono">
                            {new Date(record.date).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>
                              <span className="font-medium">{record.course_name || "Unknown"}</span>
                              {record.slope_rating && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  (Slope {record.slope_rating})
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold">
                            {record.score} pts
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {record.score_differential?.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center font-mono text-muted-foreground">
                            {record.handicap_before?.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold">
                            {record.handicap_after?.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center">
                            {change !== 0 ? (
                              <Badge className={`${change < 0 ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                                {change < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                                {change > 0 ? '+' : ''}{change.toFixed(1)}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">0.0</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )
            ) : (
              /* Spreadsheet View - All Players */
              getAllUniqueDates().length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No handicap history yet.</p>
                  <p className="text-sm mt-1">Handicaps will appear here after rounds are played.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-3 py-2 text-left bg-[#22c55e] text-white font-semibold sticky left-0 z-10 min-w-[120px]">
                        Name
                      </th>
                      <th className="px-2 py-2 text-center bg-[#22c55e] text-white font-semibold min-w-[50px]">
                        Start
                      </th>
                      {getAllUniqueDates().map((date) => (
                        <th 
                          key={date} 
                          className="px-1 py-2 text-center font-normal text-xs text-gray-600 min-w-[55px]"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '70px' }}
                        >
                          {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allPlayers.map((player, playerIdx) => {
                      const startHcp = getStartingHandicap(player.id);
                      let lastKnownHcp = startHcp;
                      
                      return (
                        <tr 
                          key={player.id}
                          className={`border-b ${playerIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 ${player.id === user?.id ? 'ring-2 ring-primary ring-inset' : ''}`}
                        >
                          <td className={`px-3 py-2 font-medium sticky left-0 z-10 ${player.id === user?.id ? 'bg-[#C0C0C0] text-black' : 'bg-[#22c55e] text-white'}`}>
                            {player.username}
                            {player.id === user?.id && <span className="ml-1 text-xs">(You)</span>}
                          </td>
                          <td className="px-2 py-2 text-center font-mono bg-[#4ade80] text-gray-900 font-semibold">
                            {startHcp !== null ? startHcp.toFixed(1) : '-'}
                          </td>
                          {getAllUniqueDates().map((date) => {
                            const hcpOnDate = getHandicapAfterDate(player.id, date);
                            const cumulativeHcp = getCumulativeHandicap(player.id, date);
                            const displayHcp = hcpOnDate !== null ? hcpOnDate : cumulativeHcp;
                            
                            if (displayHcp !== null) {
                              lastKnownHcp = displayHcp;
                            }
                            
                            const showHcp = displayHcp !== null ? displayHcp : lastKnownHcp;
                            const hasChange = hcpOnDate !== null;
                            
                            return (
                              <td 
                                key={date} 
                                className={`px-1 py-2 text-center font-mono text-sm ${
                                  hasChange ? 'font-semibold' : 'text-gray-500'
                                }`}
                              >
                                {showHcp !== null ? showHcp.toFixed(1) : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}
          </CardContent>
          
          {/* Footer */}
          <div className="bg-[#1a1a1a] text-white px-4 py-2 flex justify-between items-center text-xs">
            <span>
              {viewMode === "list" 
                ? `Showing all ${sortedHistory.length} rounds` 
                : `${allPlayers.length} Players`}
            </span>
            <span className="text-[#22c55e]">
              {viewMode === "list" 
                ? "World Handicap System" 
                : `${getAllUniqueDates().length} Rounds Tracked`}
            </span>
          </div>
        </Card>

        {/* WHS Info */}
        <Card className="mt-6 bg-secondary/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>World Handicap System (WHS):</strong> Your Handicap Index is calculated from your best score differentials. 
              Playing Handicap = Course Handicap × 95% (for competition play). 
              Course Handicap = Handicap Index × (Slope Rating ÷ 113) + (Course Rating - Par).
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
