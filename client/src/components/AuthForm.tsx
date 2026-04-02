import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

// Definimos una interfaz para el error que devuelve Supabase
interface SupabaseAuthError {
  message: string;
  status?: number;
}

export const AuthForm: React.FC = () => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [status, setStatus] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  
  const { signIn, signUp, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    
    try {
      if (isRegister) {
        await signUp(email, password);
        setStatus({ msg: "Registro enviado. Revisa tu email o el Table Editor.", type: 'success' });
      } else {
        await signIn(email, password);
        setStatus({ msg: "Sesión iniciada correctamente.", type: 'success' });
      }
    } catch (err: unknown) {
      // Aquí eliminamos el 'any' definitivamente
      let errorMessage = "Ha ocurrido un error inesperado";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        // Hacemos un cast seguro a nuestra interfaz
        errorMessage = (err as SupabaseAuthError).message;
      }

      setStatus({ msg: errorMessage, type: 'error' });
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>{isRegister ? 'Crear cuenta en Wearify' : 'Iniciar Sesión'}</h2>
      
      {status && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          borderRadius: '4px', 
          backgroundColor: status.type === 'success' ? '#d4edda' : '#f8d7da', 
          color: status.type === 'success' ? '#155724' : '#721c24',
          fontSize: '14px',
          border: `1px solid ${status.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '200px', width: '300px',padding: '10px',gap: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label htmlFor="email">Email</label>
          <input 
            id="email"
            type="email" 
            value={email} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
            required 
            style={{ backgroundColor: '#c6c6c9', color: 'black', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label htmlFor="password">Contraseña</label>
          <input 
            id="password"
            type="password" 
            value={password} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
            required 
            style={{ backgroundColor: '#c6c6c9', color: 'black', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>

        <button 
          id='enviar'
          type="submit" 
          disabled={loading} 
          style={{ 
            padding: '12px', 
            backgroundColor: loading ? '#aab' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            marginTop: '10px'
          }}
        >
          {loading ? 'Procesando...' : isRegister ? 'Registrarse' : 'Entrar'}
        </button>
      </form>

      <button 
        onClick={() => {
          setIsRegister(!isRegister);
          setStatus(null);
        }} 
        style={{ 
          marginTop: '20px', 
          background: 'none',
          fontWeight: 'bold',
          border: 'none', 
          color: '#1385ff',
          cursor: 'pointer', 
          width: '100%',
          textAlign: 'center'
        }}
      >
        {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿Eres nuevo? Crea una cuenta'}
      </button>
    </div>
  );
};