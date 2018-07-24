import {
    GridCoordinate,
    GridRegion
} from "../common/Common";

/**
 * Public interface for working with the Grid control
 */
export interface IGrid {
    /**
     * Change the current primary cell selected
     * @param primaryCell Grid cell coordinates
     */
    changePrimaryCell(primaryCell: GridCoordinate): void;

    /**
     * Change the current cells selected
     * @param selections Grid regions to select
     */
    changeSelection(selections: GridRegion[]): void;

    /**
     * Gets the current selection of data
     */
    getDataInSelection(): Object[];
}