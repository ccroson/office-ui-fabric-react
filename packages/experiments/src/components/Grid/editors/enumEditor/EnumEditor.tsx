import "./EnumEditor.scss";
import * as _ from "lodash";
import * as React from "react";

// Constants
import { Icons } from "../../constants/IconConstants";
import { KeyCode } from "../../constants/KeyboardConstants";
import { GridTheme } from "../../common/Types";

// Controls
import { BaseComponent } from "../../utilities/BaseComponent";
import { Callout, DirectionalHint } from "office-ui-fabric-react/lib-commonjs/Callout";
import { EnumCellData, EnumKey, EnumOption } from "../../types/EnumCell";
import { FocusZone, FocusZoneDirection } from "office-ui-fabric-react/lib-commonjs/FocusZone";

// Others
import { GridAction, PickerOpenedAction } from "../../actions/GridActions";

// Utilities
import { autobind } from "@uifabric/utilities/lib-commonjs/autobind";
import { css } from "@uifabric/utilities/lib-commonjs/css";
/**
 * The props for Enum editor
 */
export interface IEnumEditorProps {
    /** Enum options for the dropdown  */
    enumOptions: EnumOption[];

    /** Boolean for whether or not the callout should be opened */
    forceCalloutOpen: boolean;

    /** Pending value for the cell to possible render */
    pendingValue: string | EnumCellData;

    /** The value to display in the editor when no pendingValue is specified */
    value: EnumCellData;

    /** Width of the dropdown menu */
    width: number;

    /**
     * The delegate to be called when the value has been updated by the user
     * @param updatedValue The updated value
     */
    onValueUpdated: (updatedValue: EnumCellData) => void;

    /**
     * The delegate to be called when the value is updated by the dropdown, or the editor loses focus outside the cell
     * @param optionKey Key of EnumOption selected
     */
    onEditConfirmed: (optionKey: EnumKey) => void;

    /** The delegate to call to request the cancelling of any updates */
    onEditCancelled?: () => void;

    /**
     * The optional action performed by the user that the editor may react to
     */
    action?: GridAction;

    /**
     * Delegate to be called when cell is clicked by the user
     */
    onCellClick?: () => void;

    /**
     * Defines the default border color, selected border color, etc.
     */
    theme?: GridTheme;
}

/**
 * The state of the Enum editor
 */
export interface IEnumEditorState {
    /**
     * Is the dropdown callout open?
     */
    calloutOpened: boolean;
}

/**
 * The control to be used as a enum editor in the Grid.
 * Passes uncommitted updates to the Grid via the onValueUpdated callback
 * The Grid will automatically validate and commit updates when exiting edit mode
 */
export class EnumEditor extends BaseComponent<IEnumEditorProps, IEnumEditorState> {
    /**
     * State for EnumEditor
     * Needs to be redefined here so that it can be initialized in this class's ctor
     */
    public state: Readonly<IEnumEditorState>;
    /** The element in the dropdown that should be focused on open */
    public readonly SelectedElementRef: HTMLElement;
    /** The target for the dropdown for positioning */
    public readonly EnumEditorContainerRef: HTMLElement;
    /** Focus zone to focus when dropdown is opened */
    public readonly OptionsRef: FocusZone;

    constructor(props: IEnumEditorProps, context?: any) {
        super(props, context);

        this.state = {
            calloutOpened: props.action != null && props.action.type === PickerOpenedAction.type
        };
    }

    /**
     * Name of the component
     */
    public name(): string {
        return "EnumEditor";
    }

    /**
     * When the component updates, we want to ensure a pending value isn't being sent in in the case of typeover.
     * @param {IEnumEditorProps} prevProps Previous props
     * @param {IEnumEditorState} prevState Previous state
     */
    public componentDidUpdate(prevProps: IEnumEditorProps, prevState: IEnumEditorState): void {
        const {
            pendingValue,
            onEditCancelled,
            onEditConfirmed
        } = this.props;
        // If we get a new pending value due to type over, we want to exit edit mode afterwards.
        if (!_.isEqual(prevProps.pendingValue, pendingValue) && onEditConfirmed && onEditCancelled) {
            let found: EnumOption = this.getOptionFromPending();
            if (found) {
                // Use the option if found
                onEditConfirmed(found.key);
            } else {
                // Otherwise, cancel
                onEditCancelled();
            }
        }
    }

    /**
     * Open the callout if PickerOpenedAction was fired and callout is not currently open
     */
    public componentWillReceiveProps(nextProps: IEnumEditorProps) {
        const {
            calloutOpened
        } = this.state;

        if (nextProps.action && nextProps.action.type === PickerOpenedAction.type && !calloutOpened) {
            this.setState({ calloutOpened: true });
        }
    }

    /**
     * Render a text input with a dropdown callout
     */
    protected renderComponent(): JSX.Element {
        let val = this.getDisplayedValue();
        let iconStyle: React.CSSProperties = this.props.theme ? {
            color: this.props.theme.selectionBorderColor,
            fontSize: this.props.theme.iconSize
        } : {};
        return (
            <div
                onClick={ this.onCellClick }
                className="enum-editor"
                ref={ this.resolveRef(this, "EnumEditorContainerRef") } >
                <div
                    className="enum-editor-value"
                    onKeyDown={ this.onKeyDown }
                    onKeyPress={ this.onKeyPress }
                    onMouseDown={ (event: React.MouseEvent<HTMLElement | HTMLInputElement>) => { /*is this needed?*/event.stopPropagation(); } }>{ val }</div>
                <i
                    className={ css("ms-Icon ms-Icon--" + Icons.ChevronDownMed, "arrow-icon") }
                    style={ iconStyle }
                    onMouseDown={ (event: React.MouseEvent<HTMLElement>) => { event.preventDefault(); event.stopPropagation(); } }
                />
                { this.renderCallout() }
            </div>
        );
    }

