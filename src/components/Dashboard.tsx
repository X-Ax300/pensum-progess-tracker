import { BookOpen, Award, Clock, TrendingUp, AlertCircle, LogOut, User, Moon, Sun } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { usePensum } from '../hooks/usePensum';
import { ProgressBar } from './ProgressBar';
import { StatsCard } from './StatsCard';
import { SemesterSection } from './SemesterSection';
import { useState, useCallback, useEffect } from 'react';
import { UploadPensum } from './UploadPensum';
import { Profile } from './Profile';
import { useTheme } from '../contexts/ThemeContext';


type FilterType = 'all' | 'pending' | 'in_progress' | 'completed';

export function Dashboard() {
  const { loading, error, updateSubjectStatus, updateValidatedStatus, getSubjectsWithProgress, calculateStats, refreshData, userProfile } = usePensum();
  const { theme, toggleTheme } = useTheme();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showProfile, setShowProfile] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedCareer, setSelectedCareer] = useState(userProfile?.career || '');
  const [checkingCareerPensum, setCheckingCareerPensum] = useState(false);
  const [selectedCareerPensumExists, setSelectedCareerPensumExists] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCareer(userProfile?.career || '');
  }, [userProfile?.career]);

  useEffect(() => {
    if (userProfile?.career || !selectedCareer) {
      setSelectedCareerPensumExists(false);
      setCheckingCareerPensum(false);
      return;
    }

    const checkCareerPensum = async () => {
      setCheckingCareerPensum(true);
      try {
        const pensumSnapshot = await getDoc(doc(db, 'pensum', selectedCareer));
        setSelectedCareerPensumExists(pensumSnapshot.exists());
      } catch {
        setSelectedCareerPensumExists(false);
      } finally {
        setCheckingCareerPensum(false);
      }
    };

    checkCareerPensum();
  }, [selectedCareer, userProfile?.career]);

  const handleCareerSelection = useCallback(async () => {
    if (!auth.currentUser || !selectedCareer) return;

    setOnboardingLoading(true);
    setOnboardingError(null);

    try {
      await setDoc(doc(db, 'userProfiles', auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        career: selectedCareer,
        theme,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      await refreshData(true);
    } catch {
      setOnboardingError('No se pudo guardar tu carrera. Inténtalo de nuevo.');
    } finally {
      setOnboardingLoading(false);
    }
  }, [refreshData, selectedCareer, theme]);

  const handleLogout = async () => {
    try {
      setActionError(null);
      await signOut(auth);
    } catch {
      setActionError('No se pudo cerrar sesión. Inténtalo de nuevo.');
    }
  };

  // Optimized upload handler that refreshes data after upload
  const handleUpload = useCallback(async (career: string) => {
    await refreshData(true); // Full refresh after upload
  }, [refreshData]);

  const renderLoadingState = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
        <p className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Cargando pensum...</p>
        <p className="text-gray-500 dark:text-gray-400">Preparando tu experiencia personalizada</p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          <h3 className="font-semibold text-red-900 dark:text-red-200 text-lg">Error de Conexión</h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
        <button
          onClick={() => globalThis.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          {!userProfile?.career ? (
            <>
              <div className="mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Elige tu carrera
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Primero guarda tu carrera. Si el pensum ya existe, entrarás directo; si no, luego podrás cargarlo.
                </p>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <label htmlFor="onboarding-career" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Carrera
                  </label>
                  <select
                    id="onboarding-career"
                    value={selectedCareer}
                    onChange={(e) => setSelectedCareer(e.target.value)}
                    disabled={onboardingLoading}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  >
                    <option value="">Selecciona tu carrera</option>
                    <option value="Ingeniería de Software">Ingeniería de Software</option>
                    <option value="Ingeniería de Datos">Ingeniería de Datos</option>
                    <option value="Ingeniería en Ciberseguridad">Ingeniería en Ciberseguridad</option>
                    <option value="Ciencias de la Computación">Ciencias de la Computación</option>
                    <option value="Ingeniería Civil">Ingeniería Civil</option>
                    <option value="Ingeniería Mecánica">Ingeniería Mecánica</option>
                    <option value="Ingeniería Eléctrica">Ingeniería Eléctrica</option>
                    <option value="Administración de Empresas">Administración de Empresas</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>

                {selectedCareer && !checkingCareerPensum && (
                  <div className={`rounded-lg border p-4 ${
                    selectedCareerPensumExists
                      ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                      : 'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700'
                  }`}>
                    <p className={`text-sm font-medium ${
                      selectedCareerPensumExists
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {selectedCareerPensumExists
                        ? 'Ese pensum ya está cargado. Solo guarda tu carrera para continuar.'
                        : 'Ese pensum todavía no está cargado. Guarda tu carrera y luego podrás subir el PDF.'}
                    </p>
                  </div>
                )}

                {onboardingError && (
                  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3">
                    <p className="text-sm text-red-700 dark:text-red-300">{onboardingError}</p>
                  </div>
                )}

                <button
                  onClick={handleCareerSelection}
                  disabled={!selectedCareer || checkingCareerPensum || onboardingLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {onboardingLoading
                    ? 'Guardando...'
                    : selectedCareerPensumExists
                      ? 'Guardar y continuar'
                      : 'Guardar y seguir al pensum'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  ¡Bienvenido a tu Gestor de Carrera!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {userProfile?.career
                    ? `No hay materias cargadas para ${userProfile.career}.`
                    : 'No hay materias cargadas en el sistema.'
                  }
                </p>
              </div>
              <UploadPensum
                onUpload={handleUpload}
                userCareer={userProfile?.career}
                hasPensumLoaded={false}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) return renderLoadingState();
  if (error) return renderErrorState();

  const subjectsWithProgress = getSubjectsWithProgress();
  const stats = calculateStats();

  if (subjectsWithProgress.length === 0) return renderEmptyState();

  const filteredSubjects = filter === 'all'
    ? subjectsWithProgress
    : subjectsWithProgress.filter(s => s.status === filter);

  const semesterGroups = filteredSubjects.reduce((acc, subject) => {
    if (!acc[subject.semester]) {
      acc[subject.semester] = [];
    }
    acc[subject.semester].push(subject);
    return acc;
  }, {} as Record<number, typeof subjectsWithProgress>);

  const handleStatusChange = async (code: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      setActionError(null);
      await updateSubjectStatus(code, status);
    } catch {
      setActionError('No se pudo actualizar el estado de la materia.');
    }
  };

  const handleValidatedChange = async (code: string, isValidated: boolean) => {
    try {
      setActionError(null);
      await updateValidatedStatus(code, isValidated);
    } catch {
      setActionError('No se pudo actualizar la convalidación de la materia.');
    }
  };

  const renderHeader = () => {
    const hasCareer = Boolean(userProfile?.career);
    return (
      <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div>
          <h2 className="text-lg text-gray-700 dark:text-gray-300">Bienvenido{hasCareer ? ',' : ''}</h2>
          {hasCareer && userProfile?.career && (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {userProfile.career}
            </h1>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">creado por AX300</p>
        </div>
      <div className="flex items-center gap-3 mt-4 sm:mt-0">
        {/* only shown on sm+ screens */}
        <button
          onClick={toggleTheme}
          className="hidden sm:inline p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
          title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300 transition-colors" />
          ) : (
            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300 transition-colors" />
          )}
        </button>
        <button
          onClick={() => setShowProfile(true)}
          className="hidden sm:inline p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
          title="Perfil de usuario"
        >
          <User className="w-5 h-5 text-gray-700 dark:text-gray-300 transition-colors" />
        </button>
        <button
          onClick={handleLogout}
          className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 font-medium transform hover:scale-105"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </header>
  );
  }  // end renderHeader

  const renderStats = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatsCard
        title="Créditos aprobados"
        value={`${Number.isNaN(stats.completedCredits) ? 0 : stats.completedCredits} / ${Number.isNaN(stats.totalCredits) ? 0 : stats.totalCredits}`}
        icon={Award}
        color="green"
      />
      <StatsCard
        title="Materias aprobadas"
        value={`${Number.isNaN(stats.completedSubjects) ? 0 : stats.completedSubjects} / ${Number.isNaN(stats.totalSubjects) ? 0 : stats.totalSubjects}`}
        icon={BookOpen}
        color="blue"
      />
      <StatsCard
        title="En curso"
        value={Number.isNaN(stats.inProgressSubjects) ? 0 : stats.inProgressSubjects}
        subtitle={`${Number.isNaN(stats.inProgressCredits) ? 0 : stats.inProgressCredits} créditos`}
        icon={Clock}
        color="yellow"
      />
      <StatsCard
        title="Cuatrimestres restantes"
        value={Number.isNaN(stats.estimatedSemestersRemaining) ? 0 : stats.estimatedSemestersRemaining}
        subtitle={`${Number.isNaN(stats.estimatedSemestersRemainingPrecise) ? 0 : stats.estimatedSemestersRemainingPrecise} estimados`}
        icon={TrendingUp}
        color="gray"
      />
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Todas ({subjectsWithProgress.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Pendientes ({stats.pendingSubjects})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'in_progress'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          En curso ({stats.inProgressSubjects})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Aprobadas ({stats.completedSubjects})
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderHeader()}

        {actionError && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{actionError}</p>
            </div>
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <ProgressBar percentage={stats.progressPercentage} />
        </div>

        {renderStats()}

        {renderFilters()}

        <div className="space-y-8">
          {Object.keys(semesterGroups)
            .sort((a, b) => Number(a) - Number(b))
            .map(semester => (
              <SemesterSection
                key={semester}
                semester={Number(semester)}
                subjects={semesterGroups[Number(semester)] || []}
                onStatusChange={handleStatusChange}
                onValidatedChange={handleValidatedChange}
              />
            ))}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No hay materias con este filtro</p>
          </div>
        )}
      </div>

      {showProfile && (
        <Profile
          userProfile={userProfile}
          onProfileUpdate={refreshData}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2 sm:hidden">
        <div className="flex justify-around">
          <button
            onClick={toggleTheme}
            title="Tema"
            className="p-2"
          >
            {theme === 'light' ? (
              <Moon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>
          <button
            onClick={() => setShowProfile(true)}
            title="Perfil"
            className="p-2"
          >
            <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-2"
          >
            <LogOut className="w-6 h-6 text-red-600" />
          </button>
        </div>
      </nav>
    </div>
  );
}
