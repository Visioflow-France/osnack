/**
 * Rend un texte statique interne contenant du gras via la syntaxe **mot**.
 * Réservé aux contenus de lib/cities.ts (sources internes, aucune saisie
 * utilisateur) : pas de risque d'injection, contrairement à du HTML brut.
 */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
