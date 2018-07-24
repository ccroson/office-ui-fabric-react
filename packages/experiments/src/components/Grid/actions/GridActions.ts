// OneDrive:IgnoreCodeCoverage

/**
 * Represents the user actions that need to be stored in the grid and the cell editors may be interested in.
 * e.g. Picker opened, type over etc.
 */
export abstract class GridAction {
    /** The type of the action */
    public type: string;

    /** The additional data associated with the action, e.g. in case of type over, the associated character string */
    public additionalData: any;

    constructor(type: string, additionalData?: any) {
        this.type = type;
        this.additionalData = additionalData;
    }
}

/**
 * Represents the user action for picker opened either by clicking on the icon or by using alt + down in Select/Edit state
 */
export class PickerOpenedAction extends GridAction {
    /** The type of the action */
    public static type: string = "Picker_Opened";

    constructor() {
        super(PickerOpenedAction.type);
    }
}