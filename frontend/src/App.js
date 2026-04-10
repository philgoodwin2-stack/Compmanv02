import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import MobileNav from "@/components/MobileNav";

// Pages
import LoginPage from "@/pages/LoginPage";
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
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("golfUser");
    return saved ? JSON.parse(saved) : null;
  });

  // Refresh user data on app load to get latest is_admin status
  useEffect(() => {
    const refreshUser = async () => {
      if (user?.username) {
        try {
          const response = await axios.post(`${API}/login`, { username: user.username });
          const freshUser = response.data.player;
          // Always update user with fresh data from server
          setUser(freshUser);
        } catch (error) {
          console.error("Failed to refresh user:", error);
        }
      }
    };
    refreshUser();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("golfUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("golfUser");
    }
  }, [user]);

  const login = async (username, societyId = null, joinCode = null) => {
    try {
      const payload = { username };
      if (societyId) payload.society_id = societyId;
      if (joinCode) payload.join_code = joinCode;
      
      const response = await axios.post(`${API}/login`, payload);
      
      // Only set user if they have a society (or are joining/creating one)
      // This prevents redirect to dashboard for users without a society
      if (!response.data.needs_society) {
        setUser(response.data.player);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const switchSociety = async (societyId) => {
    try {
      const response = await axios.post(`${API}/switch-society?username=${encodeURIComponent(user.username)}&society_id=${societyId}`);
      setUser(response.data.player);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, switchSociety }}>
      <div className="app-container">
        <BrowserRouter>
          <main className="app-content">
            <Routes>
              <Route
                path="/"
                element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
              />
              <Route
                path="/dashboard"
                element={user ? <DashboardPage /> : <Navigate to="/" />}
              />
              <Route
                path="/players"
                element={user ? <PlayersPage /> : <Navigate to="/" />}
              />
              <Route
                path="/competition/:id"
                element={user ? <CompetitionPage /> : <Navigate to="/" />}
              />
              <Route
                path="/score/:roundId/:playerId"
                element={user ? <ScoreEntryPage /> : <Navigate to="/" />}
              />
              <Route
                path="/handicap-tracking"
                element={user ? <HandicapTrackingPage /> : <Navigate to="/" />}
              />
              <Route
                path="/handicaps"
                element={user ? <HandicapTrackingPage /> : <Navigate to="/" />}
              />
              <Route
                path="/courses"
                element={user ? <CoursesPage /> : <Navigate to="/" />}
              />
              <Route
                path="/society"
                element={user ? <SocietyPage /> : <Navigate to="/" />}
              />
              <Route
                path="/join/:code"
                element={<JoinInvitePage />}
              />
            </Routes>
          </main>
          <MobileNav />
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </UserContext.Provider>
  );
}

export default App;
