import type { SubjectWithProgress } from '../types';
import { SubjectCard } from './SubjectCard';

interface SemesterSectionProps {
  semester: number;
  subjects: SubjectWithProgress[];
  onStatusChange: (code: string, status: 'pending' | 'in_progress' | 'completed') => void;
  onValidatedChange: (code: string, isValidated: boolean) => void;
}

const semesterNames = [
  'PRIMER CUATRIMESTRE',
  'SEGUNDO CUATRIMESTRE',
  'TERCER CUATRIMESTRE',
  'CUARTO CUATRIMESTRE',
  'QUINTO CUATRIMESTRE',
  'SEXTO CUATRIMESTRE',
  'SÉPTIMO CUATRIMESTRE',
  'OCTAVO CUATRIMESTRE',
  'NOVENO CUATRIMESTRE',
  'DÉCIMO CUATRIMESTRE',
  'UNDÉCIMO CUATRIMESTRE',
  'DUODÉCIMO CUATRIMESTRE',
];

export function SemesterSection({ semester, subjects = [], onStatusChange, onValidatedChange }: Readonly<SemesterSectionProps>) {
  const semesterCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {semesterNames[semester - 1] || `CUATRIMESTRE ${semester}`}
        </h2>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {semesterCredits} créditos
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map(subject => (
          <SubjectCard
            key={subject.code}
            subject={subject}
            onStatusChange={onStatusChange}
            onValidatedChange={onValidatedChange}
          />
        ))}
      </div>
    </div>
  );
}
