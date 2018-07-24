import * as React from "react";
import * as _ from "lodash";

// fabric react components
import { Persona, PersonaSize } from "office-ui-fabric-react/lib-commonjs/Persona";

// models
import { ICellType, CellContext } from "../grid/Grid";

import { StringUtils } from "../utilities/StringUtils";

/**
 * Contains the user information needed to render Persona
 */
export type User = {
    /**
     * Display name of the user
     */
    name: string;

    /**
     * Url to fetch user image
     */
    imageUrl?: string;
};

/**
 * A Persona type for Grid
 * Returns a rendered Persona card
 */
export class PersonaCell implements ICellType {
    /** Validators for use in validating updated data */
    private validators: ((value: string) => string)[];

    /**
     * Create a new type
     * @param validators Any validators desired
     */
    constructor(validators?: ((value: string) => string)[]) {
        this.validators = validators;
    }

    public render(cellData: User, context: CellContext): JSX.Element {
        if (cellData) {
            return (
                <Persona imageUrl={ cellData && cellData.imageUrl }
                    text={ cellData && cellData.name }
                    size={ PersonaSize.size32 } />
            );
        }
    }

    /**
     * Given the cell data, return the aria and data attributes to be used for screen-readers
     * @param cellData The cell data extracted through property or accessor
     */
    public getAriaAndDataAttributes(cellData: User): _.Dictionary<string> {
        return { "aria-label": this.toString(cellData) };
    }

    /**
     * Compare two strings
     * @param left The left string
     * @param right The right string
     */
    public sortComparator(left: User, right: User): number {
        return StringUtils.stringCompareOrdinalCaseInsensitive(this.toString(left), this.toString(right));
    }

    /**
     * Returns the string representation of the cell data
     * @param cellData The cell data extracted through property or accessor
     */
    public toString(cellData: User): string {
        return cellData ? cellData.name : "";
    }
}