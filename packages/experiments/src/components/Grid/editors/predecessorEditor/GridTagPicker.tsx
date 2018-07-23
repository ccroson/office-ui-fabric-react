/* tslint:disable */
import * as React from 'react';
import { css } from 'office-ui-fabric-react/lib/Utilities';
/* tslint:enable */
import { BasePicker, IBasePickerProps } from 'office-ui-fabric-react/lib/Pickers';
import { TagItem, IPickerItemProps } from 'office-ui-fabric-react/lib/Pickers';
import * as stylesImport from 'office-ui-fabric-react/lib/components/pickers/TagPicker/TagItem.scss';
const styles: any = stylesImport;

/** The type for mapping data into the tag items */
export interface ITag {
  key: string;
  name: string;
  suggestionDisplayText: string;
}

export interface ITagPickerProps extends IBasePickerProps<ITag> {}

export class GridTagPicker extends BasePicker<ITag, ITagPickerProps> {
  protected static defaultProps = {
    onRenderItem: (props: IPickerItemProps<ITag>) => {
      return <TagItem {...props}>{props.item.name}</TagItem>;
    },
    onRenderSuggestionsItem: (props: ITag) => (
      <div className={css('ms-TagItem-TextOverflow', styles.tagItemTextOverflow)}> {props.suggestionDisplayText}</div>
    )
  };
}
