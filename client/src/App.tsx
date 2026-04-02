import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { AuthForm } from './components/AuthForm'
// 1. Importamos el tipo Session para que TS sepa qué estamos guardando
import { Session } from '@supabase/supabase-js'
import './App.css'

function App() {
  // 2. Definimos que el estado puede ser una Session o null
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // 3. Comprobar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // 4. Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="App">
      <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
        <h1 style={{ color: '#007bff' }}>Wearify </h1>
      </header>

      <main style={{ padding: '1rem' }}>
        {!session ? (
          <AuthForm />
        ) : (
          <div className="dashboard">
            {/* 5. TS ahora sabe que session.user existe y tiene un email */}
            <h2>¡Hola, {session.user?.email}! </h2>
            <p>Ya puedes empezar a vender tu ropa en Wearify.</p>
            <button 
              onClick={() => supabase.auth.signOut()}
              style={{ 
                backgroundColor: '#ff4444', 
                color: 'white', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App