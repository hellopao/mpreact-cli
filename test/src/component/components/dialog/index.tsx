import {WxComponent} from "mpreact";

import "../../styles/dialog.scss";

export default class Dialog extends WxComponent<{title: string}, {}> {

    template = (
        <view>
            <view>{this.props.title}</view>
            <slot></slot>
        </view>
    ) 

}