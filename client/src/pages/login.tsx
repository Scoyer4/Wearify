import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
// import logoImage from '../assets/logoWearify2_nombre.png';
import loginBg from '../assets/login-img.jpg';
import '../styles/Login.css';

export default function Login() {
  const [params] = useSearchParams();
  const [isRegister, setIsRegister] = useState(params.get('register') === 'true');

  return (
    <div className="login-page">

      {/* ── Columna izquierda: imagen + tagline ── */}
      <div
        className="login-left"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        <div className="login-left-overlay">
          <div className="login-left-content">
            <p className="login-tagline">Lo que llevas dice quién eres.</p>
            <p className="login-tagline-sub">
              El marketplace de streetwear curado por coleccionistas.
            </p>
          </div>
        </div>
      </div>

      {/* ── Columna derecha: formulario ── */}
      <div className="login-right">
        <div className="login-right-inner">
          {/* <img src={logoImage} alt="Wearify" className="login-logo-img" /> */}
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
