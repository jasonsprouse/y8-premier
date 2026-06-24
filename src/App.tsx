import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { RouteGuard } from './components/RouteGuard';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Financial } from './pages/Financial';
import { AI } from './pages/AI';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          <Route element={<RouteGuard><Layout /></RouteGuard>}>
            <Route path="/" element={<Home />} />
            <Route path="/financial" element={<Financial />} />
            <Route path="/ai" element={<AI />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

