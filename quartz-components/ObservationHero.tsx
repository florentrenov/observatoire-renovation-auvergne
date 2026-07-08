import { QuartzComponentConstructor, QuartzComponentProps } from "./types"

type Options = {
  title: string
  summary: string
  image: string
}

export default ((opts?: Options) => {
  function ObservationHero(_props: QuartzComponentProps) {
    return (
      <section class="observation-hero">
        <img src={opts?.image ?? "/assets/hero-puy-de-dome-green.png"} alt="" />
        <div class="observation-hero-inner">
          <span class="eyebrow">Auvergne · rénovation énergétique</span>
          <h1>{opts?.title ?? "Lire la rénovation depuis le sol."}</h1>
          <p>{opts?.summary}</p>
        </div>
      </section>
    )
  }

  ObservationHero.css = `
    .observation-hero {
      position: relative;
      min-height: 92vh;
      overflow: hidden;
      border-bottom: 0.5px solid rgba(237, 233, 225, 0.15);
      background: #1a1917;
    }

    .observation-hero img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: 58% center;
      opacity: 0.86;
    }

    .observation-hero::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(26, 25, 23, 0.82), rgba(26, 25, 23, 0.1));
    }

    .observation-hero-inner {
      position: relative;
      z-index: 1;
      display: grid;
      align-content: end;
      max-width: 1180px;
      min-height: 92vh;
      margin: 0 auto;
      padding: 136px 24px 64px;
    }

    .observation-hero h1 {
      max-width: 760px;
      font-family: "Fraunces", Georgia, serif;
      font-size: clamp(42px, 7vw, 82px);
      line-height: 0.98;
    }

    .observation-hero p {
      max-width: 720px;
      color: rgba(237, 233, 225, 0.86);
      font-size: 18px;
      line-height: 1.6;
    }
  `

  return ObservationHero
}) satisfies QuartzComponentConstructor<Options>
