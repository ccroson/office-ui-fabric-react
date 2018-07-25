import * as _ from 'lodash';

// Errors
import { ArgumentNullError } from '../utilities/errors/Errors';

import {
    CellRegionPosition,
    GridCoordinate,
    RowRange
} from './Common';

/**
 * Represents a group of cells within a Grid
 */
export class GridRegion {

    /** The initial corner of the region. Often corresponds to drag direction */
    public get primaryCoordinate(): GridCoordinate {
        return this._primaryCoordinate;
    }

    /** The end corner of the region. Opposite the primary coordinate */
    public get secondaryCoordinate(): GridCoordinate {
        return this._secondaryCoordinate;
    }

    /**
     * Get the range of columns this region spans
     */
    public get columnRange(): RowRange {
        return GridRegion._absoluteRange(this._primaryCoordinate.columnIndex, this._secondaryCoordinate.columnIndex);
    }

    /**
     * Get the range of rows this region spans
     */
    public get rowRange(): RowRange {
        return GridRegion._absoluteRange(this._primaryCoordinate.rowIndex, this._secondaryCoordinate.rowIndex);
    }
    /** The initial corner of the region. Often corresponds to drag direction */
    private _primaryCoordinate: GridCoordinate;

    /** The end corner of the region. Opposite the primary coordinate */
    private _secondaryCoordinate: GridCoordinate;

    /**
     * Compute the 'aboslute range' between two points.
     * Ex. 4 - 1 => 1 - 4
     * Ex. 1 - 4 => 1 - 4
     */
    private static _absoluteRange(r1: number, r2?: number): RowRange {
        if (r1 === null) {
            throw new ArgumentNullError('r1', 'Cannot compute absolute range with null arg r1');
        }

        if (r2 === null) {
            r2 = r1;
        }

        const smaller: number = r1 < r2 ? r1 : r2;
        const larger: number = r1 > r2 ? r1 : r2;

        return {
            start: smaller,
            end: larger
        };
    }

    /**
     * Build a new region, starting at primaryCoordinate and ending at secondaryCoordinate. If secondaryCoordinate is not provided,
     * the region will be the cell primaryCoordinate
     * @param primaryCoordinate The initial cooridnate of the region.
     * @param secondaryCoordinate The final coordinate of the region. @default primaryCoordinate
     */
    constructor(primaryCoordinate: GridCoordinate, secondaryCoordinate?: GridCoordinate) {
        if (primaryCoordinate === null) {
            throw new ArgumentNullError('primaryCoordinate');
        }

        this._primaryCoordinate = primaryCoordinate.clone();
        this._secondaryCoordinate = secondaryCoordinate ? secondaryCoordinate.clone() : primaryCoordinate.clone();
    }

    /**
     * Return all the cells in this selection from left to right, top to bottom
     */
    public cells(): GridCoordinate[] {
        const cells: GridCoordinate[] = [];
        for (let row = this.rowRange.start; row <= this.rowRange.end; row++) {
            for (let column = this.columnRange.start; column <= this.columnRange.end; column++) {
                cells.push(new GridCoordinate(row, column));
            }
        }

        return cells;
    }

    /**
     * Create a copy of the region and its coordinates
     */
    public clone(): GridRegion {
        return new GridRegion(this.primaryCoordinate, this.secondaryCoordinate);
    }

