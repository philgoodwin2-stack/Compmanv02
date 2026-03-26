import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PlayersPage from "@/pages/PlayersPage";
import CompetitionPage from "@/pages/CompetitionPage";
import ScoreEntryPage from "@/pages/ScoreEntryPage";
import HandicapTrackingPage from "@/pages/HandicapTrackingPage";

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

  useEffect(() => {
    if (user) {
      localStorage.setItem("golfUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("golfUser");
    }
  }, [user]);

  const login = async (username) => {
    try {
      const response = await axios.post(`${API}/login`, { username });
      setUser(response.data.player);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      <div className="min-h-screen bg-background">
        <BrowserRouter>
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
              path="/handicaps"
              element={user ? <HandicapTrackingPage /> : <Navigate to="/" />}
            />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </UserContext.Provider>
  );
}

export default App;
