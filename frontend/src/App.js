import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import MobileNav from "@/components/MobileNav";

// Pages
import LoginPage from "@/pages/LoginPage";
import LinkPlayerPage from "@/pages/LinkPlayerPage";
import DashboardPage from "@/pages/DashboardPage";
import PlayersPage from "@/pages/PlayersPage";
import CompetitionPage from "@/pages/CompetitionPage";
import ScoreEntryPage from "@/pages/ScoreEntryPage";
import HandicapTrackingPage from "@/pages/HandicapTrackingPage";
import CoursesPage from "@/pages/CoursesPage";
import SocietyPage from "@/pages/SocietyPage";
import JoinInvitePage from "@/pages/JoinInvitePage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Configure axios defaults for credentials
axios.defaults.withCredentials = true;

// User Context
export const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};

function App() {
  // authUser = the authenticated user account (email-based)
  // user = the linked player profile (for golf app features)
  const [authUser, setAuthUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setAuthUser(response.data);
      if (response.data.player) {
        setUser(response.data.player);
      }
    } catch (error) {
      // Not authenticated - this is fine
      setAuthUser(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
    setAuthUser(response.data);
    if (response.data.player) {
      setUser(response.data.player);
    }
    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await axios.post(`${API}/auth/register`, { email, password, name }, { withCredentials: true });
    // Auto-login after registration
    return login(email, password);
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setAuthUser(null);
    setUser(null);
  };

  const linkPlayer = async (playerId) => {
    const response = await axios.post(`${API}/auth/link-player`, { player_id: playerId }, { withCredentials: true });
    // Refresh auth state to get updated player
    await checkAuth();
    return response.data;
  };

  const createAndLinkPlayer = async (username, handicap, joinCode) => {
    // First, get society by join code
    const societyResponse = await axios.get(`${API}/societies/code/${joinCode}`);
    const societyId = societyResponse.data.id;
    
    // Create player in that society
    const playerResponse = await axios.post(`${API}/players`, {
      username,
      handicap,
      society_id: societyId
    });
    
    // Link the newly created player
    await linkPlayer(playerResponse.data.id);
  };

  const switchSociety = async (societyId) => {
    if (!user?.username) return;
    const response = await axios.post(`${API}/switch-society?username=${encodeURIComponent(user.username)}&society_id=${societyId}`);
    setUser(response.data.player);
    return response.data;
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Determine navigation based on auth state
  const isAuthenticated = !!authUser;
  const hasLinkedPlayer = !!user;

  return (
    <UserContext.Provider value={{ 
      authUser, 
      user, 
      login, 
      register, 
      logout, 
      linkPlayer, 
      createAndLinkPlayer,
      switchSociety,
      checkAuth
    }}>
      <div className="app-container">
        <BrowserRouter>
          <main className="app-content">
            <Routes>
              {/* Public route - Login/Register */}
              <Route
                path="/"
                element={
                  isAuthenticated 
                    ? (hasLinkedPlayer ? <Navigate to="/dashboard" /> : <Navigate to="/link-player" />)
                    : <LoginPage />
                }
              />
              
              {/* Link player route - requires auth but no linked player */}
              <Route
                path="/link-player"
                element={
                  isAuthenticated 
                    ? (hasLinkedPlayer ? <Navigate to="/dashboard" /> : <LinkPlayerPage />)
                    : <Navigate to="/" />
                }
              />
              
              {/* Protected routes - require auth AND linked player */}
              <Route
                path="/dashboard"
                element={
                  isAuthenticated && hasLinkedPlayer 
                    ? <DashboardPage /> 
                    : (isAuthenticated ? <Navigate to="/link-player" /> : <Navigate to="/" />)
                }
              />
              <Route
                path="/players"
                element={
                  isAuthenticated && hasLinkedPlayer 
                    ? <PlayersPage /> 
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/competition/:id"
                element={
                  isAuthenticated && hasLinkedPlayer 
                    ? <CompetitionPage /> 
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/score/:roundId/:playerId"
                element={
                  isAuthenticated && hasLinkedPlayer 
                    ? <ScoreEntryPage /> 
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/handicap-tracking"
                element={
                  isAuthenticated && hasLinkedPlayer 
                    ? <HandicapTrackingPage /> 
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/handicaps"
                element={
                  isAuthenticated && hasLinkedPlayer 
                    ? <HandicapTrackingPage /> 
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/courses"
                element={
                  isAuthenticated && hasLinkedPlayer 
                    ? <CoursesPage /> 
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/society"
                element={
                  isAuthenticated && hasLinkedPlayer 
                    ? <SocietyPage /> 
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/join/:code"
                element={<JoinInvitePage />}
              />
            </Routes>
          </main>
          {/* Only show navigation when user has linked player */}
          {isAuthenticated && hasLinkedPlayer && <MobileNav />}
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </UserContext.Provider>
  );
}

export default App;
