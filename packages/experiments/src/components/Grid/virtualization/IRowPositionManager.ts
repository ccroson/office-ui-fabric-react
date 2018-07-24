import { RowRange } from "../common/Common";

/** An interface that should manage the scroll position of virtualized rows */
export interface IRowPositionManager {

    /**
     * Update the configuration
     * @param The number of rows in the manager
     * @param estimatedSize The estimated size of any given row
     */
    setConfiguration(rowCount: number, estimatedSize: number);

    /**
     * Get the information needed to render visible items on the page
     * @param height The height of the viewport
     * @param scrollPosition The current scroll position with respect to grid top
     * @param topOverscan The number of extra rows to render before
     * @param bottomOverscan The number of extra rows to render after
     */
    getVisibilityInformation(height: number, scrollPosition: number, topOverscan: number, bottomOverscan: number): VisibilityInformation;

    /**
     * Get a range of visible rows
     * @param viewportHeight The height of the viewport
     * @param scrollPosition The current scroll position with respect to grid top
     */
    getFullyVisibleRowRange(viewportHeight: number, scrollPosition: number): RowRange;

    /**
     * Get the size and offset of the row at a particular index
     */
    getRowBounds(rowIndex: number): RowBoundaries;
}

export type RowBoundaries = {
    /** The height of the row */
    height: number;

    /** The offset of the row */
    verticalOffset: number;
};

export type VisibilityInformation = {
    /** The range of rows to render */
    range: RowRange;

    /** The height of the bottom spacer */
    bottomHeight: number;

    /** The height of the top spacer */
    topHeight: number;
};