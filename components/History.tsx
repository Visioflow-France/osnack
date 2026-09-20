import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from './Reveal';
import { LINKS } from '@/lib/links';

// Page « Histoire du fast food » — contenu éditorial accrocheur reliant
// deux mille ans de street-food au positionnement qualité d'O'Snack.

const STATS = [
  { num: '2 000+', label: 'ans de\nrestauration rapide' },
  { num: '1921', label: 'White Castle —\n1ʳᵉ chaîne de burgers' },
  { num: '1948', label: 'McDonald\'s —\nle service express' },
  { num: '100+', label: 'pays conquis\npar la street-food' },
];

const ERAS = [
  {
    year: 'Antiquité',
    title: 'L’aïeul du fast-food',
    text:
      'À Pompéi, les thermopolia vendent déjà des plats chauds à emporter sur des comptoirs de rue. On mange debout, vite, pour pas cher. La rue nourrit la ville — et l’envie de « bon et rapide » naît bien avant l’automobile.',
  },
  {
    year: 'XIXᵉ siècle',
    title: 'La rue devient une industrie',
    text:
      'À Londres, le fish & chips devient le repas du peuple ouvrier. Aux États-Unis, les lunch wagons et les premiers diners servent les voyageurs et les usines. Manger dehors cesse d’être un luxe : c’est désormais une culture.',
  },
  {
    year: '1921',
    title: 'White Castle, l’étincelle',
    text:
      'Billy Ingram ouvre le premier restaurant pensé pour standardiser le hamburger : une petite galette, un pain, une fiabilité absolue. Naît ce jour-là la chaîne — et avec elle, un mythe américain.',
  },
  {
    year: '1948',
    title: 'La révolution Speedee',
    text:
      'Les frères McDonald inventent le Speedee Service System : la chaîne d’assemblage appliquée à la cuisine. Un hamburger servi en quelques secondes. En 1955, Ray Kroc transforme cette idée en empire planétaire.',
  },
  {
    year: '1970 — 1990',
    title: 'La conquête du monde',
    text:
      'KFC, Burger King, l’essor du drive-in et de la franchise globale. Le fast-food devient un langage universel, des autoroutes aux centres-villes, de Tokyo à Paris. Vite, partout, pareil.',
  },
  {
    year: 'Aujourd’hui',
    title: 'Le grand retour du fait-maison',
    text:
      'Burgers gourmets, kebabs, tacos, bánh mì : la street-food monte en gamme. On veut toujours la rapidité — mais avec de vrais produits, du pain grillé minute, des sauces maison. La qualité reprend ses droits.',
  },
];

export function History() {
  return (
    <section className="history section-pad" id="histoire-content">
      <div className="container">
        <Reveal className="section-label" as="div">Culture Street-Food</Reveal>

        <header className="history-head">
          <h1 className="history-title">
            L’Histoire
            <br />
            du <span className="accent">Fast-Food.</span>
            <span className="sr-only">
              {' '}
              — de la street-food au snack O'Snack de Torcy
            </span>
          </h1>
          <p className="history-lead">
            Manger vite et bien n’est pas une invention moderne. De
            l’Antiquité à nos rues, voici deux mille ans d’obsession pour le
            goût, sans jamais attendre.
          </p>
        </header>

        <div className="history-figure">
          <Image
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1400&auto=format&fit=crop&q=80"
            alt="Burger gourmet, symbole de la street-food moderne"
            fill
            sizes="(max-width: 900px) 100vw, 1200px"
          />
        </div>

        <Reveal className="history-stats" as="div">
          {STATS.map((s) => (
            <div className="history-stat" key={s.num}>
              <div className="num">{s.num}</div>
              <div className="label">{s.label}</div>
            </div>
          ))}
        </Reveal>

        <ol className="history-timeline">
          {ERAS.map((era) => (
            <Reveal as="li" className="era" key={era.year}>
              <div className="era-year">{era.year}</div>
              <div className="era-body">
                <h3 className="era-title">{era.title}</h3>
                <p className="era-text">{era.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal as="div" className="history-quote">
          « Le fast-food n’a jamais été une question de vitesse.
          C’est une question de goût — rendu accessible à tous. »
        </Reveal>

        <div className="history-torcy">
          <Reveal className="section-label" as="div">Et à Torcy ?</Reveal>
          <h2 className="history-torcy-title">
            La suite de l’histoire,
            <br />
            on l’écrit <span className="accent">au four.</span>
          </h2>
          <p className="history-torcy-text">
            C’est exactement cette idée que l’on défend chez O’Snack : le
            meilleur de la street-food, sans le compromis sur la qualité.
            Pains dorés au four, viandes savoureuses, sauces maison — tout
            est préparé minute, généreusement. Deux mille ans après Pompéi,
            la recette n’a pas changé : du bon, vite fait.
          </p>
          <div className="history-torcy-ctas">
            <Link href="/carte" className="btn" data-cursor-hover>
              Découvrir la carte <span className="btn-arrow">→</span>
            </Link>
            <a href={LINKS.phoneHref} className="btn" data-cursor-hover>
              Appeler · {LINKS.phone} <span className="btn-arrow">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
