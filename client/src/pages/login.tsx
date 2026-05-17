import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import logoImage from '../assets/logoWearify2_nombre.png';
import loginBg from '../assets/login-img.jpg';
import '../styles/Login.css';

export default function Login() {
  const [params] = useSearchParams();
  const [isRegister, setIsRegister] = useState(params.get('register') === 'true');
  const navigate = useNavigate();

  return (
    <div className="login-page">

      {/* ── Columna izquierda: imagen + tagline ── */}
      <div
        className="login-left"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        <div className="login-left-overlay">
          <div className="login-left-content">
            <p className="login-tagline">VISTE DIFERENTE.<br />VENDE DIFERENTE.</p>
            <p className="login-tagline-sub">
              El marketplace de moda donde cada prenda tiene una segunda oportunidad.
            </p>
          </div>
        </div>
      </div>

      {/* ── Columna derecha: formulario ── */}
      <div className="login-right">
        <div className="login-right-inner">
          <img
            src={logoImage}
            alt="Wearify"
            className="login-logo-img"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          />
          <h1 className="login-welcome">
            {isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
          </h1>
          <p className="login-welcome-sub">
            {isRegister ? 'Únete a la comunidad de Wearify' : 'Inicia sesión para continuar'}
          </p>
          <AuthForm isRegister={isRegister} setIsRegister={setIsRegister} />
          <p className="login-legal">
            Al continuar aceptas nuestros Términos y Política de privacidad.
          </p>
        </div>
      </div>

    </div>
  );
}
