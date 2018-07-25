import * as React from 'react';

import { ICellType, CellContext } from '../grid/Grid';
import { GridAction } from '../actions/GridActions';
import { ITag } from '../editors/predecessorEditor/GridTagPicker';
import { autobind } from '@uifabric/utilities/lib-commonjs/autobind';
import { PredecessorEditor } from '../editors/predecessorEditor/PredecessorEditor';

/**
 * The predecessor type for Grid
 */
export class PredecessorCell implements ICellType {
    private onFetchPredecessorSuggestions: (rowItemId: string, filterString: string) => ITag[];
    private addRemovePrdecessor: (predecessorId: string, successorId: string, link: boolean) => void;
    private suggestionsHeaderText: string;
    private noResultsFoundText: string;

    /**
     * Create an instance of PredecessorCell
     * @param onFetchPredecessorSuggestions
     *      ->  @param rowItemId Id for current row
     *      ->  @param filterString String to filter tasks by
     * @param addRemovePredecessor callback to add remove predecessors
     *       -> @param predecessorId Id for task which will be the predecessor
     *       -> @param successorId Id for task which will be the successor
     *       -> @param link Will add the predecessor if link is true or remove the predeccor if false
     */
    constructor(
        onFetchPredecessorSuggestions: (rowItemId: string, filterString: string) => ITag[],
        addRemovePredecessor: (predecessorId: string, successorId: string, link: boolean) => void,
        suggestionsHeaderText: string,
        noResultsFoundText: string
    ) {
        this.onFetchPredecessorSuggestions = onFetchPredecessorSuggestions;
        this.addRemovePrdecessor = addRemovePredecessor;
        this.suggestionsHeaderText = suggestionsHeaderText;
        this.noResultsFoundText = noResultsFoundText;
    }
    /**
     * Given the cell data, return a rendered JSX.Element. Use this for custom controls
     */
    public render(cellData: PredecessorCellData, context: CellContext): string {
        if (context.inFooterRow) {
            return;
        }
        return cellData.predecessors ? cellData.predecessors.map((predecessor: ITag) => { return predecessor.name; }).join(',') : '';
    }

    /**
     * Returns a JSX element for the cell in the edit mode
     * @param cellData - The cell data extracted through property or accessor
     * @param pendingUpdate - The pending update value to be used in the editor
     * @param action The user action performed on the cell
     * @param onValueUpdated - The delegate to be called with the updated value for this cell
     * @param onEditCancelled - The delegate to call to request the cancelling of any updates
     * @param onEditConfirmed - The delegate to call to commit an update,
     * @param context The cell context which provides additional properties, usable for rendering
     */
    public renderEditor(
        cellData: PredecessorCellData,
        pendingUpdate: string,
        action: GridAction,
        onValueUpdated: (updatedValue: string) => void,
        onEditCancelled: () => void,
        onEditConfirmed: (finalValue: string) => void,
        context: CellContext
    ): JSX.Element {
        if (context.inFooterRow) {
            return;
        }

        return (
            <PredecessorEditor
                predecessors={ cellData.predecessors }
                onFetchPredecessorSuggestions={ (searchString: string) => this.onFetchPredecessorSuggestions(cellData.taskId, searchString) }
                onAddPredecessor={ (itemId: string) => this.addRemovePrdecessor(cellData.taskId, itemId, true) }
                onRemovePredecessor={ (itemId: string) => this.addRemovePrdecessor(cellData.taskId, itemId, false) }
                suggestionsHeaderText={ this.suggestionsHeaderText }
                noResultsFoundText={ this.noResultsFoundText }
            />
        );
    }

    /**
     * Parses the raw input by the user
     * @param originalValue The cell data extracted through property or accessor
     * @param changedValue The raw input to parse to Object
     */
    @autobind
    public parseRawInput(originalValue: string, changedValue: any): string {
        return null;
    }

}

/** Data used commonly for the Predecessor Cell */
export type PredecessorCellData = {
    taskId: string;
    predecessors: ITag[];
};
