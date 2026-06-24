import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  ethAddress: string;
  primaryAddress: string;
  authorizedIntegrations?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithWallet: (address: string) => void;
  updatePrimaryAddress: (newAddress: string) => void;
  authorizeIntegration: (integration: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem('y8_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const loginWithWallet = (address: string) => {
    const newUser = { 
      id: '1', 
      name: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`, 
      ethAddress: address,
      primaryAddress: address
    };
    setUser(newUser);
    localStorage.setItem('y8_user', JSON.stringify(newUser));
  };

  const updatePrimaryAddress = (newAddress: string) => {
    if (user) {
      const updatedUser = { ...user, primaryAddress: newAddress };
      setUser(updatedUser);
      localStorage.setItem('y8_user', JSON.stringify(updatedUser));
    }
  };

  const authorizeIntegration = (integration: string) => {
    if (user) {
      const authorizedIntegrations = user.authorizedIntegrations || [];
      if (!authorizedIntegrations.includes(integration)) {
        const updatedUser = { ...user, authorizedIntegrations: [...authorizedIntegrations, integration] };
        setUser(updatedUser);
        localStorage.setItem('y8_user', JSON.stringify(updatedUser));
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('y8_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, loginWithWallet, updatePrimaryAddress, authorizeIntegration, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
