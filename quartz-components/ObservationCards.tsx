import { QuartzComponentConstructor, QuartzComponentProps } from "./types"

type Card = {
  meta: string
  title: string
  summary: string
  href?: string
}

type Options = {
  cards: Card[]
}

export default ((opts?: Options) => {
  function ObservationCards(_props: QuartzComponentProps) {
    return (
      <div class="observation-cards">
        {(opts?.cards ?? []).map((card) => (
          <article class="observation-card">
            <span class="meta">{card.meta}</span>
            <h3>{card.href ? <a href={card.href}>{card.title}</a> : card.title}</h3>
            <p>{card.summary}</p>
          </article>
        ))}
      </div>
    )
  }

  ObservationCards.css = `
    .observation-cards {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .observation-card {
      min-height: 190px;
      border: 0.5px solid rgba(237, 233, 225, 0.15);
      border-radius: 6px;
      padding: 18px;
      background: transparent;
    }

    .observation-card h3 {
      margin-top: 24px;
      font-family: "Fraunces", Georgia, serif;
      font-size: 17px;
    }

    .observation-card p {
      color: rgba(237, 233, 225, 0.68);
      font-size: 13px;
    }

    @media (max-width: 940px) {
      .observation-cards {
        grid-template-columns: 1fr;
      }
    }
  `

  return ObservationCards
}) satisfies QuartzComponentConstructor<Options>
