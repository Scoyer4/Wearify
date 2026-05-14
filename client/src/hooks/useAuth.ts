import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthResponse } from '@supabase/supabase-js';

export const useAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);

  // 1. ACTUALIZADO: Añadimos 'username' como tercer parámetro
  const signUp = async (email: string, pass: string, username: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const res = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          emailRedirectTo: window.location.origin,
          data: { username },
        },
      });
      if (res.error) {
        const mensajes: Record<string, string> = {
          'user already registered':                  'Este correo ya tiene una cuenta registrada.',
          'email address is invalid':                 'El formato del correo electrónico no es válido.',
          'password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
          'signup requires a valid password':         'La contraseña no es válida.',
          'email rate limit exceeded':                'Ha habido un error. Inténtalo de nuevo más tarde.',
          'over email send rate limit':               'Ha habido un error. Inténtalo de nuevo más tarde.',
        };
        const msg = (res.error.message ?? '').toLowerCase();
        const traducido = mensajes[msg]
          ?? (msg.includes('rate limit') ? 'Ha habido un error. Inténtalo de nuevo más tarde.'
            : msg.includes('invalid')    ? 'El correo electrónico no es válido.'
            : res.error.message);
        throw new Error(traducido);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, pass: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const res = await supabase.auth.signInWithPassword({ email, password: pass });
      if (res.error) {
        if (res.error.message === 'Invalid login credentials') {
          // Determinar si el problema es el correo o la contraseña
          try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const checkRes = await fetch(`${apiUrl}/users/check-email?email=${encodeURIComponent(email)}`);
            if (checkRes.ok) {
              const { exists } = await checkRes.json();
              if (!exists) throw new Error('Este correo electrónico no está registrado.');
            }
          } catch (innerErr) {
            if (innerErr instanceof Error && innerErr.message !== 'Invalid login credentials') {
              throw innerErr;
            }
          }
          throw new Error('El correo electrónico o la contraseña son incorrectos.');
        }
        const mensajes: Record<string, string> = {
          'Email not confirmed':       'Debes confirmar tu correo antes de iniciar sesión.',
          'Email rate limit exceeded': 'Demasiados intentos. Espera unos minutos.',
          'User not found':            'No existe ninguna cuenta con ese correo.',
        };
        throw new Error(mensajes[res.error.message] ?? 'Ha ocurrido un error al iniciar sesión. Inténtalo de nuevo.');
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  return { signUp, signIn, loading };
};