    /**
     * Given a selection that contains cells that span outside of the selection,
     * find the smallest rectangular selection that fits those cells.
     * Does not create a copy of the selection
     * @param getRowSpan Get the row span for a cell coordinate
     * @param getMappedCell A delegate that returns the mapped cell to use, for given a cell.
     * In case of empty rowspanned cells, it returns the corresponding cell having a rowspan > 1
     * @param addPartialCellsToSelection If we find a partially selected cell, should we add it to the
     * selection? @default true
     */
    public fillPartialCells(
        getRowSpan: (cellCoordinate: GridCoordinate) => number,
        getMappedCell: (cell: GridCoordinate) => GridCoordinate,
        addPartialCellsToSelection: boolean = true
    ): void {

        let movedPastPrimary = false;

        // Bottom row
        let cellToMove: GridCoordinate = this._secondaryCoordinate.rowIndex === this.rowRange.end ? this._secondaryCoordinate : this._primaryCoordinate;
        let foundPartialCell = false;
        do {
            foundPartialCell = false;
            for (let column = this.columnRange.start; column <= this.columnRange.end; column++) {
                let cell: GridCoordinate = new GridCoordinate(this.rowRange.end, column);

                // If a cell is mapped to another cell, get that cell instead
                const mappedCell: GridCoordinate = getMappedCell(cell);
                if (mappedCell) {
                    cell = mappedCell;
                }

                // Get the row span for the cell
                const rowSpan: number = getRowSpan(cell);
                if (rowSpan <= 0 || rowSpan===null) {
                    throw new Error('Received a invalid rowspan value: ' + rowSpan + ' for cell: ' + cell.toString());
                }

                if (this.rowRange.end < cell.rowIndex + (rowSpan - 1)) {
                    // Found a partial cell!
                    if (addPartialCellsToSelection) {
                        // Extend the selection downwards
                        cellToMove.rowIndex = cell.rowIndex + (rowSpan - 1);
                        foundPartialCell = true;
                    } else {
                        // Collapse the selection upwards
                        cellToMove.rowIndex = cell.rowIndex - 1;
                        foundPartialCell = true;
                        if (this._secondaryCoordinate.rowIndex < this._primaryCoordinate.rowIndex) {
                            movedPastPrimary = true;
                            foundPartialCell = false;
                        }
                    }
                }
            }
        } while (foundPartialCell);

        // Top row
        if (!movedPastPrimary) {
            cellToMove = this._secondaryCoordinate.rowIndex === this.rowRange.start ? this._secondaryCoordinate : this._primaryCoordinate;
            do {
                foundPartialCell = false;
                for (let column = this.columnRange.start; column <= this.columnRange.end; column++) {
                    let cell: GridCoordinate = new GridCoordinate(this.rowRange.start, column);

                    // If a cell is mapped to another cell, get that cell instead
                    const mappedCell: GridCoordinate = getMappedCell(cell);
                    if (mappedCell) {
                        cell = mappedCell;
                    }

                    // Get the row span for the cell
                    const rowSpan: number = getRowSpan(cell);
                    if (rowSpan <= 0 || rowSpan===null) {
                        throw new Error('Received a invalid rowspan value: ' + rowSpan + ' for cell: ' + cell.toString());
                    }

                    if (this.rowRange.start > cell.rowIndex) {
                        // Found a partial cell!
                        if (addPartialCellsToSelection) {
                            // Extend the selection upwards
                            cellToMove.rowIndex = cell.rowIndex;
                            foundPartialCell = true;
                        } else {
                            // Collapse the selection downwards
                            cellToMove.rowIndex = cell.rowIndex + rowSpan;
                            foundPartialCell = true;
                            if (this._secondaryCoordinate.rowIndex > this._primaryCoordinate.rowIndex) {
                                movedPastPrimary = true;
                                foundPartialCell = false;
                            }
                        }
                    }
                }
            } while (foundPartialCell);
        }

        // If we determined we need to clean up, call this function again and fill
        if (movedPastPrimary) {
            this.fillPartialCells(getRowSpan, getMappedCell);
        }
    }

    /**
     * Get a cell's position information within a region.
     */
    public getCellPosition(cellCoordinate: GridCoordinate, rowSpan: number = 1): CellRegionPosition {
        if (cellCoordinate===null) {
            throw new ArgumentNullError('cellCoordinate', 'Cannot get position of null cell coordinate');
        }

        const columnRange = this.columnRange;
        const rowRange = this.rowRange;
        return {
            left: columnRange.start === cellCoordinate.columnIndex,
            right: columnRange.end === cellCoordinate.columnIndex,
            top: rowRange.start === cellCoordinate.rowIndex,
            bottom: rowRange.end === cellCoordinate.rowIndex || rowRange.end === cellCoordinate.rowIndex + (rowSpan - 1),
            inRegion: this.isCellInRegion(cellCoordinate)
        };
    }

