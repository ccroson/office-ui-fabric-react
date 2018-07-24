import * as _ from "lodash";

/** Regex for parsing out width values */
const widthRegex = /^(-?\d*(\.\d+)?)(px|\*)?$/i;

/**
 * Represents a size value in the Grid
 * Has a value and a unit
 */
export class GridSize {
    public value: number;
    public unit: GridSizeUnit;

    /**
     * Parse a width string ("200px") into a GridWidth
     * @param width The width string
     */
    public static parseSize(width: number | string): GridSize {
        if (_.isNumber(width)) {
            let widthValue = width as number;
            return new GridSize(widthValue, GridSizeUnit.Pixel);
        } else {
            let widthString: string = width as string;
            let matches = widthRegex.exec(widthString);
            if (matches != null) {
                let value = matches[1] ? Number(matches[1]) : null;
                return new GridSize(value, this.parseUnitString(matches[3]));
            }
        }

        return null;
    }

    /**
     * Parse a unit string (px) into the Unit enum
     * @param unit The unit string
     */
    public static parseUnitString(unit: string): GridSizeUnit {
        if (unit) {
            switch (unit.toLowerCase()) {
                case "*":
                    return GridSizeUnit.Flexible;
                case "px":
                    return GridSizeUnit.Pixel;
            }
        }

        return GridSizeUnit.Pixel;
    }

    private constructor(value: number, unit: GridSizeUnit) {
        this.unit = unit;
        if (this.unit === GridSizeUnit.Pixel) {
            this.value = value != null && value >= 0 ? value : 0;
        } else if (this.unit === GridSizeUnit.Flexible) {
            this.value = value != null && value >= 0 ? value : 1;
        } else {
            this.value = 0;
        }
    }
}

/**
 * Possible Grid width units
 */
export enum GridSizeUnit {
    /** Pixels (px) */
    Pixel = 1,
    /** A proportional, flexible unit (*) */
    Flexible = 2
}