    /**
     * Render the dropdown callout if visible
     */
    private renderCallout(): JSX.Element {
        const {
            enumOptions,
            forceCalloutOpen,
            value,
            width
        } = this.props;
        const {
            calloutOpened = false
        } = this.state;
        return (calloutOpened || forceCalloutOpen) && (
            <Callout
                isBeakVisible={ false }
                gapSpace={ 4 }
                target={ this.EnumEditorContainerRef }
                directionalHint={ DirectionalHint.bottomLeftEdge }
                onDismiss={ this.onCalloutDismissed }
                onPositioned={ () => {
                    this.OptionsRef.focus();
                    this.OptionsRef.focusElement(this.SelectedElementRef);
                } }
            >
                <div
                    className="enum-editor-options"
                    style={ { width: width } }>
                    <FocusZone
                        className="enum-editor-focus-zone"
                        direction={ FocusZoneDirection.vertical }
                        isCircularNavigation={ true }
                        onKeyPress={ this.onKeyPress }
                        onKeyDown={ this.onKeyDown }
                        ref={ this.resolveRef(this, "OptionsRef") }
                        role="menu">
                        {
                            _.map(enumOptions, (option: EnumOption) => {
                                let className: string = css("enum-editor-option", { "selected": option.key === value.selectedEnumKey });
                                return (
                                    <div
                                        className={ className }
                                        data-is-focusable={ true }
                                        key={ `${option.key}` }
                                        onClick={ (event: React.MouseEvent<HTMLElement>) => { this.onOptionSelected(event, option.key); } }
                                        ref={ option.key === value.selectedEnumKey && this.resolveRef(this, "SelectedElementRef") }
                                        role="menuitem">
                                        { option.text }
                                    </div>
                                );
                            })
                        }
                    </FocusZone>
                </div>
            </Callout>
        );
    }

    /**
     * Get the text from the cell data option that' selected to display in the editor.
     * If the editor has a pending update, we should use that. Otherwise, use the value.
     * @returns {string} The displayable value
     */
    private getDisplayedValue(): string {
        const {
            enumOptions,
            value,
            pendingValue
        } = this.props;
        if (pendingValue) {
            let found: EnumOption = this.getOptionFromPending();
            if (found) {
                return found.text;
            }
        }
        return value && _.find(enumOptions, (option: EnumOption) => { return option.key === value.selectedEnumKey; }).text;
    }

    /**
     * Get the EnumOption from the pending value.
     * @returns {EnumOption} The EnumOption that pending value is for. null if not found.
     */
    private getOptionFromPending(): EnumOption {
        const {
            enumOptions,
            pendingValue
        } = this.props;
        if (pendingValue) {
            if (_.isString(pendingValue)) {
                return _.find(enumOptions, (option: EnumOption) => { return option.text.charAt(0).toLowerCase() === pendingValue.toLowerCase(); });
            } else {
                return _.find(enumOptions, (option: EnumOption) => { return option.key === pendingValue.selectedEnumKey; });
            }
        }
        return null;
    }

    /**
     * Use key down to check if TAB was clicked and we should exit editing mode.
     * @param event Event that instantiated this callback
     */
    @autobind
    private onKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
        // We only have the dropdown in the focus zone, so any tab (forward or backward) should close the callout
        if (event.keyCode === KeyCode.TAB) {
            event.preventDefault();
            event.stopPropagation();
            this.onCalloutDismissed();
        }
    }

    @autobind
    private onKeyPress(event: React.KeyboardEvent<HTMLElement>): void {
        this.onTryUpdateSelected(String.fromCharCode(event.charCode));
    }

    /**
     * Call when the user is trying to update the selected value.
     * @param {string} character The character the user typed/pressed
     */
    private onTryUpdateSelected(character: string): void {
        const {
            enumOptions,
            onValueUpdated,
            value
        } = this.props;
        let val: EnumOption = _.find(enumOptions, (option: EnumOption) => { return option.text.charAt(0).toLowerCase() === character.charAt(0).toLowerCase(); });
        if (val) {
            let newValue = value;
            newValue.selectedEnumKey = val.key;
            onValueUpdated(newValue);
        }
    }

    /**
     * When the cell is clicked, toggle the dropdown callout
     */
    @autobind
    private onCellClick(): void {
        const {
            onCellClick
        } = this.props;

        const {
            calloutOpened
        } = this.state;

        this.setState({ calloutOpened: !calloutOpened });

        if (onCellClick) {
            onCellClick();
        }
    }

    /**
     * When an option is selected from the dropdown, send a pending update to Grid
     * @param event The event that caused a selection
     * @param optionKey The key of the option selected
     */
    @autobind
    private onOptionSelected(event: React.MouseEvent<HTMLElement>, optionKey: EnumKey): void {
        const {
            onEditConfirmed
        } = this.props;
        event.stopPropagation();

        // Send the pending update to the Grid
        onEditConfirmed(optionKey);

        // Dismiss the callout
        this.onCalloutDismissed();
    }

    /**
     * Dismiss the callout
     */
    @autobind
    private onCalloutDismissed(): void {
        const {
            onEditCancelled
        } = this.props;

        this.setState({ calloutOpened: false });
        onEditCancelled();
    }
}