    /**
     * From the current selection and a new cell, compute a fill region.
     * @param cellCoordinate The current moused over cell
     */
    public getFillRegion(cellCoordinate: GridCoordinate): GridRegion {
        if (cellCoordinate === null) {
            throw new ArgumentNullError('cellCoordinate', 'Cannot get fill region from null coordinate');
        }

        const columnRange = this.columnRange;
        const rowRange = this.rowRange;

        if (rowRange.end < cellCoordinate.rowIndex) { // the cell is below the selection region, filling down
            return new GridRegion(new GridCoordinate(rowRange.end + 1, columnRange.start),
                new GridCoordinate(cellCoordinate.rowIndex, columnRange.end));
        } else if (rowRange.start > cellCoordinate.rowIndex) { // the cell is above the selection region, filling up
            return new GridRegion(new GridCoordinate(rowRange.start - 1, columnRange.start),
                new GridCoordinate(cellCoordinate.rowIndex, columnRange.end));
        }

        return null;
    }

    /**
     * Checks to see if this cell is contained in the current region
     */
    public isCellInRegion(cellCoordinate: GridCoordinate): boolean {
        if (cellCoordinate === null) {
            throw new ArgumentNullError('cellCoordinate', 'Cannot check a null coordinate');
        }

        const columnRange = this.columnRange;
        const rowRange = this.rowRange;

        return rowRange.start <= cellCoordinate.rowIndex &&
            rowRange.end >= cellCoordinate.rowIndex &&
            columnRange.start <= cellCoordinate.columnIndex &&
            columnRange.end >= cellCoordinate.columnIndex;
    }

    /**
     * Checks to see if the given region is overlapping with the current region
     */
    public isOverlapping(region: GridRegion): boolean {
        if (region === null) {
            throw new ArgumentNullError('region', 'Cannot check a null region');
        }

        // if given region is outside the right end of current region, or outside the left end of the current region, there is no overlap
        if (region.columnRange.start > this.columnRange.end || region.columnRange.end < this.columnRange.start) {
            return false;
        }

        // if given region is outside the bottom end of current region, or outside the top end of the current region, there is no overlap
        if (region.rowRange.start > this.rowRange.end || region.rowRange.end < this.rowRange.start) {
            return false;
        }

        return true;
    }

    /**
     * Is this region a single cell?
     */
    public isSingleCell(): boolean {
        return this.primaryCoordinate.equals(this.secondaryCoordinate);
    }

    /**
     * Checks to see if two regions are equivalent
     */
    public equals(other: GridRegion): boolean {
        return other !== null &&
            _.isEqual(other.rowRange, this.rowRange) &&
            _.isEqual(other.columnRange, this.columnRange);
    }

    /**
     * Returns a new region that is the union of this region and the provided region.
     * Uses the min and max ranges between the two regions
     * ex. (0,0), (3,5) merge (1,0), (10,4) => (0,0), (10,5)
     */
    public merge(other: GridRegion): GridRegion {
        if (other === null) {
            throw new ArgumentNullError('other', 'Cannot merge with a null region');
        }

        const rowRange: RowRange = {
            start: Math.min(this.rowRange.start, other.rowRange.start),
            end: Math.max(this.rowRange.end, other.rowRange.end)
        };

        const columnRange: RowRange = {
            start: Math.min(this.columnRange.start, other.columnRange.start),
            end: Math.max(this.columnRange.end, other.columnRange.end)
        };

        return new GridRegion(
            new GridCoordinate(rowRange.start, columnRange.start),
            new GridCoordinate(rowRange.end, columnRange.end)
        );
    }

    public toString(): string {
        return `Region: ${this.primaryCoordinate.toString()} -> ${this.secondaryCoordinate.toString()}`;
    }
}
