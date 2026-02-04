/**
 * Badge coloré affichant le score /100 avec couleur selon performance
 * excellent 86-100: green, bien 71-85: yellow, moyen 41-70: orange, critique 0-40: red
 */
export default function ScoreBadge({ score, className = '' }) {
  const s = Number(score);
  let bg = 'bg-score-critical text-white';
  if (s >= 86) bg = 'bg-score-excellent text-white';
  else if (s >= 71) bg = 'bg-score-good text-white';
  else if (s >= 41) bg = 'bg-score-medium text-white';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-lg font-bold ${bg} ${className}`}
      title="Score de qualité"
    >
      {s}/100
    </span>
  );
}
