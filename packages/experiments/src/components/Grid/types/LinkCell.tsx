import './LinkCell.scss';
import * as React from 'react';
import * as _ from 'lodash';

import { ICellType, CellContext } from '../grid/Grid';
import { GridAction } from '../actions/GridActions';
import { StringEditor } from '../editors/stringEditor/StringEditor';
import { StringUtils } from '../utilities/StringUtils';

/**
 * Struct that contains link information
 */
export type LinkCellData = {
    /** The display text for the link */
    linkText: string;

    /** The optional HREF for the link. If provided, this will be rendered as an <a> tag */
    href?: string;

    /** The onClick handler */
    onClick?: () => void
};

/**
 * Render a cell with a link
 */
export class LinkCell implements ICellType {
    /**
     * Return a Fabric Link element
     */
    public render(cellData: LinkCellData, context: CellContext): JSX.Element | string {
        return (
            cellData &&
            <a
                className='grid-link'
                tabIndex={ -1 }
                href={ cellData.href }
                onClick={ (event: React.MouseEvent<HTMLElement>) => {
                    event.stopPropagation();
                    if (cellData.onClick) {
                        cellData.onClick();
                    }
                } }
            >
                { this.toString(cellData) }
            </a>
        );
    }

    /**
     * Returns a JSX element for the cell in the edit mode
     * @param cellData - The cell data extracted through property or accessor
     * @param pendingUpdate - The pending update value to be used in the editor
     * @param action The user action performed on the cell
     * @param onValueUpdated - The delegate to be called with the updated value for this cell
     * @param onEditCancelled - The delegate to call to request the cancelling of any updates
     * @param onEditConfirmed - The delegate to call to commit an update
     * @param context The cell context which provides additional properties, usable for rendering
     */
    public renderEditor(
        cellData: LinkCellData,
        pendingUpdate: string,
        action: GridAction,
        onValueUpdated: (updatedValue: string) => void,
        onEditCancelled: () => void,
        onEditConfirmed: (finalValue: string) => void,
        context: CellContext
    ): JSX.Element {
        return (
            <StringEditor
                value={ pendingUpdate || cellData && this.toString(cellData) }
                onValueUpdated={ onValueUpdated }
                onEditConfirmed={ onEditConfirmed }
            />
        );
    }

    /**
     * Given the cell data, return the aria attributes to be used for screen-readers
     * @param cellData The cell data extracted through property or accessor
     */
    public getAriaAndDataAttributes(cellData: LinkCellData): _.Dictionary<string> {
        return cellData && { 'aria-label': cellData.linkText };
    }

    /**
     * Compare two link texts
     * @param left The left link
     * @param right The right link
     */
    public sortComparator(left: LinkCellData, right: LinkCellData): number {
        return StringUtils.stringCompareOrdinalCaseInsensitive(left && left.linkText, right && right.linkText);
    }

    /**
     * Returns the string representation of the cell data
     * @param cellData The cell data extracted through property or accessor
     */
    public toString(cellData: LinkCellData): string {
        return cellData.linkText;
    }

    /**
     * Parses the raw input by the user
     * @param originalValue The cell data extracted through property or accessor
     * @param changedValue The raw input to parse to Object
     */
    public parseRawInput(originalValue: LinkCellData, changedValue: any): LinkCellData {
        if (changedValue) {
            return {
                href: originalValue && originalValue.href,
                linkText: changedValue
            };
        }
    }
}
