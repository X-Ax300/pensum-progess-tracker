import { Lock, CheckCircle, Circle, Clock, Award } from 'lucide-react';
import type { SubjectWithProgress } from '../types';

interface SubjectCardProps {
  readonly subject: SubjectWithProgress;
  readonly onStatusChange: (code: string, status: 'pending' | 'in_progress' | 'completed') => void;
  readonly onValidatedChange: (code: string, isValidated: boolean) => void;
}

const statusConfig = {
  pending: {
    label: 'Pendiente',
    color: 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300',
    hoverColor: 'hover:bg-gray-200 dark:hover:bg-gray-600',
    icon: Circle,
    iconColor: 'text-gray-400 dark:text-gray-500',
  },
  in_progress: {
    label: 'En curso',
    color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200',
    hoverColor: 'hover:bg-yellow-100 dark:hover:bg-yellow-800/30',
    icon: Clock,
    iconColor: 'text-yellow-500 dark:text-yellow-400',
  },
  completed: {
    label: 'Aprobada',
    color: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600 text-green-800 dark:text-green-200',
    hoverColor: 'hover:bg-green-100 dark:hover:bg-green-800/30',
    icon: CheckCircle,
    iconColor: 'text-green-500 dark:text-green-400',
  },
};

export function SubjectCard({ subject, onStatusChange, onValidatedChange }: SubjectCardProps) {
  // If validated, use blue color, otherwise use status color
  const baseConfig = subject.isValidated
    ? {
        label: 'Convalidada',
        color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200',
        hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-800/30',
        icon: Award,
        iconColor: 'text-blue-500 dark:text-blue-400',
      }
    : statusConfig[subject.status];

  const config = baseConfig;
  const StatusIcon = config.icon;

  let nextStatus: 'pending' | 'in_progress' | 'completed';
  if (subject.status === 'pending') nextStatus = 'in_progress';
  else if (subject.status === 'in_progress') nextStatus = 'completed';
  else nextStatus = 'pending';

  const handleClick = (e: React.MouseEvent) => {
    // If clicking on the validated button, don't trigger status change
    if ((e.target as HTMLElement).closest('[data-validated-btn]')) {
      return;
    }
    if (!subject.isLocked && !subject.isValidated) {
      onStatusChange(subject.code, nextStatus);
    }
  };

  const handleValidatedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValidatedChange(subject.code, !subject.isValidated);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={subject.isLocked || subject.isValidated}
        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${config.color} ${
          subject.isLocked || subject.isValidated
            ? 'opacity-75 cursor-default'
            : `${config.hoverColor} cursor-pointer`
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {subject.isLocked ? (
              <Lock className="w-5 h-5 text-gray-400" />
            ) : (
              <StatusIcon className={`w-5 h-5 ${config.iconColor}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm leading-tight">{subject.name}</h3>
              <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded bg-white dark:bg-gray-600 bg-opacity-50 text-gray-700 dark:text-gray-300">
                {subject.credits} CR
              </span>
            </div>
            <p className="text-xs opacity-75 mb-2">{subject.code}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">{config.label}</span>
              {!subject.isValidated && subject.prerequisites.length > 0 && (
                <span className="text-xs opacity-60">
                  Req: {subject.prerequisites.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* validation toggle is outside clickable area to avoid nesting issues */}
      {!subject.isValidated && (
        <button
          type="button"
          data-validated-btn
          onClick={handleValidatedToggle}
          className="mt-2 w-full text-left text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
          title="Marcar convalidada"
        >
          Marcar convalidada
        </button>
      )}
      {subject.isValidated && (
        <button
          type="button"
          data-validated-btn
          onClick={handleValidatedToggle}
          className="mt-2 w-full text-left text-xs px-2 py-1 rounded bg-blue-200 dark:bg-blue-800/50 text-blue-900 dark:text-blue-100 hover:bg-blue-300 dark:hover:bg-blue-700/60 transition-colors font-semibold"
          title="Desmarcar convalidada"
        >
          ✓ Convalidada
        </button>
      )}
    </div>
  );
}
