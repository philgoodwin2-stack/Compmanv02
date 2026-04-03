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
import { ArrowLeft, Plus, Pencil, Trash2, Users, Flag, History, TrendingDown, TrendingUp } from "lucide-react";

// Sports team logos - Football, Rugby, GAA and more
const TEAM_LOGOS = [
  { name: "None", logo: "" },
  // PREMIER LEAGUE
  { name: "Arsenal", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" },
  { name: "Aston Villa", logo: "https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg" },
  { name: "Bournemouth", logo: "https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg" },
  { name: "Brentford", logo: "https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg" },
  { name: "Brighton", logo: "https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg" },
  { name: "Chelsea", logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" },
  { name: "Crystal Palace", logo: "https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg" },
  { name: "Everton", logo: "https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg" },
  { name: "Fulham", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg" },
  { name: "Ipswich Town", logo: "https://upload.wikimedia.org/wikipedia/en/4/43/Ipswich_Town.svg" },
  { name: "Leicester City", logo: "https://upload.wikimedia.org/wikipedia/en/2/2d/Leicester_City_crest.svg" },
  { name: "Liverpool", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" },
  { name: "Man City", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" },
  { name: "Man United", logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg" },
  { name: "Newcastle", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg" },
  { name: "Nottm Forest", logo: "https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg" },
  { name: "Southampton", logo: "https://upload.wikimedia.org/wikipedia/en/c/c9/FC_Southampton.svg" },
  { name: "Tottenham", logo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg" },
  { name: "West Ham", logo: "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg" },
  { name: "Wolves", logo: "https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg" },
  // CHAMPIONSHIP
  { name: "Blackburn", logo: "https://upload.wikimedia.org/wikipedia/en/0/0f/Blackburn_Rovers.svg" },
  { name: "Bristol City", logo: "https://upload.wikimedia.org/wikipedia/en/f/f5/Bristol_City_crest.svg" },
  { name: "Burnley", logo: "https://upload.wikimedia.org/wikipedia/en/6/62/Burnley_F.C._Logo.svg" },
  { name: "Cardiff City", logo: "https://upload.wikimedia.org/wikipedia/en/3/3c/Cardiff_City_crest.svg" },
  { name: "Coventry", logo: "https://upload.wikimedia.org/wikipedia/en/9/94/Coventry_City_FC_logo.svg" },
  { name: "Derby County", logo: "https://upload.wikimedia.org/wikipedia/en/4/4a/Derby_County_crest.svg" },
  { name: "Hull City", logo: "https://upload.wikimedia.org/wikipedia/en/5/54/Hull_City_A.F.C._logo.svg" },
  { name: "Leeds United", logo: "https://upload.wikimedia.org/wikipedia/en/5/54/Leeds_United_F.C._logo.svg" },
  { name: "Luton Town", logo: "https://upload.wikimedia.org/wikipedia/en/9/9d/Luton_Town_logo.svg" },
  { name: "Middlesbrough", logo: "https://upload.wikimedia.org/wikipedia/en/2/2c/Middlesbrough_FC_crest.svg" },
  { name: "Millwall", logo: "https://upload.wikimedia.org/wikipedia/en/7/74/Millwall_FC_logo.svg" },
  { name: "Norwich City", logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/Norwich_City.svg" },
  { name: "Oxford United", logo: "https://upload.wikimedia.org/wikipedia/en/3/3e/Oxford_United_FC_logo.svg" },
  { name: "Plymouth", logo: "https://upload.wikimedia.org/wikipedia/en/a/a8/Plymouth_Argyle_F.C._logo.svg" },
  { name: "Portsmouth", logo: "https://upload.wikimedia.org/wikipedia/en/3/38/Portsmouth_FC_logo.svg" },
  { name: "Preston", logo: "https://upload.wikimedia.org/wikipedia/en/8/82/Preston_North_End_FC.svg" },
  { name: "QPR", logo: "https://upload.wikimedia.org/wikipedia/en/3/31/Queens_Park_Rangers_crest.svg" },
  { name: "Sheffield Utd", logo: "https://upload.wikimedia.org/wikipedia/en/9/9c/Sheffield_United_FC_logo.svg" },
  { name: "Sheffield Wed", logo: "https://upload.wikimedia.org/wikipedia/en/8/88/Sheffield_Wednesday_badge.svg" },
  { name: "Stoke City", logo: "https://upload.wikimedia.org/wikipedia/en/2/29/Stoke_City_FC.svg" },
  { name: "Sunderland", logo: "https://upload.wikimedia.org/wikipedia/en/7/77/Sunderland_AFC_logo.svg" },
  { name: "Swansea City", logo: "https://upload.wikimedia.org/wikipedia/en/a/a3/Swansea_City_AFC_logo.svg" },
  { name: "Watford", logo: "https://upload.wikimedia.org/wikipedia/en/e/e2/Watford.svg" },
  { name: "West Brom", logo: "https://upload.wikimedia.org/wikipedia/en/8/8b/West_Bromwich_Albion.svg" },
  // LEAGUE ONE
  { name: "Barnsley", logo: "https://upload.wikimedia.org/wikipedia/en/c/c9/Barnsley_FC.svg" },
  { name: "Birmingham", logo: "https://upload.wikimedia.org/wikipedia/en/6/68/Birmingham_City_FC_logo.svg" },
  { name: "Blackpool", logo: "https://upload.wikimedia.org/wikipedia/en/d/df/Blackpool_FC_logo.svg" },
  { name: "Bolton", logo: "https://upload.wikimedia.org/wikipedia/en/8/82/Bolton_Wanderers_FC_logo.svg" },
  { name: "Bristol Rovers", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/Bristol_Rovers_F.C._logo.svg" },
  { name: "Burton Albion", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Burton_Albion_FC_logo.svg" },
  { name: "Cambridge Utd", logo: "https://upload.wikimedia.org/wikipedia/en/a/a1/Cambridge_United_FC.svg" },
  { name: "Charlton", logo: "https://upload.wikimedia.org/wikipedia/en/5/5a/Charlton_Athletic_FC_logo.svg" },
  { name: "Crawley Town", logo: "https://upload.wikimedia.org/wikipedia/en/5/52/Crawley_Town_FC_logo.svg" },
  { name: "Exeter City", logo: "https://upload.wikimedia.org/wikipedia/en/0/0d/Exeter_City_FC.svg" },
  { name: "Huddersfield", logo: "https://upload.wikimedia.org/wikipedia/en/7/7d/Huddersfield_Town_A.F.C._logo.svg" },
  { name: "Leyton Orient", logo: "https://upload.wikimedia.org/wikipedia/en/f/fc/Leyton_Orient_F.C._logo.svg" },
  { name: "Lincoln City", logo: "https://upload.wikimedia.org/wikipedia/en/4/4c/Lincoln_City_FC_logo.svg" },
  { name: "Mansfield", logo: "https://upload.wikimedia.org/wikipedia/en/7/7e/Mansfield_Town_FC.svg" },
  { name: "Northampton", logo: "https://upload.wikimedia.org/wikipedia/en/2/2e/Northampton_Town_F.C._logo.svg" },
  { name: "Peterborough", logo: "https://upload.wikimedia.org/wikipedia/en/d/d4/Peterborough_United.svg" },
  { name: "Reading", logo: "https://upload.wikimedia.org/wikipedia/en/1/11/Reading_FC.svg" },
  { name: "Rotherham", logo: "https://upload.wikimedia.org/wikipedia/en/c/c0/Rotherham_United_FC.svg" },
  { name: "Shrewsbury", logo: "https://upload.wikimedia.org/wikipedia/en/1/1b/Shrewsbury_Town_F.C._logo.svg" },
  { name: "Stevenage", logo: "https://upload.wikimedia.org/wikipedia/en/a/a1/Stevenage_FC_logo.svg" },
  { name: "Stockport", logo: "https://upload.wikimedia.org/wikipedia/en/a/a5/Stockport_County_FC_logo.svg" },
  { name: "Wigan Athletic", logo: "https://upload.wikimedia.org/wikipedia/en/4/43/Wigan_Athletic.svg" },
  { name: "Wrexham", logo: "https://upload.wikimedia.org/wikipedia/en/c/c1/Wrexham_AFC.svg" },
  { name: "Wycombe", logo: "https://upload.wikimedia.org/wikipedia/en/f/fb/Wycombe_Wanderers_FC_logo.svg" },
  // LEAGUE TWO
  { name: "AFC Wimbledon", logo: "https://upload.wikimedia.org/wikipedia/en/1/1a/AFC_Wimbledon_%282020%29_logo.svg" },
  { name: "Accrington", logo: "https://upload.wikimedia.org/wikipedia/en/b/b3/Accrington_Stanley_FC_logo.svg" },
  { name: "Barrow", logo: "https://upload.wikimedia.org/wikipedia/en/e/ef/Barrow_A.F.C._logo.svg" },
  { name: "Bradford City", logo: "https://upload.wikimedia.org/wikipedia/en/3/38/Bradford_City_AFC.svg" },
  { name: "Bromley", logo: "https://upload.wikimedia.org/wikipedia/en/8/82/Bromley_FC_logo.png" },
  { name: "Carlisle Utd", logo: "https://upload.wikimedia.org/wikipedia/en/1/16/Carlisle_United_FC_logo.svg" },
  { name: "Cheltenham", logo: "https://upload.wikimedia.org/wikipedia/en/c/c2/Cheltenham_Town_F.C._logo.svg" },
  { name: "Chesterfield", logo: "https://upload.wikimedia.org/wikipedia/en/9/95/Chesterfield_FC_logo.svg" },
  { name: "Colchester", logo: "https://upload.wikimedia.org/wikipedia/en/4/40/Colchester_United_FC_logo.svg" },
  { name: "Crewe Alexandra", logo: "https://upload.wikimedia.org/wikipedia/en/9/9d/Crewe_Alexandra.svg" },
  { name: "Doncaster", logo: "https://upload.wikimedia.org/wikipedia/en/5/57/Doncaster_Rovers_F.C._logo.svg" },
  { name: "Fleetwood", logo: "https://upload.wikimedia.org/wikipedia/en/e/ed/Fleetwood_Town_F.C._logo.svg" },
  { name: "Gillingham", logo: "https://upload.wikimedia.org/wikipedia/en/5/5e/FC_Gillingham_Logo.svg" },
  { name: "Grimsby Town", logo: "https://upload.wikimedia.org/wikipedia/en/d/db/Grimsby_Town_F.C._logo.svg" },
  { name: "Harrogate", logo: "https://upload.wikimedia.org/wikipedia/en/6/62/Harrogate_Town_AFC_logo.svg" },
  { name: "MK Dons", logo: "https://upload.wikimedia.org/wikipedia/en/b/b5/Milton_Keynes_Dons_F.C._logo.svg" },
  { name: "Morecambe", logo: "https://upload.wikimedia.org/wikipedia/en/f/f1/Morecambe_FC_logo.svg" },
  { name: "Newport County", logo: "https://upload.wikimedia.org/wikipedia/en/1/1f/Newport_County_AFC_logo.png" },
  { name: "Notts County", logo: "https://upload.wikimedia.org/wikipedia/en/9/95/Notts_County_Logo.svg" },
  { name: "Port Vale", logo: "https://upload.wikimedia.org/wikipedia/en/0/05/Port_Vale_FC_logo.svg" },
  { name: "Salford City", logo: "https://upload.wikimedia.org/wikipedia/en/a/a2/Salford_City_FC_logo.svg" },
  { name: "Swindon Town", logo: "https://upload.wikimedia.org/wikipedia/en/a/a3/Swindon_Town_FC.svg" },
  { name: "Tranmere", logo: "https://upload.wikimedia.org/wikipedia/en/a/ab/Tranmere_Rovers_FC_logo.svg" },
  { name: "Walsall", logo: "https://upload.wikimedia.org/wikipedia/en/e/ef/Walsall_FC.svg" },
  // SCOTTISH
  { name: "Celtic", logo: "https://upload.wikimedia.org/wikipedia/en/3/35/Celtic_FC.svg" },
  { name: "Rangers", logo: "https://upload.wikimedia.org/wikipedia/en/4/43/Rangers_FC.svg" },
  { name: "Aberdeen", logo: "https://upload.wikimedia.org/wikipedia/en/4/4f/Aberdeen_FC_logo.svg" },
  { name: "Hearts", logo: "https://upload.wikimedia.org/wikipedia/en/e/e3/Heart_of_Midlothian_FC_logo.svg" },
  { name: "Hibs", logo: "https://upload.wikimedia.org/wikipedia/en/a/a3/Hibernian_FC_logo.svg" },
  // EUROPEAN
  { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" },
  { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" },
  { name: "Bayern Munich", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg" },
  { name: "PSG", logo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg" },
  { name: "Juventus", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Juventus_FC_-_pictogram.svg" },
  { name: "AC Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg" },
  { name: "Inter Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg" },
  { name: "Borussia Dortmund", logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg" },
  { name: "Ajax", logo: "https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg" },
  { name: "Atletico Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg" },
  { name: "Benfica", logo: "https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg" },
  { name: "Porto", logo: "https://upload.wikimedia.org/wikipedia/en/f/f1/FC_Porto.svg" },
  // RUGBY
  { name: "Ireland Rugby", logo: "https://upload.wikimedia.org/wikipedia/en/7/79/Irish_Rugby_Football_Union_logo.svg" },
  { name: "England Rugby", logo: "https://upload.wikimedia.org/wikipedia/en/c/cf/England_rugby_union_logo.svg" },
  { name: "Wales Rugby", logo: "https://upload.wikimedia.org/wikipedia/en/a/af/Welsh_Rugby_Union_logo.svg" },
  { name: "Scotland Rugby", logo: "https://upload.wikimedia.org/wikipedia/en/5/59/Scottish_Rugby_Union_logo.svg" },
  { name: "France Rugby", logo: "https://upload.wikimedia.org/wikipedia/en/a/a9/France_national_rugby_union_team_logo.svg" },
  { name: "Leinster", logo: "https://upload.wikimedia.org/wikipedia/en/5/54/Leinster_Rugby_logo.svg" },
  { name: "Munster", logo: "https://upload.wikimedia.org/wikipedia/en/d/d3/Munster_Rugby_logo.svg" },
  { name: "Ulster", logo: "https://upload.wikimedia.org/wikipedia/en/0/0f/Ulster_Rugby_Logo.svg" },
  { name: "Connacht", logo: "https://upload.wikimedia.org/wikipedia/en/9/92/Connacht_Rugby_logo.svg" },
  { name: "Saracens", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Saracens_FC_logo.svg" },
  { name: "Harlequins", logo: "https://upload.wikimedia.org/wikipedia/en/6/6c/Harlequin_FC_logo.svg" },
  // GAA
  { name: "Dublin GAA", logo: "https://upload.wikimedia.org/wikipedia/en/9/9c/Dublin_GAA_crest.svg" },
  { name: "Kerry GAA", logo: "https://upload.wikimedia.org/wikipedia/en/6/6f/Kerry_GAA_crest.png" },
  { name: "Mayo GAA", logo: "https://upload.wikimedia.org/wikipedia/en/e/e1/Mayo_GAA_crest.svg" },
  { name: "Galway GAA", logo: "https://upload.wikimedia.org/wikipedia/en/c/c4/Galway_GAA_crest.svg" },
  { name: "Tyrone GAA", logo: "https://upload.wikimedia.org/wikipedia/en/1/10/Tyrone_GAA_crest.png" },
  { name: "Cork GAA", logo: "https://upload.wikimedia.org/wikipedia/en/d/dc/Cork_GAA_crest.png" },
  { name: "Kilkenny GAA", logo: "https://upload.wikimedia.org/wikipedia/en/9/9c/Kilkenny_GAA_crest.svg" },
  { name: "Limerick GAA", logo: "https://upload.wikimedia.org/wikipedia/en/3/31/Limerick_GAA_crest.svg" },
  { name: "Armagh GAA", logo: "https://upload.wikimedia.org/wikipedia/en/6/64/Armagh_GAA_crest.svg" },
  { name: "Donegal GAA", logo: "https://upload.wikimedia.org/wikipedia/en/2/28/Donegal_GAA_crest.png" },
  { name: "Meath GAA", logo: "https://upload.wikimedia.org/wikipedia/en/0/0f/Meath_GAA_crest.png" },
  { name: "Derry GAA", logo: "https://upload.wikimedia.org/wikipedia/en/6/63/Derry_GAA_crest.svg" },
  // NFL
  { name: "Dallas Cowboys", logo: "https://upload.wikimedia.org/wikipedia/commons/1/15/Dallas_Cowboys.svg" },
  { name: "New England Patriots", logo: "https://upload.wikimedia.org/wikipedia/en/b/b9/New_England_Patriots_logo.svg" },
  { name: "Green Bay Packers", logo: "https://upload.wikimedia.org/wikipedia/commons/5/50/Green_Bay_Packers_logo.svg" },
  { name: "San Francisco 49ers", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3a/San_Francisco_49ers_logo.svg" },
  // NBA
  { name: "LA Lakers", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg" },
  { name: "Boston Celtics", logo: "https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg" },
  { name: "Chicago Bulls", logo: "https://upload.wikimedia.org/wikipedia/en/6/67/Chicago_Bulls_logo.svg" },
  { name: "Golden State Warriors", logo: "https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg" },
];

export default function PlayersPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePlayerId, setDeletePlayerId] = useState(null);
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

  const handleDeletePlayer = async () => {
    if (!deletePlayerId) return;

    try {
      await axios.delete(`${API}/players/${deletePlayerId}`);
      toast.success("Player deleted");
      setShowDeleteDialog(false);
      setDeletePlayerId(null);
      fetchPlayers();
    } catch (error) {
      toast.error("Failed to delete player");
    }
  };

  const openDeleteDialog = (playerId) => {
    setDeletePlayerId(playerId);
    setShowDeleteDialog(true);
  };

  const openEditDialog = (player) => {
    setEditingPlayer({ ...player });
    setShowEditDialog(true);
  };

  const openHistoryDialog = async (player) => {
    try {
      const response = await axios.get(`${API}/players/${player.id}/handicap-history`);
      setHistoryData(response.data);
      setShowHistoryDialog(true);
    } catch (error) {
      toast.error("Failed to load handicap history");
    }
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
                  <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
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
                          data-testid={`history-player-${player.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => openHistoryDialog(player)}
                          className="hover:bg-primary/10"
                          title="Handicap History"
                        >
                          <History className="w-4 h-4" />
                        </Button>
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
                          onClick={() => openDeleteDialog(player.id)}
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
                  <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
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

        {/* Handicap History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                <History className="w-6 h-6 text-primary" />
                Handicap History
              </DialogTitle>
              {historyData && (
                <p className="text-muted-foreground">
                  {historyData.username} - Current Handicap: <span className="font-mono font-bold text-primary">{historyData.current_handicap?.toFixed(1)}</span>
                </p>
              )}
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4">
              {historyData?.history?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="uppercase text-xs tracking-wider">Date</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider">Course</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider text-center">Score</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider text-center">Slope</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider text-center">Diff</TableHead>
                      <TableHead className="uppercase text-xs tracking-wider text-right">Handicap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyData.history.slice().reverse().map((record, idx) => {
                      const handicapChange = record.handicap_after - record.handicap_before;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">
                            {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
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
                          <TableCell className="text-center font-mono text-sm">
                            {record.score_differential?.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-mono font-bold">{record.handicap_after?.toFixed(1)}</span>
                              {handicapChange !== 0 && (
                                <span className={`flex items-center text-xs ${handicapChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {handicapChange < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                  {Math.abs(handicapChange).toFixed(1)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No handicap history yet.</p>
                  <p className="text-sm mt-1">Handicap will update after each round.</p>
                </div>
              )}
            </div>
            <div className="pt-4 border-t bg-secondary/30 -mx-6 -mb-6 px-6 py-4">
              <p className="text-xs text-muted-foreground">
                <strong>World Handicap System:</strong> Handicap calculated from best 8 of last 20 score differentials.
                Differential = (Score - Course Rating) × (113 / Slope Rating)
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Player Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-destructive flex items-center gap-2">
                <Trash2 className="w-6 h-6" />
                Delete Player
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this player? This action cannot be undone.
              </p>
              <p className="mt-2 text-sm text-destructive/80">
                All scores and handicap history for this player will be permanently removed.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="rounded-none"
              >
                Cancel
              </Button>
              <Button
                data-testid="confirm-delete-player"
                variant="destructive"
                onClick={handleDeletePlayer}
                className="rounded-none"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Player
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
