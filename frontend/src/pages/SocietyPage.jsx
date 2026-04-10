import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useUser } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Users, 
  Copy, 
  Shield, 
  ShieldOff, 
  Crown,
  RefreshCw,
  Building2,
  UserPlus,
  LogOut
} from "lucide-react";

export default function SocietyPage() {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [society, setSociety] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const isAdmin = user?.is_admin === true;

  useEffect(() => {
    if (user?.society_id) {
      fetchSociety();
      fetchMembers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSociety = async () => {
    try {
      const response = await axios.get(`${API}/societies/${user.society_id}`);
      setSociety(response.data);
    } catch (error) {
      console.error("Failed to load society");
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API}/players?society_id=${user.society_id}`);
      setMembers(response.data);
    } catch (error) {
      console.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = () => {
    if (society?.join_code) {
      navigator.clipboard.writeText(society.join_code);
      toast.success("Join code copied to clipboard!");
    }
  };

  const handleTransferAdmin = async () => {
    if (!selectedMember) return;
    
    try {
      await axios.put(
        `${API}/societies/${user.society_id}/admin/${selectedMember.id}?current_admin_id=${user.id}`
      );
      toast.success(`Admin transferred to ${selectedMember.username}`);
      setShowTransferDialog(false);
      setSelectedMember(null);
      fetchMembers();
      // Refresh user data
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to transfer admin");
    }
  };

  const handleLeaveSociety = async () => {
    if (isAdmin && members.length > 1) {
      toast.error("Please transfer admin to another member before leaving");
      return;
    }
    
    if (confirm("Are you sure you want to leave this society?")) {
      try {
        await axios.put(`${API}/players/${user.id}`, { society_id: null });
        toast.success("You have left the society");
        logout();
      } catch (error) {
        toast.error("Failed to leave society");
      }
    }
  };

  if (!user?.society_id) {
    return (
      <div className="min-h-screen bg-background">
        <header className="golf-header text-white p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold uppercase tracking-wider">Society</h1>
            <div className="w-10" />
          </div>
        </header>
        <main className="p-4">
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-4">You're not part of a society yet</p>
              <Button onClick={logout} variant="outline">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="golf-header text-white p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold uppercase tracking-wider">Society</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Society Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{society?.name || "Loading..."}</CardTitle>
                <CardDescription>{members.length} member{members.length !== 1 ? 's' : ''}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Join Code */}
            <div className="bg-secondary/50 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Join Code</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-bold tracking-widest">
                  {society?.join_code || "------"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyJoinCode}
                  className="h-8 w-8"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this code with others to let them join your society
              </p>
            </div>

            {/* Your Status */}
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-medium">{user?.username}</span>
                {isAdmin && (
                  <Badge className="bg-[#D4AF37] text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4 text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-2">
                {members
                  .sort((a, b) => {
                    // Admin first, then alphabetical
                    if (a.is_admin && !b.is_admin) return -1;
                    if (!a.is_admin && b.is_admin) return 1;
                    return a.username.localeCompare(b.username);
                  })
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {member.team_logo ? (
                          <img src={member.team_logo} alt="" className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.username}</span>
                            {member.is_admin && (
                              <Crown className="w-4 h-4 text-[#D4AF37]" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            HCP: {member.handicap.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Transfer Admin Button (only for admin, not self) */}
                      {isAdmin && !member.is_admin && member.id !== user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowTransferDialog(true);
                          }}
                          className="text-xs"
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Make Admin
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-4">
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10"
              onClick={handleLeaveSociety}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Society
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Transfer Admin Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Admin</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to make <strong>{selectedMember?.username}</strong> the admin of this society? 
            You will lose your admin privileges.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransferAdmin}>
              <Shield className="w-4 h-4 mr-2" />
              Transfer Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
