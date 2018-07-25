import './ResourceCell.scss';
import * as _ from 'lodash';
import * as React from 'react';

// Controls
import { ICellType, CellContext } from '../grid/Grid';
import { ArgumentNullError } from '../utilities/errors/ArgumentNullError';
import { ResourceEditor, IResourceEditorOptions } from '../editors/resourceEditor/ResourceEditor';
import { IResource } from '../controls/resourcePicker/IResource';
import { ResourceEditorData } from '../editors/resourceEditor/ResourceEditorData';
import { ResourcePile } from '../editors/resourceEditor/ResourcePile';

// Utilities
import { GridAction, PickerOpenedAction } from '../actions/GridActions';

/**
 * Class that handles rendering of the Facepile control inside the grid
 */
export class ResourceCell implements ICellType {
    public name = 'ResourceCell';

    private options: IResourceEditorOptions;

    /**
     * Does the cell support callout for editing, so that the grid would open it in Alt + Down
     * Ideally, this should be handled by the editor, but since we want to allow Alt + Down in Select state,
     * the grid has to listen to the event, and react to it
     */
    public get supportsCalloutForEditing(): boolean {
        return true;
    }

    /**
     * Creates an instance of ResourceCell
     * @param {IResourceEditorOptions} options the options for ResourceCell
     */
    constructor(options: IResourceEditorOptions) {
        this.options = options;
    }

    /**
     * Renderer for the cell.
     * @param {ResourceEditorData} cellData The value for the grid cell
     * @param {CellContext} context The cell context which provides additional properties, usable for rendering
     * @returns {JSX.Element} the cell JSX.Element
     */
    public render(cellData: ResourceEditorData, context: CellContext): JSX.Element {
        if (context && context.inFooterRow) {
            return;
        }
        if (!cellData) {
            throw new ArgumentNullError('cellData');
        }

        if (!cellData.rowId) {
            throw new ArgumentNullError('cellData.rowId');
        }

        if (!cellData.assignedResources) {
            throw new ArgumentNullError('cellData.assignedResources');
        }

        if (!cellData.assignedResourcesSearchList) {
            throw new ArgumentNullError('cellData.assignedResourcesSearchList');
        }

        if (!cellData.unassignedResourcesSearchLists) {
            throw new ArgumentNullError('cellData.unassignedResourcesSearchLists');
        }

        if (!context) {
            throw new ArgumentNullError('context');
        }

        return (
            <div className="resource-container" style={{ pointerEvents: 'none' }}>
                <ResourcePile resources={cellData.assignedResources} total={cellData.total} width={context.columnWidth} />
            </div>
        );
    }

    /**
     * Return a JSX.Element or string in the selected mode, when this is the primary cell in the selection
     * @param {ResourceEditorData} cellData The cell data extracted through property or accessor
     * @param {(action?: GridAction) => void} transitionToEditMode The delegate to transition the grid to edit mode. Accepts optional action that would be passed to renderEditor
     * @param {CellContext} context The cell context which provides additional properties, usable for rendering
     * @returns {JSX.Element} the JSX.Element
     */
    public renderSelected(
        cellData: ResourceEditorData,
        transitionToEditMode: (action?: GridAction) => void,
        context: CellContext
    ): JSX.Element {
        if (context.inFooterRow) {
            return;
        }
        if (context.isEditable(context.coordinate)) {
            return (
                <ResourceEditor
                    columnWidth={ context.columnWidth }
                    searchValue={ null }
                    options={ this.options }
                    value={ cellData }
                    onCellClick={ () => transitionToEditMode(new PickerOpenedAction()) }
                    theme={ context.theme }
                />
            );
        }

        return this.render(cellData, context);
    }

    /**
     * Editor for the cell.
     * @param {ResourceEditorData} cellData The value for the grid cell
     * @param {string} pendingUpdate The pending update value to be used in the editor
     * @param {GridAction} action The user action performed on the cell
     * @param {(updatedValue: any) => void} onValueUpdated The delegate to be called to save pending updates
     * @param {() => void} onEditCancelled The delegate to call to request the cancelling of any updates
     * @param {(finalValue: any) => void} onEditConfirmed The delegate to call to commit an update
     * @param {CellContext} context The cell context which provides additional properties, usable for rendering
     */
    public renderEditor(
        cellData: ResourceEditorData,
        pendingUpdate: string,
        action: GridAction,
        onValueUpdated: (updatedValue: any) => void,
        onEditCancelled: () => void,
        onEditConfirmed: (finalValue: any) => void,
        context: CellContext
    ): JSX.Element {
        if (context.inFooterRow) {
            return;
        }

        return (
            <ResourceEditor
                action={ action }
                columnWidth={ context.columnWidth }
                searchValue={ pendingUpdate }
                options={ this.options }
                value={ cellData }
                forceCalloutOpen={ true }
                onEditCancelled={ () => onEditCancelled() }
                theme={ context.theme }
            />
        );
    }

    /**
     * Returns the string representation of the cell data
     * @param {ResourceEditorData} data The cell data extracted through property or accessor.
     * @returns {string} the string representation of the cell data
     */
    public toString(data: ResourceEditorData): string {
        if (data === null) {
            return '';
        }
        return _.map(data.assignedResources, (resource: IResource) => resource.name).toString();
    }

    /**
     * Parses the raw input by the user
     * @param {ResourceEditorData} originalValue The cell data extracted through property or accessor
     * @param {any} changedValue The raw input to parse to Object
     * @returns {ResourceEditorData} the updated cell data
     */
    public parseRawInput(originalValue: ResourceEditorData, changedValue: any): ResourceEditorData {
        // No need to implement this for ResourceCell for user input because ResourceCell doesn't accept text input.
        return null;
    }
}

export { ResourceEditorData as ResourceCellData } from '../editors/resourceEditor/ResourceEditorData';
