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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Users, 
  Copy, 
  Shield, 
  Crown,
  RefreshCw,
  Building2,
  LogOut,
  Pencil,
  Trash2,
  Settings,
  Link2,
  Plus,
  Share2,
  Clock,
  ExternalLink,
  ArrowLeftRight,
  Check
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SocietyPage() {
  const navigate = useNavigate();
  const { user, logout, switchSociety } = useUser();
  const [society, setSociety] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editName, setEditName] = useState("");
  const [regeneratingCode, setRegeneratingCode] = useState(false);
  const [invites, setInvites] = useState([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteExpiry, setInviteExpiry] = useState("7");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [userSocieties, setUserSocieties] = useState([]);
  const [switchingTo, setSwitchingTo] = useState(null);
  const [showDeleteSocietyDialog, setShowDeleteSocietyDialog] = useState(false);
  const [deletingSociety, setDeletingSociety] = useState(false);

  const isAdmin = user?.is_admin === true;

  useEffect(() => {
    if (user?.society_id) {
      fetchSociety();
      fetchMembers();
      fetchUserSocieties();
      if (user?.is_admin) {
        fetchInvites();
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSociety = async () => {
    try {
      const response = await axios.get(`${API}/societies/${user.society_id}`);
      setSociety(response.data);
      setEditName(response.data.name);
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

  const fetchUserSocieties = async () => {
    try {
      const response = await axios.get(`${API}/user-societies/${encodeURIComponent(user.username)}`);
      setUserSocieties(response.data);
    } catch (error) {
      console.error("Failed to load user societies");
    }
  };

  const handleSwitchSociety = async (societyId) => {
    if (societyId === user?.society_id) return;
    
    setSwitchingTo(societyId);
    try {
      await switchSociety(societyId);
      toast.success("Switched society!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to switch society");
    } finally {
      setSwitchingTo(null);
    }
  };

  const fetchInvites = async () => {
    try {
      const response = await axios.get(`${API}/societies/${user.society_id}/invites?admin_id=${user.id}`);
      setInvites(response.data);
    } catch (error) {
      console.error("Failed to load invites");
    }
  };

  const copyJoinCode = async () => {
    if (society?.join_code) {
      try {
        await navigator.clipboard.writeText(society.join_code);
        toast.success("Join code copied to clipboard!");
      } catch (err) {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = society.join_code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success("Join code copied to clipboard!");
      }
    }
  };

  const handleUpdateSociety = async () => {
    if (!editName.trim()) {
      toast.error("Society name is required");
      return;
    }
    
    try {
      const response = await axios.put(
        `${API}/societies/${user.society_id}?admin_id=${user.id}`,
        { name: editName.trim() }
      );
      setSociety(response.data);
      setShowEditDialog(false);
      toast.success("Society updated!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update society");
    }
  };

  const handleRegenerateCode = async () => {
    if (!confirm("Are you sure? All existing join links will stop working.")) {
      return;
    }
    
    setRegeneratingCode(true);
    try {
      const response = await axios.put(
        `${API}/societies/${user.society_id}?admin_id=${user.id}`,
        { regenerate_code: true }
      );
      setSociety(response.data);
      toast.success(`New join code: ${response.data.join_code}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to regenerate code");
    } finally {
      setRegeneratingCode(false);
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

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    try {
      await axios.delete(
        `${API}/societies/${user.society_id}/members/${selectedMember.id}?admin_id=${user.id}`
      );
      toast.success(`${selectedMember.username} removed from society`);
      setShowRemoveDialog(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to remove member");
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

  const handleDeleteSociety = async () => {
    setDeletingSociety(true);
    try {
      await axios.delete(`${API}/societies/${user.society_id}?admin_id=${user.id}`);
      toast.success("Society deleted successfully");
      setShowDeleteSocietyDialog(false);
      logout();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete society");
    } finally {
      setDeletingSociety(false);
    }
  };

  const handleCreateInvite = async () => {
    setCreatingInvite(true);
    try {
      const response = await axios.post(
        `${API}/societies/${user.society_id}/invites?admin_id=${user.id}`,
        { expires_in_days: parseInt(inviteExpiry) }
      );
      setInvites([response.data, ...invites]);
      setShowInviteDialog(false);
      
      // Copy link to clipboard
      const inviteUrl = `${window.location.origin}/join/${response.data.code}`;
      await copyToClipboard(inviteUrl);
      toast.success("Invite link created and copied to clipboard!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create invite");
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    if (!confirm("Are you sure you want to revoke this invite link?")) return;
    
    try {
      await axios.delete(`${API}/societies/${user.society_id}/invites/${inviteId}?admin_id=${user.id}`);
      setInvites(invites.filter(i => i.id !== inviteId));
      toast.success("Invite revoked");
    } catch (error) {
      toast.error("Failed to revoke invite");
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const copyInviteLink = async (code) => {
    const inviteUrl = `${window.location.origin}/join/${code}`;
    await copyToClipboard(inviteUrl);
    toast.success("Invite link copied!");
  };

  const shareInvite = async (code) => {
    const inviteUrl = `${window.location.origin}/join/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${society?.name}`,
          text: `You've been invited to join ${society?.name} golf society!`,
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled or share failed - copy to clipboard instead
        await copyInviteLink(code);
      }
    } else {
      await copyInviteLink(code);
    }
  };

  const formatExpiry = (isoDate) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return "Soon";
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
          {isAdmin ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEditDialog(true)}
              className="text-white hover:bg-white/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Society Switcher (only if user belongs to multiple societies) */}
        {userSocieties.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                Your Societies
              </CardTitle>
              <CardDescription>
                You belong to {userSocieties.length} societies. Tap to switch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userSocieties.map((s) => (
                  <button
                    key={s.society_id}
                    type="button"
                    onClick={() => handleSwitchSociety(s.society_id)}
                    disabled={switchingTo === s.society_id}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      s.society_id === user?.society_id
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-secondary/30 hover:bg-secondary/50 border-2 border-transparent'
                    }`}
                    data-testid={`switch-society-${s.society_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className={`w-5 h-5 ${s.society_id === user?.society_id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <p className={`font-medium ${s.society_id === user?.society_id ? 'text-primary' : ''}`}>
                          {s.society_name}
                        </p>
                        {s.is_admin && (
                          <Badge variant="outline" className="text-xs mt-0.5">
                            <Crown className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                    {s.society_id === user?.society_id ? (
                      <Check className="w-5 h-5 text-primary" />
                    ) : switchingTo === s.society_id ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : null}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Society Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
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
                <span className="text-2xl font-mono font-bold tracking-widest flex-1">
                  {society?.join_code || "------"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyJoinCode}
                  className="h-8 w-8"
                  title="Copy code"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRegenerateCode}
                    disabled={regeneratingCode}
                    className="h-8 w-8"
                    title="Generate new code"
                  >
                    <RefreshCw className={`w-4 h-4 ${regeneratingCode ? 'animate-spin' : ''}`} />
                  </Button>
                )}
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

        {/* Invite Links Card (Admin only) */}
        {isAdmin && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Invite Links
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowInviteDialog(true)}
                  data-testid="create-invite-btn"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Link
                </Button>
              </div>
              <CardDescription>
                Create shareable links for easy onboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No active invite links</p>
                  <p className="text-xs">Create one to easily invite new members</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-background px-2 py-0.5 rounded truncate">
                            /join/{invite.code}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Expires in {formatExpiry(invite.expires_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => shareInvite(invite.code)}
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyInviteLink(invite.code)}
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRevokeInvite(invite.id)}
                          title="Revoke"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                      
                      {/* Admin Actions */}
                      {isAdmin && !member.is_admin && member.id !== user.id && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setShowTransferDialog(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="Make Admin"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setShowRemoveDialog(true);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10"
              onClick={handleLeaveSociety}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Society
            </Button>
            {isAdmin && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteSocietyDialog(true)}
                data-testid="delete-society-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Society
              </Button>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Society Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Society</DialogTitle>
            <DialogDescription>Update your society's name and settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Society Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Society name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSociety}>
              <Pencil className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Admin Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Admin</DialogTitle>
            <DialogDescription>
              Transfer admin privileges to another member.
            </DialogDescription>
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

      {/* Remove Member Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Remove a member from your society.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <strong>{selectedMember?.username}</strong> from the society? 
            They will need to rejoin with the code to access the society again.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember}>
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invite Link</DialogTitle>
            <DialogDescription>
              Create a shareable link to invite new members to your society.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link Expiration</Label>
              <Select value={inviteExpiry} onValueChange={setInviteExpiry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days (default)</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-secondary/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                The link will be copied to your clipboard automatically. You can share it via WhatsApp, text, email, or any messaging app.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvite} disabled={creatingInvite}>
              {creatingInvite ? (
                <>Creating...</>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Create & Copy Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Society Dialog */}
      <Dialog open={showDeleteSocietyDialog} onOpenChange={setShowDeleteSocietyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Society</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm font-medium text-destructive mb-2">Warning: This will permanently delete:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>The society "{society?.name}"</li>
                <li>All competitions ({members.length > 0 ? 'including scores and rounds' : ''})</li>
                <li>All courses</li>
                <li>All invite links</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Members will be unlinked but their accounts will remain.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteSocietyDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSociety}
              disabled={deletingSociety}
              data-testid="confirm-delete-society-btn"
            >
              {deletingSociety ? (
                <>Deleting...</>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Society
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
