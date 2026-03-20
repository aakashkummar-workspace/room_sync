import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

import { Expenses } from './pages/Expenses';
import { Chores } from './pages/Chores';
import { Inventory } from './pages/Inventory';
import { Roommates } from './pages/Roommates';
import { Analytics } from './pages/Analytics';
import { Notices } from './pages/Notices';
import { Settings } from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/chores" element={<Chores />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/roommates" element={<Roommates />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/notices" element={<Notices />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
