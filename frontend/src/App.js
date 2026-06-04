import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import MobileNav from "@/components/MobileNav";

// Pages
import LoginPage from "@/pages/LoginPage";
import LinkPlayerPage from "@/pages/LinkPlayerPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import SubscriptionSuccessPage from "@/pages/SubscriptionSuccessPage";
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

// Auth token management
const getAuthToken = () => localStorage.getItem("authToken");
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("authToken", token);
  } else {
    localStorage.removeItem("authToken");
  }
};

// Configure axios interceptor to add auth header
axios.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/auth/me`);
      setAuthUser(response.data);
      if (response.data.player) {
        setUser(response.data.player);
      }
    } catch (error) {
      // Token invalid or expired - clear it
      setAuthToken(null);
      setAuthUser(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    // Store the access token from response
    if (response.data.access_token) {
      setAuthToken(response.data.access_token);
    }
    setAuthUser(response.data);
    if (response.data.player) {
      setUser(response.data.player);
    }
    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await axios.post(`${API}/auth/register`, { email, password, name });
    // Store the access token from response
    if (response.data.access_token) {
      setAuthToken(response.data.access_token);
    }
    setAuthUser(response.data);
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    }
    setAuthToken(null);
    setAuthUser(null);
    setUser(null);
  };

  const linkPlayer = async (playerId) => {
    const response = await axios.post(`${API}/auth/link-player`, { player_id: playerId });
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
              
              {/* Public route - Reset Password */}
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Subscription routes - requires auth */}
              <Route
                path="/subscription"
                element={isAuthenticated ? <SubscriptionPage /> : <Navigate to="/" />}
              />
              <Route
                path="/subscription/success"
                element={isAuthenticated ? <SubscriptionSuccessPage /> : <Navigate to="/" />}
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
