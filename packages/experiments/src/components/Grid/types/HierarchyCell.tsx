import './HierarchyCell.scss';
import * as React from 'react';
import * as _ from 'lodash';

import { css, IDictionary } from '@uifabric/utilities/lib-commonjs/css';
import { ICellType, CellContext } from '../grid/Grid';
import { getRTL } from '@uifabric/utilities/lib-commonjs/rtl';
import { GridAction } from '../actions/GridActions';

/**
 * Type that contains hierarchy data necessary for rendering
 * a hierarchy cell
 */
export type HierarchyCellData = {
    /** The wrapped data to render */
    cellData: any;

    /** Used to identify the row data this hierarchy cell is part of */
    id: string;

    /** Is this node expanded? */
    expanded: boolean;

    /** Does this node have children? */
    hasChildren: boolean;

    /** Number of sibling rows, inclusive, set for accessibility properties */
    siblingCount?: number;

    /** The indentation level for this node */
    indentationLevel: number;

    /** Current position in the set of siblings, set for accessibility properties */
    siblingPosition?: number;
};

/**
 * Render another cell type with a hierarchy chevron
 */
export class HierarchyCell implements ICellType {

    private underlyingCellType: ICellType;
    private onNodeCollapsed: (node: HierarchyCellData) => void;
    private onNodeExpanded: (node: HierarchyCellData) => void;

    /**
     * @param underlyingCellType The type that HierarchyCell wraps
     * @param onNodeCollapsed Called when the user clicks the chevron to collapse
     * @param onNodeExpanded Called when the user clicks the chevron to expand
     */
    constructor(underlyingCellType: ICellType, onNodeCollapsed: (node: HierarchyCellData) => void, onNodeExpanded: (node: HierarchyCellData) => void) {
        this.underlyingCellType = underlyingCellType;
        this.onNodeCollapsed = onNodeCollapsed;
        this.onNodeExpanded = onNodeExpanded;
    }

    /**
     * Given the cell data, return a rendered JSX.Element
     * @param cellData The cell data extracted through property or accessor
     * @param context The cell context which provides additional properties, usable for rendering
     */
    public render(cellData: HierarchyCellData, context: CellContext): JSX.Element | string {
        return this.renderWrapper(
            cellData,
            this.underlyingCellType.render(cellData && cellData.cellData, context),
            context
        );
    }

    /**
     * Calls the underlying type's sort comparator
     */
    public sortComparator(left: HierarchyCellData, right: HierarchyCellData): number {
        if (this.underlyingCellType.sortComparator) {
            return this.underlyingCellType.sortComparator(left.cellData, right.cellData);
        }
    }

    /**
     * Calls the underlying default validator
     * @param value The value to validate
     */
    public validate(value: HierarchyCellData): string {
        if (this.underlyingCellType.validate) {
            return this.underlyingCellType.validate(value.cellData);
        }
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
        cellData: HierarchyCellData,
        pendingUpdate: string,
        action: GridAction,
        onValueUpdated: (updatedValue: Object) => void,
        onEditCancelled: () => void,
        onEditConfirmed: (finalValue: Object) => void,
        context: CellContext
    ): JSX.Element {
        if (this.underlyingCellType.renderEditor) {
            return this.renderWrapper(
                cellData,
                this.underlyingCellType.renderEditor(
                    cellData && cellData.cellData,
                    pendingUpdate,
                    action,
                    onValueUpdated,
                    onEditCancelled,
                    onEditConfirmed,
                    context
                ),
                context
            );
        }

        return this.renderWrapper(
            cellData,
            this.underlyingCellType.render(cellData && cellData.cellData, context),
            context
        );
    }

    /**
     * Return a JSX.Element or string in the selected mode
     * @param cellData The cell data extracted through property or accessor
     * @param transitionToEditMode The delegate to transition the grid to edit mode. Accepts optional action that would be passed to renderEditor
     * @param context The cell context which provides additional properties, usable for rendering
     */
    public renderSelected(
        cellData: HierarchyCellData,
        transitionToEditMode: (action?: GridAction) => void,
        context: CellContext
    ): JSX.Element | string {
        if (this.underlyingCellType.renderSelected) {
            return this.renderWrapper(
                cellData,
                this.underlyingCellType.renderSelected(cellData && cellData.cellData, transitionToEditMode, context),
                context
            );
        }

        return this.render(cellData, context);
    }

