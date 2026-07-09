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
      border: 1px solid #d5d0c7;
      border-top: 3px solid #3f634d;
      border-radius: 6px;
      padding: 18px;
      background: #ffffff;
      color: #1a1917;
    }

    .observation-card h3 {
      margin-top: 24px;
      font-family: "Fraunces", Georgia, serif;
      font-size: 17px;
    }

    .observation-card h3 a {
      color: #315b70;
      text-decoration: underline;
      text-underline-offset: 4px;
    }

    .observation-card p {
      color: #494741;
      font-size: 13px;
    }

    .observation-card .meta {
      color: #5b5953;
    }

    @media (max-width: 940px) {
      .observation-cards {
        grid-template-columns: 1fr;
      }
    }
  `

  return ObservationCards
}) satisfies QuartzComponentConstructor<Options>
