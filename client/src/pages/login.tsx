import { AuthForm } from '../components/AuthForm';

export default function Login() {
  return (
    <div className="login-screen">
      <h1 className="logo-title login-logo-large">Wearify</h1>
      <p className="login-subtitle">Tu armario de segunda mano. Inicia sesión para entrar.</p>
      <div className="login-box">
        <AuthForm />
      </div>
    </div>
  );
}