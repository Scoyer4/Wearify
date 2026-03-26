import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthResponse } from '@supabase/supabase-js';

export const useAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const signUp = async (email: string, pass: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const res = await supabase.auth.signUp({
        email,
        password: pass,
        options: { emailRedirectTo: window.location.origin }
      });
      if (res.error) throw res.error;
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, pass: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const res = await supabase.auth.signInWithPassword({ email, password: pass });
      if (res.error) throw res.error;
      return res;
    } finally {
      setLoading(false);
    }
  };

  return { signUp, signIn, loading };
};