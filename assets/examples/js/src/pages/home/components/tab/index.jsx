import {WxComponent} from "mpreact";


export default class Dialog extends WxComponent {

    static propTypes = {
        tabs: Array
    };

    template = (
        <view>
            <view>{this.props.tabs}</view>
            <slot></slot>
        </view>
    ) 

}