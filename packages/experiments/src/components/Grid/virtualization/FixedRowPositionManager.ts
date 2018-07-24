import { ArgumentError } from "../utilities/errors/Errors";
import { IRowPositionManager, RowBoundaries, VisibilityInformation } from "./IRowPositionManager";
import { RowRange } from "../common/Common";

/**
 * Helper class to manage and store the position of rows in a virtualized grid
 * Only supports rows with the same heights
 */
export class FixedRowPositionManager implements IRowPositionManager {
    /** The number of rows in the manager */
    private rowCount: number;

    /** The height of each row */
    private fixedRowHeight: number;

    constructor(rowCount: number, fixedRowHeight: number) {
        this.setConfiguration(rowCount, fixedRowHeight);
    }

    /**
     * Update the configuration
     */
    public setConfiguration(rowCount: number, estimatedSize: number) {
        if (estimatedSize == null || estimatedSize <= 0) {
            throw new ArgumentError("estimatedSize", "estimatedSize must be greater than 0");
        }

        if (rowCount == null || rowCount < 0) {
            throw new ArgumentError("rowCount", "rowCount must be greater than or equal to 0");
        }

        this.rowCount = rowCount;
        this.fixedRowHeight = estimatedSize;
    }

    /**
     * Get the information needed to render visible items on the page
     * @param viewportHeight The height of the viewport
     * @param scrollPosition The current scroll position with respect to grid top
     * @param topOverscan The number of extra rows to render before
     * @param bottomOverscan The number of extra rows to render after
     */
    public getVisibilityInformation(viewportHeight: number, scrollPosition: number, topOverscan: number, bottomOverscan: number): VisibilityInformation {
        if (scrollPosition < 0) {
            throw new ArgumentError("scrollPosition", "scrollPosition cannot be less than 0");
        }

        if (this.rowCount === 0) {
            return {
                range: {
                    start: 0,
                    end: 0
                },
                topHeight: 0,
                bottomHeight: 0
            };
        }

        let rowRange: RowRange = this.getVisibleRowRange(viewportHeight, scrollPosition, topOverscan, bottomOverscan);
        let topInfo: RowBoundaries = this.getRowBounds(rowRange.start);
        let bottomInfo: RowBoundaries = this.getRowBounds(rowRange.end);
        let totalSize: number = this.getCombinedRowHeight();

        return {
            range: rowRange,
            topHeight: topInfo.verticalOffset,
            bottomHeight: (totalSize - bottomInfo.verticalOffset - bottomInfo.height)
        };
    }

    /**
     * Get a range of fully visible rows, used for checking if a row is fully visible, or needs a scroll
     * @param viewportHeight The height of the viewport
     * @param scrollPosition The current scroll position with respect to grid top
     */
    public getFullyVisibleRowRange(viewportHeight: number, scrollPosition: number): RowRange {
        // using ceil since we want to start with the row which is fully visible
        let startIndex: number = Math.ceil(scrollPosition / this.fixedRowHeight);
        // ensuring startIndex is within bounds
        startIndex = Math.min(startIndex, this.rowCount - 1);
        startIndex = Math.max(0, startIndex);

        // using floor here, since we want to end on a fully visible row
        let endIndex: number = Math.floor((scrollPosition + viewportHeight) / this.fixedRowHeight) - 1;
        // ensuring endIndex is within bounds
        endIndex = Math.min(endIndex, this.rowCount - 1);
        endIndex = Math.max(0, endIndex);
        return {
            start: startIndex,
            end: endIndex
        };
    }

    /**
     * Get the size and offset of the row at a particular index
     */
    public getRowBounds(rowIndex: number): RowBoundaries {
        return {
            height: this.fixedRowHeight,
            verticalOffset: rowIndex * this.fixedRowHeight
        };
    }

    /**
     * Get the total height of all the rows
     */
    private getCombinedRowHeight(): number {
        return this.rowCount * this.fixedRowHeight;
    }

    /**
     * Get a range of visible rows
     * @param viewportHeight The height of the viewport
     * @param scrollPosition The current scroll position
     * @param topOverscan The number of extra rows to render before
     * @param bottomOverscan The number of extra rows to render after
     */
    private getVisibleRowRange(viewportHeight: number, scrollPosition: number, topOverscan: number, bottomOverscan: number): RowRange {
        let totalSize: number = this.getCombinedRowHeight();
        if (totalSize === 0) {
            return { start: -1, end: -1 };
        }

        let startIndex: number = this.findNearestRow(scrollPosition);
        let endIndex: number = startIndex + (Math.floor(viewportHeight / this.fixedRowHeight)) - 1;
        return {
            start: Math.max(0, startIndex - topOverscan),
            end: Math.min(this.rowCount - 1, endIndex + bottomOverscan)
        };
    }

    /**
     * Find the nearest row to a certain scroll offset
     * @param offset The scroll offset
     */
    private findNearestRow(offset: number): number {
        let index: number = Math.floor(offset / this.fixedRowHeight);
        return Math.min(index, this.rowCount - 1);
    }
}