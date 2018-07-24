/** Enum that describes the possible states of the Grid */
export enum GridMode {
    /** The Grid is not focused */
    None = 0,
    /** The user is dragging to select */
    Selecting = 1,
    /** The Grid has a selection */
    Select = 2,
    /** The Grid's primary cell is being edited */
    Edit = 3,
    /** The user is dragging to fill */
    Filling = 4
}

/** Describes how the Grid should handle selection events */
export enum SelectionMode {
    /** Selection events should be ignored */
    None = 0,

    /** Only one cell can be selected at a time */
    SingleCell = 1,

    /** Only one row can be selected at a time but not an individual cell */
    SingleRow = 2,

    /** Multiple cells can be selected at a time */
    MultipleCell = 3,

    /** Multiple rows can be selected at a time, but not an individual cell */
    MultipleRow = 4
}

/**
 * Represents possible virtualization modes
 */
export enum VirtualizationMode {
    /** No virtualization */
    None = 0,
    /** The Grid container will scroll itself */
    Self = 1,
    /** A scrollable parent will scroll the grid (page scroll) */
    ScrollableParent = 2
}

export type CellRegionPosition = {
    left?: boolean;
    right?: boolean;
    top?: boolean;
    bottom?: boolean;
    inRegion?: boolean;
};

export type RowRange = {
    /** The start zero based index of the range */
    start: number;

    /** The end zero based index of the range */
    end: number;
};

export type GridTheme = {

    /** The background color for the grid */
    backgroundColor: string,

    /** The border color for the grid and cells */
    borderColor: string,

    /** The background color for the primary cell in selection */
    primaryCellBackgroundColor: string,

    /** The background color for selected cells */
    selectedCellsBackgroundColor: string,

    /** The border color for selection */
    selectionBorderColor: string,

    /** The text color for selected rows and column headers  */
    selectedHeaderTextColor: string,

    /** The background color for selected rows and column headers  */
    selectedHeaderBackgroundColor: string,

    /** The text color in the grid */
    textColor: string,

    /** The size of the icons for selected cells */
    iconSize: string
};