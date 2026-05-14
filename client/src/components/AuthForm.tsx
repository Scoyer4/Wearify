import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "./AuthForm.css";
import { createUserProfile } from "../services/api";

interface SupabaseAuthError {
  message: string;
  status?: number;
}

interface AuthFormProps {
  isRegister: boolean;
  setIsRegister: (v: boolean) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ isRegister, setIsRegister }) => {
  const [identificador, setIdentificador] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [status, setStatus] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  const { signIn, signUp, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    try {
      if (isRegister) {
        if (!identificador.includes("@")) {
          throw new Error(
            "Por favor, introduce un correo electrónico válido para registrarte.",
          );
        }
        if (!username.trim()) {
          throw new Error("Por favor, elige un nombre de usuario.");
        }

        // 1. Registramos al usuario en Supabase Auth
        const authRes = await signUp(identificador, password, username);

        // Supabase devuelve un usuario con identities vacías cuando el correo ya está registrado
        if (!authRes.data?.user || (authRes.data.user.identities?.length ?? 0) === 0) {
          throw new Error("Este correo electrónico ya está registrado.");
        }

        // 2. Si ha ido bien, guardamos sus datos en nuestra propia base de datos
        const profileRes = await createUserProfile({
          id: authRes.data.user.id,
          username: username,
          email: identificador,
        });

        if (!profileRes) {
          throw new Error("La cuenta se creó, pero hubo un error al guardar tu nombre de usuario. Contacta con soporte.");
        }

        setStatus({
          msg: "Registro completado con éxito. ¡Ya puedes iniciar sesión!",
          type: "success",
        });

        setIsRegister(false);
        setPassword("");
      } else {
        let emailParaLogin = identificador;

        if (!identificador.includes("@")) {
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
          const response = await fetch(`${apiUrl}/users/email/${identificador}`);
          if (!response.ok) {
            throw new Error("No se ha encontrado ninguna cuenta con ese nombre de usuario.");
          }
          const data = await response.json();
          emailParaLogin = data.email;
        }

        await signIn(emailParaLogin, password);
        setStatus({ msg: "Sesión iniciada correctamente.", type: "success" });
      }
    } catch (err: unknown) {
      let errorMessage = "Ha ocurrido un error inesperado";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        errorMessage = (err as SupabaseAuthError).message;
      }

      setStatus({ msg: errorMessage, type: "error" });
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">
        {isRegister ? "Crear cuenta en Wearify" : "Iniciar sesión"}
      </h2>

      {status && (
        <div className={`auth-status ${status.type}`}>{status.msg}</div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <input
            id="identificador"
            className="auth-input"
            placeholder={isRegister ? "Correo electrónico" : "Correo electrónico o usuario"}
            type={isRegister ? "email" : "text"}
            value={identificador}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setIdentificador(e.target.value)
            }
            required
          />
        </div>

        {isRegister && (
          <div className="input-group">
            <input
              id="username"
              className="auth-input"
              placeholder="Nombre de usuario"
              type="text"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              required={isRegister}
            />
          </div>
        )}

        <div className="input-group">
          <input
            id="password"
            className="auth-input"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            required
          />
        </div>

        <button
          id="enviar"
          className="submit-btn"
          type="submit"
          disabled={loading}
        >
          {loading ? "Procesando..." : isRegister ? "Registrarse" : "Entrar"}
        </button>
      </form>

      <button
        className="toggle-btn"
        type="button"
        onClick={() => {
          setIsRegister(!isRegister);
          setStatus(null);
          setIdentificador("");
          setUsername("");
          setPassword("");
        }}
      >
        {isRegister
          ? "¿Ya tienes cuenta? Inicia sesión"
          : "¿Eres nuevo? Crea una cuenta"}
      </button>
    
    </div>
  );
};
