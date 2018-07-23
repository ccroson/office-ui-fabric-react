export namespace RangeRenderers {
  /**
   * Render elements using a cache if the page is scrolling
   */
  export function cachedRenderer({
    startIndex,
    endIndex,
    cache = {},
    getKey,
    isScrolling = false,
    render
  }: RenderRangeParameters): JSX.Element[] {
    let renderedRange: JSX.Element[] = [];
    for (let index: number = startIndex; index <= endIndex; index++) {
      // If we are not scrolling, update the cached entry and use the rendered item
      let key = getKey(index);
      if (!isScrolling || !cache[key]) {
        cache[key] = render(index);
      }

      renderedRange.push(cache[key]);
    }

    return renderedRange;
  }

  /**
   * Default renderer for elements
   */
  export function defaultRenderer({ startIndex, endIndex, render }: RenderRangeParameters): JSX.Element[] {
    let renderedRange: JSX.Element[] = [];
    for (let index: number = startIndex; index <= endIndex; index++) {
      renderedRange.push(render(index));
    }

    return renderedRange;
  }
}

/** Type that defines a range renderer function */
export type RangeRenderer = (parameters: RenderRangeParameters) => JSX.Element[];

/** Range renderer parameters */
export type RenderRangeParameters = {
  /** The initial index to start rendering at */
  startIndex: number;
  /** The final index to finish rendering at */
  endIndex: number;
  /** An optional cache of elemenets */
  cache?: _.Dictionary<JSX.Element>;
  /** Get the key of an element */
  getKey: (index: number) => string;
  /** Is the page scrolling? */
  isScrolling?: boolean;
  /** Render an element */
  render: (index: number) => JSX.Element;
};
