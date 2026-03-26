import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Save, Flag, Trophy } from "lucide-react";

export default function ScoreEntryPage() {
  const { roundId, playerId } = useParams();
  const navigate = useNavigate();

  const [round, setRound] = useState(null);
  const [player, setPlayer] = useState(null);
  const [score, setScore] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [stablefordPoints, setStablefordPoints] = useState(0);

  useEffect(() => {
    fetchData();
  }, [roundId, playerId]);

  const fetchData = async () => {
    try {
      const [roundRes, playerRes, scoresRes] = await Promise.all([
        axios.get(`${API}/rounds/${roundId}`),
        axios.get(`${API}/players/${playerId}`),
        axios.get(`${API}/scores?round_id=${roundId}&player_id=${playerId}`),
      ]);

      setRound(roundRes.data);
      setPlayer(playerRes.data);

      // Get competition for num_holes
      const compRes = await axios.get(`${API}/competitions/${roundRes.data.competition_id}`);
      setCompetition(compRes.data);

      // Check if score exists
      if (scoresRes.data.length > 0) {
        const existingScore = scoresRes.data[0];
        setScore(existingScore);
        setStablefordPoints(existingScore.total_stableford || 0);
      } else {
        // Create new score
        try {
          const newScoreRes = await axios.post(`${API}/scores`, {
            round_id: roundId,
            player_id: playerId,
          });
          setScore(newScoreRes.data);
          setStablefordPoints(0);
        } catch (error) {
          // Score might already exist, try fetching again
          const retryRes = await axios.get(`${API}/scores?round_id=${roundId}&player_id=${playerId}`);
          if (retryRes.data.length > 0) {
            setScore(retryRes.data[0]);
            setStablefordPoints(retryRes.data[0].total_stableford || 0);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to load data");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!score) return;

    setSaving(true);
    try {
      await axios.put(`${API}/scores/${score.id}/points`, { total_stableford: stablefordPoints });
      toast.success("Score saved!");
      navigate(-1);
    } catch (error) {
      toast.error("Failed to save score");
    } finally {
      setSaving(false);
    }
  };

  const getPointsColor = (points) => {
    if (points >= 36) return "text-[#D4AF37]"; // Gold - great round
    if (points >= 30) return "text-green-500"; // Good
    if (points >= 24) return "text-blue-500"; // Average
    return "text-gray-500"; // Below average
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="golf-header text-white py-6 px-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              data-testid="back-btn"
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight">{player?.username}</h1>
              <p className="text-white/70 text-sm">
                {round?.name || `Round ${round?.round_number}`} • HCP {player?.handicap.toFixed(1)}
              </p>
            </div>
          </div>
          <Button
            data-testid="save-score-btn"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 rounded-none uppercase font-bold tracking-widest"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-l-4 border-l-[#D4AF37] shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-3xl font-bold uppercase tracking-tight">
              Enter Stableford Points
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {round?.date && new Date(round.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Points Input */}
            <div className="text-center">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-4 block">
                Total Stableford Points
              </Label>
              <div className="relative">
                <Input
                  data-testid="stableford-points-input"
                  type="number"
                  min="0"
                  max="54"
                  value={stablefordPoints || ""}
                  onChange={(e) => setStablefordPoints(parseInt(e.target.value) || 0)}
                  className={`text-center text-6xl font-mono font-bold h-32 border-4 rounded-lg ${getPointsColor(stablefordPoints)}`}
                  style={{ fontSize: '4rem' }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                  pts
                </span>
              </div>
            </div>

            {/* Quick Entry Buttons */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground block text-center">
                Quick Entry
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {[30, 32, 34, 36, 38].map((pts) => (
                  <Button
                    key={pts}
                    data-testid={`quick-pts-${pts}`}
                    variant="outline"
                    onClick={() => setStablefordPoints(pts)}
                    className={`h-12 font-mono font-bold ${stablefordPoints === pts ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : ''}`}
                  >
                    {pts}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[40, 42, 44, 46, 48].map((pts) => (
                  <Button
                    key={pts}
                    data-testid={`quick-pts-${pts}`}
                    variant="outline"
                    onClick={() => setStablefordPoints(pts)}
                    className={`h-12 font-mono font-bold ${stablefordPoints === pts ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : ''}`}
                  >
                    {pts}
                  </Button>
                ))}
              </div>
            </div>

            {/* Score Guide */}
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">
                Score Guide ({competition?.num_holes || 18} holes)
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Excellent:</span>
                  <span className="font-mono font-bold text-[#D4AF37]">40+ pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Very Good:</span>
                  <span className="font-mono font-bold text-green-500">36-39 pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Good:</span>
                  <span className="font-mono font-bold text-blue-500">30-35 pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average:</span>
                  <span className="font-mono font-bold text-gray-500">24-29 pts</span>
                </div>
              </div>
            </div>

            {/* Player Info */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-3">
                {player?.team_logo && (
                  <img src={player.team_logo} alt="Team" className="w-8 h-8 object-contain" />
                )}
                <div>
                  <p className="font-semibold">{player?.username}</p>
                  <p className="text-sm text-muted-foreground">Handicap: {player?.handicap.toFixed(1)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{competition?.num_holes} holes</p>
                <p className="text-sm text-muted-foreground">Par {round?.course_par || 72}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
