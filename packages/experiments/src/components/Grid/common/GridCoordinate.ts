// Errors
import { ArgumentNullError } from "../utilities/errors/Errors";

/**
 * Represents an individual cell position within the grid
 */
export class GridCoordinate {
    public rowIndex: number;
    public columnIndex: number;
    public isColumnHeaderCell: boolean;
    public isRowHeaderCell: boolean;

    constructor(rowIndex: number, columnIndex: number, isColumnHeaderCell: boolean = false, isRowHeaderCell: boolean = false) {
        if (rowIndex == null) {
            throw new ArgumentNullError("rowIndex");
        }

        if (columnIndex == null) {
            throw new ArgumentNullError("columnIndex");
        }

        this.rowIndex = rowIndex;
        this.columnIndex = columnIndex;
        this.isColumnHeaderCell = isColumnHeaderCell;
        this.isRowHeaderCell = isRowHeaderCell;
    }

    public clone(): GridCoordinate {
        return new GridCoordinate(this.rowIndex, this.columnIndex, this.isColumnHeaderCell, this.isRowHeaderCell);
    }

    public equals(other: GridCoordinate): boolean {
        return other != null && this.rowIndex === other.rowIndex && this.columnIndex === other.columnIndex && this.isColumnHeaderCell === other.isColumnHeaderCell;
    }

    public toString(): string {
        return `Row: ${this.rowIndex}, Column: ${this.columnIndex}, isHeader: ${this.isColumnHeaderCell}`;
    }
}