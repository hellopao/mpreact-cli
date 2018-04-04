import { WxComponent, WxPage, PageConfig } from "mpreact";

import Tab from "./components/tab/index";

import "../../styles/home.scss";

@PageConfig({
    backgroundColor: "#999999"
})
export default class HomePage extends WxPage {

    template = (
        <view class="container">
            <view>{this.state.name}</view>
            <Tab tabs={this.state.tabs}></Tab>
            <button bindtap={this.changeCategory}>change categoru</button>
        </view>
    )

    mounted() {
        this.setState({
            name: "frontend framework",
            tabs: ["vue", "react", "angular"]
        })
    }

    changeCategory() {
        this.setState({
            name: "frontend editor",
            tabs: ["atom", "vscode", "vim"]
        })
    }

}