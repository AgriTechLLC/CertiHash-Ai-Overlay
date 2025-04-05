import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth Provider
import { AuthProvider } from './contexts/AuthContext';

// Components
import Dashboard from './Dashboard';
import Layout from './components/Layout';
import NlpQuery from './NlpQuery';
import AnomalyAlerts from './components/AnomalyAlerts';
import TransactionStats from './components/TransactionStats';
import PrivateRoute from './components/PrivateRoute';

// Pages
import AIAssistant from './pages/AIAssistant';
import SecurityCenter from './pages/security/SecurityCenter';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/nlp" element={<NlpQuery />} />
                <Route path="/anomalies" element={<AnomalyAlerts />} />
                <Route path="/stats" element={<TransactionStats />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/security" element={<SecurityCenter />} />
                {/* Add more protected routes here */}
              </Route>
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;