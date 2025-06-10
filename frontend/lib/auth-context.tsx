'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string | number;
  email: string;
  name?: string;
  role?: string;
  is_superuser?: boolean;

}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {

    const checkAuth = async () => {

      const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }



      try {
        const response = await fetch('http://localhost:8000/api/me/', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }else {
          // Le token est peut-être expiré, à gérer plus tard avec refresh
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const authData = await response.json();
        localStorage.setItem('accessToken', authData.access);
        localStorage.setItem('refreshToken', authData.refresh);
        localStorage.setItem('userId', authData.user.id);
        localStorage.setItem('role', authData.user.role);
        


       const meResponse = await fetch('http://localhost:8000/api/me/', {
        headers: {
        Authorization: `Bearer ${authData.access}`,
       
       },
       credentials: 'include',
        });

        if (meResponse.ok) {
          const userData = await meResponse.json();
          console.log("User data received:", userData);
          setUser(userData);
        
  
          if (userData.is_superuser === true) {
          router.push('/accueil'); 
        } else if (userData.role === 'superviseur') {
          router.push('/calendar');
        } else if (userData.role === 'controleur') {
          router.push('/planning');
        }
        }
  }
    catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:8000/api/logout/', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}