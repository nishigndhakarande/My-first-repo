import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, api } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    // Check initial session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          const prof = await api.getProfile(initialSession.user.id);
          if (prof?.is_active === false) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
          } else {
            setProfile(prof);
          }
        }
      } catch (err) {
        console.warn('Auth init check error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        setUser(currentSession.user);
        try {
          const prof = await api.getProfile(currentSession.user.id);
          if (prof?.is_active === false) {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
          } else {
            setProfile(prof);
          }
        } catch (e) {
          console.warn('Error fetching profile on state change:', e.message);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      const prof = await api.getProfile(data.user.id);
      if (prof?.is_active === false) {
        await supabase.auth.signOut();
        throw new Error('Your account is inactive. Please contact your administrator.');
      }
      setProfile(prof);
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setActiveProject(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        login,
        logout,
        activeProject,
        setActiveProject,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
