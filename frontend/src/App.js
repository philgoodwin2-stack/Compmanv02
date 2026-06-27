import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import MobileNav from "@/components/MobileNav";
import IOSInstallPrompt from "@/components/IOSInstallPrompt";

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
import MenuPage from "@/pages/MenuPage";

const BACKEND_URL = process.env.REACT_APP_API_URL;
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
  const inactivityTimerRef = useRef(null);
  const INACTIVITY_TIMEOUT = 90 * 1000; // 90 seconds

  // Inactivity logout handler
  const handleInactivityLogout = useCallback(() => {
    if (authUser) {
      setAuthToken(null);
      setAuthUser(null);
      setUser(null);
      toast.info("You have been logged out due to inactivity");
    }
  }, [authUser]);

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (authUser) {
      inactivityTimerRef.current = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT);
    }
  }, [authUser, handleInactivityLogout]);

  // Set up activity listeners for inactivity logout
  useEffect(() => {
    if (!authUser) {
      // Clear timer if not logged in
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    // Activity events to track
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Start the timer
    resetInactivityTimer();

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    // Cleanup
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [authUser, resetInactivityTimer]);

  const checkAuth = useCallback(async () => {
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
  }, []);

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
  const hasActiveSubscription = authUser?.has_active_subscription;

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
      checkAuth,
      hasActiveSubscription
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
                    ? (hasActiveSubscription
                      ? (hasLinkedPlayer ? <Navigate to="/menu" /> : <Navigate to="/link-player" />)
                      : <Navigate to="/subscription" />)
                    : <LoginPage />
                }
              />

              {/* Link player route - requires auth AND subscription */}
              <Route
                path="/link-player"
                element={
                  isAuthenticated
                    ? (hasActiveSubscription
                      ? (hasLinkedPlayer ? <Navigate to="/menu" /> : <LinkPlayerPage />)
                      : <Navigate to="/subscription" />)
                    : <Navigate to="/" />
                }
              />

              {/* Menu page - requires auth, subscription AND linked player */}
              <Route
                path="/menu"
                element={
                  isAuthenticated && hasActiveSubscription && hasLinkedPlayer
                    ? <MenuPage />
                    : (isAuthenticated && !hasActiveSubscription
                      ? <Navigate to="/subscription" />
                      : (isAuthenticated ? <Navigate to="/link-player" /> : <Navigate to="/" />))
                }
              />

              {/* Public route - Reset Password */}
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Subscription routes - requires auth (but NOT subscription - so they can subscribe!) */}
              <Route
                path="/subscription"
                element={isAuthenticated ? <SubscriptionPage /> : <Navigate to="/" />}
              />
              <Route
                path="/subscription/success"
                element={isAuthenticated ? <SubscriptionSuccessPage /> : <Navigate to="/" />}
              />

              {/* Protected routes - require auth, subscription AND linked player */}
              <Route
                path="/dashboard"
                element={
                  isAuthenticated && hasActiveSubscription && hasLinkedPlayer
                    ? <DashboardPage />
                    : (isAuthenticated && !hasActiveSubscription ? <Navigate to="/subscription" /> : <Navigate to="/" />)
                }
              />
              <Route
                path="/players"
                element={
                  isAuthenticated && hasActiveSubscription && hasLinkedPlayer
                    ? <PlayersPage />
                    : (isAuthenticated && !hasActiveSubscription ? <Navigate to="/subscription" /> : <Navigate to="/" />)
                }
              />
              <Route
                path="/competition/:id"
                element={
                  isAuthenticated && hasActiveSubscription && hasLinkedPlayer
                    ? <CompetitionPage />
                    : (isAuthenticated && !hasActiveSubscription ? <Navigate to="/subscription" /> : <Navigate to="/" />)
                }
              />
              <Route
                path="/score/:roundId/:playerId"
                element={
                  isAuthenticated && hasActiveSubscription && hasLinkedPlayer
                    ? <ScoreEntryPage />
                    : (isAuthenticated && !hasActiveSubscription ? <Navigate to="/subscription" /> : <Navigate to="/" />)
                }
              />
              <Route
                path="/handicap-tracking"
                element={
                  isAuthenticated && hasActiveSubscription && hasLinkedPlayer
                    ? <HandicapTrackingPage />
                    : (isAuthenticated && !hasActiveSubscription ? <Navigate to="/subscription" /> : <Navigate to="/" />)
                }
              />
              <Route
                path="/handicaps"
                element={
                  isAuthenticated && hasActiveSubscription && hasLinkedPlayer
                    ? <HandicapTrackingPage />
                    : (isAuthenticated && !hasActiveSubscription ? <Navigate to="/subscription" /> : <Navigate to="/" />)
                }
              />
              <Route
                path="/courses"
                element={
                  isAuthenticated && hasActiveSubscription && hasLinkedPlayer
                    ? <CoursesPage />
                    : (isAuthenticated && !hasActiveSubscription ? <Navigate to="/subscription" /> : <Navigate to="/" />)
                }
              />
              <Route
                path="/society"
                element={
                  isAuthenticated && hasActiveSubscription && hasLinkedPlayer
                    ? <SocietyPage />
                    : (isAuthenticated && !hasActiveSubscription ? <Navigate to="/subscription" /> : <Navigate to="/" />)
                }
              />
              <Route
                path="/join/:code"
                element={<JoinInvitePage />}
              />
            </Routes>
          </main>
          {/* Only show navigation when user has linked player AND active subscription */}
          {isAuthenticated && hasActiveSubscription && hasLinkedPlayer && <MobileNav />}
          {/* iOS Install Prompt */}
          <IOSInstallPrompt />
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </UserContext.Provider>
  );
}

export default App;
