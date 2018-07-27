export namespace RangeRenderers {

    /**
     * Render elements using a cache if the page is scrolling
     */
    export function cachedRenderer({ startIndex, endIndex, cache = {},
        getKey, isScrolling = false, render }: RenderRangeParameters): React.ReactNode[] {
        const renderedRange: React.ReactNode[] = [];
        for (let index: number = startIndex; index <= endIndex; index++) {
            // If we are not scrolling, update the cached entry and use the rendered item
            const key = getKey(index);
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
    export function defaultRenderer({ startIndex, endIndex, render }: RenderRangeParameters): React.ReactNode[] {
        const renderedRange: React.ReactNode[] = [];
        for (let index: number = startIndex; index <= endIndex; index++) {
            renderedRange.push(render(index));
        }

        return renderedRange;
    }
}

/** Type that defines a range renderer function */
export type RangeRenderer = (parameters: RenderRangeParameters) => React.ReactNode[];

/** Range renderer parameters */
export type RenderRangeParameters = {
    /** The initial index to start rendering at */
    startIndex: number,
    /** The final index to finish rendering at */
    endIndex: number,
    /** An optional cache of elemenets */
    cache?: _.Dictionary<React.ReactNode>,
    /** Get the key of an element */
    getKey: (index: number) => string,
    /** Is the page scrolling? */
    isScrolling?: boolean,
    /** Render an element */
    render: (index: number) => React.ReactNode
};
