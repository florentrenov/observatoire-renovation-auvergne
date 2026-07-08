export type QuartzComponentProps = Record<string, unknown>

export type QuartzComponent = {
  (props: QuartzComponentProps): JSX.Element
  css?: string
}

export type QuartzComponentConstructor<Options = undefined> = (
  opts?: Options,
) => QuartzComponent
