import { Code, FileText, Bug, Lock, Zap, HelpCircle } from 'lucide-react';

const categoryIcons = {
  'type-safety': Code,
  conventions: FileText,
  quality: Bug,
  security: Lock,
  performance: Zap,
  other: HelpCircle,
};

export default function CategoryIcon({ category, className = '' }) {
  const Icon = categoryIcons[category] || categoryIcons.other;
  return <Icon className={`w-4 h-4 text-primary ${className}`} title={category} />;
}
