import {WxComponent} from "mpreact";


export default class Dialog extends WxComponent<{tabs: string[]}, {}> {

    template = (
        <view>
            <view>{this.props.tabs}</view>
            <slot></slot>
        </view>
    ) 

}