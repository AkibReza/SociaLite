import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { api } from "../services/api";

interface UserProfile {
  _id: string;
  firebaseUid: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  preferSameGender: boolean;
  email: string;
  createdAt: string;
  currentGroup?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileExists: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Cache profile data in memory to reduce API calls
const profileCache = new Map<
  string,
  { data: UserProfile; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchUserProfile = async (user: User) => {
      if (cancelled) return;

      // Check cache first
      const cacheKey = user.uid;
      const cached = profileCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setUserProfile(cached.data);
        setProfileExists(true);
        return;
      }

      try {
        const token = await user.getIdToken();
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const response = await api.get("/api/users/profile");

        if (!cancelled) {
          setUserProfile(response.data);
          setProfileExists(true);
          // Cache the result
          profileCache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Error fetching user profile:", error);

        if (error.response?.status === 404) {
          // Profile doesn't exist yet - user needs to complete setup
          setUserProfile(null);
          setProfileExists(false);
        } else if (error.response?.status === 429) {
          // For rate limit errors, use cached data if available
          const cached = profileCache.get(user.uid);
          if (cached) {
            console.log("Using cached profile due to rate limit");
            setUserProfile(cached.data);
            setProfileExists(true);
          } else {
            setUserProfile(null);
            setProfileExists(false);
          }
        } else {
          setUserProfile(null);
          setProfileExists(false);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      setUser(user);

      if (user) {
        await fetchUserProfile(user);
      } else {
        delete api.defaults.headers.common["Authorization"];
        setUserProfile(null);
        setProfileExists(false);
      }

      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    profileCache.clear();
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return;

    const response = await api.put("/api/users/profile", profile);
    setUserProfile(response.data);
    setProfileExists(true);

    // Update cache
    profileCache.set(user.uid, {
      data: response.data,
      timestamp: Date.now(),
    });
  };

  const value = {
    user,
    userProfile,
    loading,
    profileExists,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
