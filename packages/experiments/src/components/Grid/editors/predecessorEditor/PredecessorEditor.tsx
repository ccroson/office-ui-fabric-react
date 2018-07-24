import * as React from "react";
import * as _ from "lodash";
import { initializeIcons } from '@uifabric/icons/lib-commonjs/index';

import "./PredecessorEditor.scss";

// controls
import { BaseComponent } from "../../utilities/BaseComponent";
import { GridTagPicker, ITag, ITagPickerProps } from './GridTagPicker';
import { BasePicker } from 'office-ui-fabric-react/lib-commonjs/components/pickers';

// Utilities
import { autobind } from "@uifabric/utilities/lib-commonjs/autobind";
initializeIcons();

/**
 * The props for PredecessorEditor
 */
export interface IPredecessorEditorProps {
    /**
     * The current predecessors for the item
     */
    predecessors: ITag[];

    /**
     * The header text when displaying suggestion
     */
    suggestionsHeaderText: string;

    /**
     * The text when no suggestions are found
     */
    noResultsFoundText: string;
    /**
     * The current predecessors for the item
     */
    onFetchPredecessorSuggestions: (filterString: string) => ITag[];
    /**
     * The current predecessors for the item
     */
    onAddPredecessor: (itemId: string) => void;
    /**
     * The current predecessors for the item
     */
    onRemovePredecessor: (itemId: string) => void;
}

/**
 * The state of the predecessor editor, stores the current uncommitted value
 */
export interface IPredecessorEditorState {
    currentPredecessors: ITag[];
}

/**
 * The control to be used as a predecessor editor in the Grid.
 */
export class PredecessorEditor extends BaseComponent<IPredecessorEditorProps, IPredecessorEditorState> {
    /**
     * State for PredecessorEditor
     * Needs to be redefined here so that it can be initialized in this class's ctor
     */
    public state: Readonly<IPredecessorEditorState>;

    public tagPicker: BasePicker<ITag, ITagPickerProps>;

    /**
     * Create an instance of PredecessorEditor
     * @param props Props the Editor uses
     * @param context The cell context
     */
    constructor(props: IPredecessorEditorProps, context?: any) {
        super(props, context);
        this.state = {
            currentPredecessors: props.predecessors
        };
    }

    /**
     * Name of the component
     */
    public name(): string {
        return "PredecessorEditor";
    }

    public componentDidMount() {
        this.tagPicker.focusInput();
    }

    /**
     * Render a predecessor editor
     */
    public renderComponent(): JSX.Element {
        return (
            <div className="tag-editor-container">
                <GridTagPicker
                    ref={ this.resolveRef(this, 'tagPicker') }
                    onResolveSuggestions={ this.onFilterChanged }
                    pickerSuggestionsProps={
                        {
                            suggestionsHeaderText: this.props.suggestionsHeaderText,
                            noResultsFoundText: this.props.noResultsFoundText
                        }
                    }
                    defaultSelectedItems={ this.state.currentPredecessors }
                    onChange={ this.onChange }
                />
            </div>
        );
    }

    @autobind
    private onFilterChanged(filterText: string): ITag[] {
        // Get the filtered tasks and remove the ones already selected
        let suggestions = _.filter(this.props.onFetchPredecessorSuggestions(filterText), (suggestion: ITag) => {
            return _.findIndex(this.state.currentPredecessors, suggestion) < 0;
        });

        return filterText ? suggestions : [];
    }

    /**
     * Move the cursor of the input to the end of the input on focus
     * @param event The focus event
     */
    @autobind
    private onChange(items: ITag[]) {
        const {
            currentPredecessors
        } = this.state;

        // If no changes then return
        if (currentPredecessors.length === items.length) {
            return;
        }
        // When item is added
        if (currentPredecessors.length < items.length) {
            // call on add predecessor callback
            let diff = _.difference(items, currentPredecessors);
            this.props.onAddPredecessor(diff[0].key);
        } else if (currentPredecessors.length > items.length) {
            let diff = _.difference(currentPredecessors, items);
            // call remove predecessor method
            this.props.onRemovePredecessor(diff[0].key);
        }
        this.setState({
            currentPredecessors: items
        });
    }
}