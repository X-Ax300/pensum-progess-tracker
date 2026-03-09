import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { User, Moon, Sun, Save, X } from 'lucide-react';

interface ProfileProps {
  userProfile: UserProfile | null;
  onProfileUpdate: () => void;
  onClose: () => void;
}

export function Profile({ userProfile, onProfileUpdate, onClose }: ProfileProps) {
  const { theme, setTheme } = useTheme();
  const [career, setCareer] = useState(userProfile?.career || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const profileRef = doc(db, 'userProfiles', auth.currentUser.uid);
      await setDoc(profileRef, {
        userId: auth.currentUser.uid,
        career,
        theme,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      onProfileUpdate();
      onClose();
    } catch (err) {
      setError('Error al guardar cambios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Perfil de Usuario
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Tema */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tema
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                  theme === 'light'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 shadow-md'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className="font-medium">Claro</span>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 shadow-md'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className="font-medium">Oscuro</span>
              </button>
            </div>
          </div>

          {/* Carrera */}
          <div>
            <label htmlFor="career" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Carrera
            </label>
            <select
              id="career"
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
            >
              <option value="">Selecciona una carrera</option>
              <option value="Ingeniería de Software">Ingeniería de Software</option>
              <option value="Ingeniería de Datos">Ingeniería de Datos</option>
              <option value="Ingeniería Informática">Ingeniería Informática</option>
              <option value="Ciencias de la Computación">Ciencias de la Computación</option>
              <option value="Otra">Otra</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}