import './StringEditor.scss';
import * as React from 'react';

// controls
import { BaseComponent } from '../../utilities/BaseComponent';

// Utilities
import { autobind } from '@uifabric/utilities/lib-commonjs/autobind';

/**
 * The props for String editor
 */
export interface IStringEditorProps {
    /**
     * The delegate to be called when the value has been updated by the user
     * @param updatedValue - The updated value
     */
    onValueUpdated: (updatedValue: string) => void;

    /**
     * The delegate to be called when the editor wants to commit a value
     */
    onEditConfirmed: (finalValue: string) => void;

    /**
     * The value to display in the editor
     */
    value: string;
}

/**
 * The state of the String editor, stores the current uncommitted value
 */
export interface IStringEditorState {
}

/**
 * The control to be used as a string editor in the Grid.
 * Passes uncommitted updates to the Grid via the onValueUpdated callback
 * The Grid will automatically validate and commit updates when exiting edit mode
 */
export class StringEditor extends BaseComponent<IStringEditorProps, IStringEditorState> {
    constructor(props: IStringEditorProps, context?: any) {
        super(props, context);
    }

    /**
     * Name of the component
     */
    public name(): string {
        return 'StringEditor';
    }

    /**
     * Render a text input
     */
    public renderComponent(): JSX.Element {
        return (
            <input className='string-editor'
                onChange={ (event: React.FormEvent<HTMLInputElement>) => this.props.onValueUpdated((event.target as HTMLInputElement).value) }
                onClick={ (event: React.MouseEvent<HTMLInputElement>) => { event.stopPropagation(); } }
                onMouseDown={ (event: React.MouseEvent<HTMLInputElement>) => { event.stopPropagation(); } }
                onMouseUp={ (event: React.MouseEvent<HTMLInputElement>) => { event.stopPropagation(); } }
                value={ this.props.value }
                autoFocus={ true }
                onFocus={ this.moveCursorEnd }
                onBlur={ (event: React.FocusEvent<HTMLElement>) => this.onBlur(event) }
            >
            </input >
        );
    }

    /**
     * Move the cursor of the input to the end of the input on focus
     * @param event The focus event
     */
    @autobind
    private moveCursorEnd(event: React.FocusEvent<HTMLElement>) {
        let input = event.target as HTMLInputElement;
        let length = input.value.length;
        input.setSelectionRange(length, length);
    }

    /**
     * Commit the pending value when the editor loses focus
     * @param event The associated focus event
     */
    private onBlur(event: React.FocusEvent<HTMLElement>) {
        const {
            onEditConfirmed,
            value
        } = this.props;

        if (onEditConfirmed) {
            onEditConfirmed(value);
        }
    }
}