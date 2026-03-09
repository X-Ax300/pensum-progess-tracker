interface ProgressBarProps {
  percentage: number;
}

export function ProgressBar({ percentage }: Readonly<ProgressBarProps>) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso de carrera</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{percentage}% completado</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
