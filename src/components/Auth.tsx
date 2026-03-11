import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { GraduationCap } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [career, setCareer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureUserProfile(userId: string, defaultCareer = '') {
    const profileRef = doc(db, 'userProfiles', userId);
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      const profile: UserProfile = {
        id: userId,
        userId,
        career: defaultCareer,
        theme: 'light',
        createdAt: new Date().toISOString(),
      };
      await setDoc(profileRef, profile);
      return;
    }

    if (defaultCareer) {
      const currentProfile = profileSnapshot.data() as Partial<UserProfile>;
      if (!currentProfile.career) {
        await setDoc(profileRef, { career: defaultCareer }, { merge: true });
      }
    }
  }

  function getAuthErrorMessage(err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    if (message.includes('invalid-email')) {
      return 'Email no válido';
    }
    if (message.includes('user-not-found')) {
      return 'Usuario no encontrado';
    }
    if (message.includes('wrong-password')) {
      return 'Contraseña incorrecta';
    }
    if (message.includes('email-already-in-use')) {
      return 'Este email ya está registrado';
    }
    if (message.includes('weak-password')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (message.includes('popup-closed-by-user')) {
      return 'Se cerró la ventana de Google antes de completar el acceso';
    }
    if (message.includes('popup-blocked')) {
      return 'El navegador bloqueó la ventana emergente de Google';
    }
    if (message.includes('cancelled-popup-request')) {
      return 'Ya hay una solicitud de acceso con Google en progreso';
    }
    return message;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(userCredential.user.uid, career);
      }
      onAuthSuccess();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await ensureUserProfile(userCredential.user.uid);
      onAuthSuccess();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Bienvenido{!isLogin && career ? ',' : ''}
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          {isLogin
            ? 'creado por AX300'
            : career
              ? career
              : 'Selecciona tu carrera al registrarte'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-all duration-200"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="career" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Carrera
              </label>
              <select
                id="career"
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-all duration-200"
              >
                <option value="">Selecciona tu carrera</option>
                <option value="Ingeniería de Software">Ingeniería de Software</option>
                <option value="Ingeniería de Datos">Ingeniería de Datos</option>
                <option value="Ingeniería en Ciberseguridad">Ingeniería en Ciberseguridad</option>
                <option value="Ciencias de la Computación">Ciencias de la Computación</option>
                <option value="Otra">Otra</option>
              </select>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'Procesando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">o</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="w-6 h-6"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.15 0 5.97 1.09 8.2 2.88l6.13-6.13C34.62 2.68 29.67 0 24 0 14.64 0 6.6 5.48 2.69 13.44l7.52 5.84C12.13 13.23 17.64 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.1 24.5c0-1.63-.15-3.2-.42-4.7H24v8.9h12.4c-.53 2.85-2.13 5.27-4.54 6.9l7 5.44C43.77 37.07 46.1 31.37 46.1 24.5z"
            />
            <path
              fill="#FBBC05"
              d="M10.21 28.28A14.5 14.5 0 019.5 24c0-1.48.25-2.9.71-4.28l-7.52-5.84A23.94 23.94 0 000 24c0 3.87.92 7.52 2.69 10.72l7.52-5.84z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.92-2.14 15.89-5.82l-7-5.44c-1.94 1.3-4.43 2.06-8.89 2.06-6.36 0-11.87-3.73-13.79-9.06l-7.52 5.84C6.6 42.52 14.64 48 24 48z"
            />
          </svg>

          <span>Continuar con Google</span>
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
