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
import { ArrowLeft, TrendingDown, TrendingUp, Minus, History, Users, Flag, Calendar, LayoutGrid, List } from "lucide-react";

export default function HandicapTrackingPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("all");
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("spreadsheet"); // "spreadsheet" or "list"

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const playersRes = await axios.get(`${API}/players`);
      setPlayers(playersRes.data);

      // Fetch handicap history for all players
      const historyPromises = playersRes.data.map(async (player) => {
        try {
          const historyRes = await axios.get(`${API}/players/${player.id}/handicap-history`);
          return {
            ...historyRes.data,
            team_logo: player.team_logo
          };
        } catch {
          return { player_id: player.id, username: player.username, current_handicap: player.handicap, history: [], team_logo: player.team_logo };
        }
      });

      const allHistoryData = await Promise.all(historyPromises);
      setAllHistory(allHistoryData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Combine all history entries with player info and sort by date
  const getCombinedHistory = () => {
    let combined = [];
    
    allHistory.forEach((playerData) => {
      if (playerData.history && playerData.history.length > 0) {
        playerData.history.forEach((record) => {
          combined.push({
            ...record,
            player_id: playerData.player_id,
            username: playerData.username,
            team_logo: playerData.team_logo,
          });
        });
      }
    });

    // Filter by selected player
    if (selectedPlayer !== "all") {
      combined = combined.filter((r) => r.player_id === selectedPlayer);
    }

    // Sort by date descending (most recent first)
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    return combined;
  };

  // Get unique dates for summary
  const getDateSummary = () => {
    const combined = getCombinedHistory();
    const dates = [...new Set(combined.map((r) => r.date))];
    return dates.slice(0, 10); // Last 10 unique dates
  };

  // Get ALL unique dates across all players for spreadsheet view
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

  // Get player's starting handicap (first recorded)
  const getStartingHandicap = (playerId) => {
    const playerHistory = allHistory.find((p) => p.player_id === playerId);
    if (!playerHistory || !playerHistory.history || playerHistory.history.length === 0) {
      const player = players.find(p => p.id === playerId);
      return player?.handicap || null;
    }
    // Return the handicap_before of the first record (sorted by date)
    const sorted = [...playerHistory.history].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted[0].handicap_before;
  };

  // Get player's handicap after a specific date
  const getHandicapAfterDate = (playerId, date) => {
    const playerHistory = allHistory.find((p) => p.player_id === playerId);
    if (!playerHistory || !playerHistory.history) return null;

    // Find exact match for this date
    const exactMatch = playerHistory.history.find((r) => r.date === date);
    if (exactMatch) return exactMatch.handicap_after;
    
    return null;
  };

  // Get cumulative handicap up to a date
  const getCumulativeHandicap = (playerId, targetDate) => {
    const playerHistory = allHistory.find((p) => p.player_id === playerId);
    if (!playerHistory || !playerHistory.history) return null;

    // Find the most recent record on or before this date
    const records = playerHistory.history
      .filter((r) => r.date <= targetDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return records.length > 0 ? records[0].handicap_after : null;
  };

  // Get player's handicap on a specific date
  const getHandicapOnDate = (playerId, date) => {
    const playerHistory = allHistory.find((p) => p.player_id === playerId);
    if (!playerHistory || !playerHistory.history) return null;

    // Find the most recent record on or before this date
    const records = playerHistory.history
      .filter((r) => r.date <= date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return records.length > 0 ? records[0].handicap_after : null;
  };

  const combinedHistory = getCombinedHistory();

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
              <History className="w-8 h-8 text-[#D4AF37]" />
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight">Handicap Tracking</h1>
                <p className="text-white/70 text-sm">World Handicap System History</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
          <Card className="border-l-4 border-l-[#D4AF37]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Rounds Tracked</p>
                  <p className="text-4xl font-mono font-bold">
                    {allHistory.reduce((sum, p) => sum + (p.history?.length || 0), 0)}
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
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg Handicap</p>
                  <p className="text-4xl font-mono font-bold">
                    {players.length > 0
                      ? (players.reduce((sum, p) => sum + p.handicap, 0) / players.length).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
                <History className="w-10 h-10 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Handicaps Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Current Handicaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="uppercase text-xs tracking-wider">Player</TableHead>
                  <TableHead className="uppercase text-xs tracking-wider text-center">Current HCP</TableHead>
                  <TableHead className="uppercase text-xs tracking-wider text-center">Rounds</TableHead>
                  <TableHead className="uppercase text-xs tracking-wider text-center">Best Diff</TableHead>
                  <TableHead className="uppercase text-xs tracking-wider text-center">Last Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => {
                  const playerHistory = allHistory.find((p) => p.player_id === player.id);
                  const history = playerHistory?.history || [];
                  const lastRecord = history.length > 0 ? history[history.length - 1] : null;
                  const bestDiff = history.length > 0 
                    ? Math.min(...history.map((r) => r.score_differential))
                    : null;
                  const lastChange = lastRecord 
                    ? lastRecord.handicap_after - lastRecord.handicap_before 
                    : 0;

                  return (
                    <TableRow key={player.id}>
                      <TableCell>
                        {player.team_logo ? (
                          <img src={player.team_logo} alt="Team" className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded-full" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{player.username}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-2xl font-bold text-primary">
                          {player.handicap.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {history.length}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {bestDiff !== null ? bestDiff.toFixed(1) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {lastChange !== 0 ? (
                          <span className={`flex items-center justify-center gap-1 ${lastChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {lastChange < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                            {Math.abs(lastChange).toFixed(1)}
                          </span>
                        ) : (
                          <Minus className="w-4 h-4 mx-auto text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Handicap History Spreadsheet */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-[#1a1a1a] text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-[#22c55e]" />
                <h2 className="text-xl font-bold uppercase tracking-wider">
                  Handicap Progression
                </h2>
              </div>
              <div className="flex items-center gap-4">
                {/* View Toggle */}
                <div className="flex items-center bg-[#2a2a2a] rounded overflow-hidden">
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
                    <span className="hidden sm:inline">Spreadsheet</span>
                  </button>
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
                    <span className="hidden sm:inline">List</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            {viewMode === "spreadsheet" ? (
              /* Spreadsheet View */
              getAllUniqueDates().length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No handicap history yet.</p>
                  <p className="text-sm mt-1">Handicaps will appear here after rounds are played.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    {/* Dates Header Row */}
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
                    {players.map((player, playerIdx) => {
                      const startHcp = getStartingHandicap(player.id);
                      let lastKnownHcp = startHcp;
                      
                      return (
                        <tr 
                          key={player.id}
                          className={`border-b ${playerIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}
                        >
                          {/* Player Name */}
                          <td className="px-3 py-2 font-medium bg-[#22c55e] text-white sticky left-0 z-10">
                            {player.username}
                          </td>
                          {/* Starting Handicap */}
                          <td className="px-2 py-2 text-center font-mono bg-[#4ade80] text-gray-900 font-semibold">
                            {startHcp !== null ? startHcp.toFixed(1) : '-'}
                          </td>
                          {/* Handicap for each date */}
                          {getAllUniqueDates().map((date) => {
                            const hcpOnDate = getHandicapAfterDate(player.id, date);
                            const cumulativeHcp = getCumulativeHandicap(player.id, date);
                            const displayHcp = hcpOnDate !== null ? hcpOnDate : cumulativeHcp;
                            
                            // Track last known for display continuity
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
            ) : (
              /* List View */
              <div className="p-4">
                <div className="flex justify-end mb-4">
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger className="w-48 rounded-none">
                      <SelectValue placeholder="All Players" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Players</SelectItem>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {combinedHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No handicap history yet.</p>
                    <p className="text-sm mt-1">Handicaps update automatically after each round.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="uppercase text-xs tracking-wider">Date</TableHead>
                        <TableHead className="uppercase text-xs tracking-wider">Player</TableHead>
                        <TableHead className="uppercase text-xs tracking-wider">Course</TableHead>
                        <TableHead className="uppercase text-xs tracking-wider text-center">Score</TableHead>
                        <TableHead className="uppercase text-xs tracking-wider text-center">Slope</TableHead>
                        <TableHead className="uppercase text-xs tracking-wider text-center">Diff</TableHead>
                        <TableHead className="uppercase text-xs tracking-wider text-center">Before</TableHead>
                        <TableHead className="uppercase text-xs tracking-wider text-center">After</TableHead>
                        <TableHead className="uppercase text-xs tracking-wider text-center">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {combinedHistory.map((record, idx) => {
                        const change = record.handicap_after - record.handicap_before;
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">
                              {new Date(record.date).toLocaleDateString('en-GB', { 
                                day: '2-digit', 
                                month: 'short',
                                year: 'numeric'
                              }).replace(/ /g, '/')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {record.team_logo && (
                                  <img src={record.team_logo} alt="Team" className="w-5 h-5 object-contain" />
                                )}
                                <span className="font-medium">{record.username}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {record.course_name || "Unknown"}
                            </TableCell>
                            <TableCell className="text-center font-mono font-bold">
                              {record.score} pts
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm text-muted-foreground">
                              {record.slope_rating}
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
                )}
              </div>
            )}
          </CardContent>
          
          {/* Footer */}
          <div className="bg-[#1a1a1a] text-white px-4 py-2 flex justify-between items-center text-xs">
            <span>{players.length} Players</span>
            <span className="text-[#22c55e]">{getAllUniqueDates().length} Rounds Tracked</span>
          </div>
        </Card>

        {/* WHS Info */}
        <Card className="mt-6 bg-secondary/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>World Handicap System (WHS):</strong> Handicap Index is calculated from your best score differentials. 
              The number of differentials used depends on how many rounds you've played (1-3 rounds uses best 1 with -2 adjustment, 
              20+ rounds uses best 8 of last 20). Score Differential = (Adjusted Gross Score - Course Rating) × (113 ÷ Slope Rating).
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