    /**
     * Given the data, return the aria attributes to be used for screen-readers
     * @param cellData The cell data extracted through property or accessor
     */
    public getAriaAndDataAttributes(cellData: HierarchyCellData): _.Dictionary<string> {
        const hierarchyCellAria = {
            'aria-expanded': cellData && cellData.expanded,
            'aria-level': cellData && cellData.indentationLevel + 1  // Indentation level is 0 based, but the intial level is 1
        };

        if (cellData && cellData.siblingCount != null) {
            hierarchyCellAria['aria-setsize'] = cellData.siblingCount;
        }

        if (cellData && cellData.siblingPosition != null) {
            hierarchyCellAria['aria-posinset'] = cellData.siblingPosition;
        }

        return _.merge(this.underlyingCellType.getAriaAndDataAttributes(cellData && cellData.cellData), hierarchyCellAria);
    }

    /**
     * Returns the string representation of the cell data
     * @param cellData The cell data extracted through property or accessor
     */
    public toString(cellData: HierarchyCellData): string {
        return this.underlyingCellType.toString(cellData && cellData.cellData);
    }

    /**
     * Parses the raw input by the user
     * @param originalValue The cell data extracted through property or accessor
     * @param changedValue The raw input to parse to Object
     */
    public parseRawInput(originalValue: HierarchyCellData, changedValue: any): Object {
        return this.underlyingCellType.parseRawInput ? this.underlyingCellType.parseRawInput(originalValue.cellData, changedValue != null && changedValue.cellData != null ? changedValue.cellData : changedValue) : changedValue;
    }

    /**
     * Render the hierarchy wrapper around a child element
     * @param cellData The cell data with which to render the hierarchy information
     * @param children The element to wrap
     * @param context The cell context which provides additional properties, usable for rendering
     */
    private renderWrapper(cellData: HierarchyCellData, children: JSX.Element | string, context: CellContext): JSX.Element {
        return (
            <div className="hierarchy-cell" style={ getRTL() ? { paddingRight: cellData && cellData.indentationLevel + 'em' } : { paddingLeft: cellData && cellData.indentationLevel + 'em' } }>
                { this.renderTreeChevron(cellData, context) }
                <span className="wrapped-content">
                    { children }
                </span>
            </div>
        );
    }

    /**
     * Render the tree chevron based on the hierarchy data
     * @param node The hierarchy data
     * @param context The cell context which provides additional properties, usable for rendering
     */
    private renderTreeChevron(node: HierarchyCellData, context: CellContext): JSX.Element {
        const showChevron: boolean = node && node.hasChildren;
        const rtl: boolean = getRTL();
        const chevronCssMapping: IDictionary = {
            'ms-Icon--ChevronRightMed': !rtl,
            'ms-Icon--ChevronLeftMed': rtl,
            'expanded': node && node.expanded,
            'chevron-hidden': !showChevron
        };
        return (
            <div
                className={ css('chevron-wrapper', { 'has-children': showChevron }) }
                onClick={ showChevron ? (event: React.MouseEvent<HTMLElement>) => {
                    event.stopPropagation(); // stop onRowClick from being fired
                    this.toggleRowExpansion(node);
                } : null }
                onMouseDown={ (event: React.MouseEvent<HTMLElement>) => {
                    // If this is the only selected cell, we want to stop the event propagation,
                    // since we do not want to put the cell in edit mode.
                    if (context.isSelected(context.coordinate) && context.isSelectionSingleCell()) {
                        event.stopPropagation();
                    }
                } }
            >
                <i className={ css('chevron', 'ms-Icon', chevronCssMapping) } />
            </div>
        );
    }

    /**
     * Called when a chevron is clicked for a node
     * Calls the onNodeCollapsed or onNodeExpanded handlers
     * @param node The clicked node
     */
    private toggleRowExpansion(node: HierarchyCellData): void {
        if (node) {
            if (node.expanded && this.onNodeCollapsed) {
                this.onNodeCollapsed(node);
            } else if (!node.expanded && this.onNodeExpanded) {
                this.onNodeExpanded(node);
            }
        }
    }
}
