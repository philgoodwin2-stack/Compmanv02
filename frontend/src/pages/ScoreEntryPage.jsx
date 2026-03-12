import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Save, Minus, Plus, Flag, Trophy } from "lucide-react";

// Default pars for 18 holes (standard course)
const DEFAULT_PARS = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5];

export default function ScoreEntryPage() {
  const { roundId, playerId } = useParams();
  const navigate = useNavigate();

  const [round, setRound] = useState(null);
  const [player, setPlayer] = useState(null);
  const [score, setScore] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeHole, setActiveHole] = useState(1);

  const [holes, setHoles] = useState([]);

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

      const numHoles = compRes.data.num_holes || 18;

      // Check if score exists
      if (scoresRes.data.length > 0) {
        const existingScore = scoresRes.data[0];
        setScore(existingScore);

        // Use existing holes or initialize
        if (existingScore.holes && existingScore.holes.length > 0) {
          setHoles(existingScore.holes);
        } else {
          initializeHoles(numHoles);
        }
      } else {
        // Create new score
        try {
          const newScoreRes = await axios.post(`${API}/scores`, {
            round_id: roundId,
            player_id: playerId,
          });
          setScore(newScoreRes.data);
          initializeHoles(numHoles);
        } catch (error) {
          // Score might already exist, try fetching again
          const retryRes = await axios.get(`${API}/scores?round_id=${roundId}&player_id=${playerId}`);
          if (retryRes.data.length > 0) {
            setScore(retryRes.data[0]);
            if (retryRes.data[0].holes?.length > 0) {
              setHoles(retryRes.data[0].holes);
            } else {
              initializeHoles(numHoles);
            }
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

  const initializeHoles = (numHoles) => {
    const initialHoles = [];
    for (let i = 1; i <= numHoles; i++) {
      initialHoles.push({
        hole_number: i,
        par: DEFAULT_PARS[(i - 1) % 18] || 4,
        strokes: 0,
        stableford_points: 0,
      });
    }
    setHoles(initialHoles);
  };

  const updateHoleStrokes = (holeNumber, strokes) => {
    setHoles((prev) =>
      prev.map((h) =>
        h.hole_number === holeNumber ? { ...h, strokes: Math.max(0, strokes) } : h
      )
    );
  };

  const updateHolePar = (holeNumber, par) => {
    setHoles((prev) =>
      prev.map((h) =>
        h.hole_number === holeNumber ? { ...h, par: Math.max(3, Math.min(5, par)) } : h
      )
    );
  };

  const handleSave = async () => {
    if (!score) return;

    setSaving(true);
    try {
      await axios.put(`${API}/scores/${score.id}/holes`, holes);
      toast.success("Scores saved!");
      navigate(-1);
    } catch (error) {
      toast.error("Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

  const getTotalStrokes = () => holes.reduce((sum, h) => sum + (h.strokes || 0), 0);
  const getTotalPar = () => holes.reduce((sum, h) => sum + h.par, 0);

  const getScoreClass = (strokes, par) => {
    if (!strokes || strokes === 0) return "bg-muted";
    const diff = strokes - par;
    if (diff <= -2) return "bg-[#D4AF37] text-black"; // Eagle or better
    if (diff === -1) return "bg-red-500 text-white"; // Birdie
    if (diff === 0) return "bg-gray-200 text-gray-800"; // Par
    if (diff === 1) return "bg-blue-500 text-white"; // Bogey
    return "bg-gray-900 text-white"; // Double bogey or worse
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
      <header className="golf-header text-white py-4 px-4 flex-shrink-0">
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
              <h1 className="text-xl font-bold uppercase tracking-tight">{player?.username}</h1>
              <p className="text-white/70 text-sm">
                {round?.name || `Round ${round?.round_number}`} • HCP {player?.handicap.toFixed(1)}
              </p>
            </div>
          </div>
          <Button
            data-testid="save-scores-btn"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 rounded-none uppercase font-bold tracking-widest"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      {/* Summary Bar */}
      <div className="bg-secondary border-b py-3 px-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="font-mono text-2xl font-bold">{getTotalStrokes()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Par</p>
              <p className="font-mono text-2xl font-bold">{getTotalPar()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">vs Par</p>
              <p className={`font-mono text-2xl font-bold ${getTotalStrokes() - getTotalPar() > 0 ? 'text-blue-500' : getTotalStrokes() - getTotalPar() < 0 ? 'text-red-500' : ''}`}>
                {getTotalStrokes() - getTotalPar() > 0 ? '+' : ''}{getTotalStrokes() - getTotalPar()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Holes Completed</p>
            <p className="font-mono text-2xl font-bold">
              {holes.filter((h) => h.strokes > 0).length}/{holes.length}
            </p>
          </div>
        </div>
      </div>

      {/* Hole Navigator */}
      <div className="bg-background border-b overflow-x-auto no-scrollbar px-4 py-3">
        <div className="max-w-4xl mx-auto flex gap-2">
          {holes.map((hole) => (
            <button
              key={hole.hole_number}
              data-testid={`hole-nav-${hole.hole_number}`}
              onClick={() => setActiveHole(hole.hole_number)}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold transition-all ${
                activeHole === hole.hole_number
                  ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                  : hole.strokes > 0
                  ? getScoreClass(hole.strokes, hole.par)
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {hole.hole_number}
            </button>
          ))}
        </div>
      </div>

      {/* Active Hole Entry */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {holes.map((hole) =>
          hole.hole_number === activeHole ? (
            <div
              key={hole.hole_number}
              className="w-full max-w-sm animate-slide-up"
              data-testid={`hole-entry-${hole.hole_number}`}
            >
              <Card className="border-l-4 border-l-primary shadow-lg">
                <CardHeader className="text-center pb-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Flag className="w-6 h-6 text-primary" />
                    <CardTitle className="text-4xl font-bold uppercase tracking-tight">
                      Hole {hole.hole_number}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Par Selection */}
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Par</p>
                    <div className="flex items-center justify-center gap-4">
                      {[3, 4, 5].map((par) => (
                        <button
                          key={par}
                          data-testid={`par-select-${par}`}
                          onClick={() => updateHolePar(hole.hole_number, par)}
                          className={`w-14 h-14 rounded-full font-mono text-xl font-bold transition-all ${
                            hole.par === par
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {par}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Strokes Entry */}
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Strokes</p>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        data-testid="decrease-strokes"
                        variant="outline"
                        size="icon"
                        onClick={() => updateHoleStrokes(hole.hole_number, hole.strokes - 1)}
                        className="w-14 h-14 rounded-full"
                      >
                        <Minus className="w-6 h-6" />
                      </Button>
                      <div
                        className={`w-24 h-24 rounded-full flex items-center justify-center font-mono text-4xl font-bold ${getScoreClass(
                          hole.strokes,
                          hole.par
                        )}`}
                      >
                        {hole.strokes || "-"}
                      </div>
                      <Button
                        data-testid="increase-strokes"
                        variant="outline"
                        size="icon"
                        onClick={() => updateHoleStrokes(hole.hole_number, hole.strokes + 1)}
                        className="w-14 h-14 rounded-full"
                      >
                        <Plus className="w-6 h-6" />
                      </Button>
                    </div>
                    <Input
                      data-testid="strokes-input"
                      type="number"
                      min="0"
                      max="15"
                      value={hole.strokes || ""}
                      onChange={(e) =>
                        updateHoleStrokes(hole.hole_number, parseInt(e.target.value) || 0)
                      }
                      className="w-20 mx-auto mt-4 text-center font-mono text-lg border-x-0 border-t-0 border-b-2 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary"
                    />
                  </div>

                  {/* Score Label */}
                  {hole.strokes > 0 && (
                    <div className="text-center">
                      <p
                        className={`inline-block px-4 py-2 rounded-none uppercase font-bold text-sm tracking-wider ${getScoreClass(
                          hole.strokes,
                          hole.par
                        )}`}
                      >
                        {hole.strokes - hole.par <= -3
                          ? "Albatross!"
                          : hole.strokes - hole.par === -2
                          ? "Eagle!"
                          : hole.strokes - hole.par === -1
                          ? "Birdie"
                          : hole.strokes - hole.par === 0
                          ? "Par"
                          : hole.strokes - hole.par === 1
                          ? "Bogey"
                          : hole.strokes - hole.par === 2
                          ? "Double Bogey"
                          : `+${hole.strokes - hole.par}`}
                      </p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between pt-4">
                    <Button
                      data-testid="prev-hole-btn"
                      variant="outline"
                      onClick={() => setActiveHole(Math.max(1, activeHole - 1))}
                      disabled={activeHole === 1}
                      className="rounded-none uppercase tracking-wider"
                    >
                      Previous
                    </Button>
                    <Button
                      data-testid="next-hole-btn"
                      variant="outline"
                      onClick={() => setActiveHole(Math.min(holes.length, activeHole + 1))}
                      disabled={activeHole === holes.length}
                      className="rounded-none uppercase tracking-wider"
                    >
                      Next
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null
        )}
      </div>

      {/* Legend */}
      <div className="bg-secondary border-t py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#D4AF37]" />
            <span className="text-xs uppercase tracking-wider">Eagle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-xs uppercase tracking-wider">Birdie</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-200" />
            <span className="text-xs uppercase tracking-wider">Par</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span className="text-xs uppercase tracking-wider">Bogey</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-900" />
            <span className="text-xs uppercase tracking-wider">Double+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
