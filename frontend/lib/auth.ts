// Basic user type
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

// Mock users for development
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user',
  },
];

// Authentication functions
export const authenticateUser = (email: string, password: string): User | null => {
  // In a real app, you would validate credentials against a database
  // For mock purposes, any password works with the mock users
  const user = MOCK_USERS.find((u) => u.email === email);
  if (!user) return null;
  
  // Store user in localStorage (in a real app, use secure HTTP-only cookies)
  if (typeof window !== 'undefined') {
    localStorage.setItem('authUser', JSON.stringify(user));
    
    // Set a cookie for server-side auth checking (middleware)
    document.cookie = `authToken=${user.id}; path=/; max-age=3600; SameSite=Strict`;
  }
  
  return user;
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('authUser');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

export const logoutUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authUser');
    
    // Clear the auth cookie
    document.cookie = 'authToken=; path=/; max-age=0; SameSite=Strict';
  }
};

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
}; 