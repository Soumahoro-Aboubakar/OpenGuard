import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

const config = {
  error: { icon: AlertCircle, bg: 'bg-red-100 text-red-800', label: 'Erreur' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-100 text-amber-800', label: 'Avertissement' },
  info: { icon: Info, bg: 'bg-blue-100 text-blue-800', label: 'Info' },
};

export default function ProblemBadge({ severity = 'info', className = '' }) {
  const { icon: Icon, bg, label } = config[severity] || config.info;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${bg} ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
