/*./package.json*.
 /**//*./tsconfig.json*.
 /**//*./bin/index.js*.
 /**//*./src/build.ts*.
 /**//*./src/index.ts*.
 /**//*./src/transform/lib/jsxParser.ts*.
 /**//*./src/transform/script.ts*.
 /*
*//*./src/config.ts*.
 /*

*//*./src/transform/scripts/app.ts*.
 /**//*./src/transform/scripts/component.ts*.
 /**//*./src/transform/scripts/index.ts*.
 /**//*./src/transform/scripts/page.ts*.
 /*//*./src/transform/scripts/commonModule.ts*.
 /**//*./src/transform/styles/less.ts*.
 /*
*//*./src/transform/style.ts*.
 /**//*./src/transform/styles/scss.ts*.
 /*
*//*./src/transform/styles/css.ts*.
 /*
*//*./src/utils/bundle.ts*.
 /**//*./src/utils/decorators.ts*.
 /*import chalk from "chalk";

export function logger(message: string, getFile?: (ctx: any) => string) {
    return function (target: any, name: string, descriptor: any) {
        let method = descriptor.value;
        descriptor.value = function (...args) {
            const start = Date.now();
            const file = getFile ? getFile(this) : "";
            return method.apply(this, args).then((res) => {
                console.log(chalk.green(message, file, ', 耗时', `${Date.now() - start}`, '毫秒'));
                return res;
            }).catch(err => {
                console.log(chalk.red(`${message}失败`, file || err.id, err.message))
                return null;
            })
        }

        return descriptor;
    }
}
*//*./test/src/component/app.tsx*.
 /*import wx, { WxApp, AppConfig } from "mpreact";

import "./styles/app.scss";

@AppConfig({
    pages: [
        "pages/home/index",
        "pages/welcome/index"
    ]
})
export default class TestApp extends WxApp {

    async mounted() {
        const sleep = (time) => new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, time)
        });
        await sleep(1000);
        console.log('dang~ dang~ dang~')
    }
}*//*./test/src/component/components/dialog/index.tsx*.
 /*import {WxComponent} from "mpreact";

import "../../styles/dialog.scss";

export default class Dialog extends WxComponent<{title: string}, {}> {

    template = (
        <view>
            <view>{this.props.title}</view>
            <slot></slot>
        </view>
    ) 

}*//*./test/src/component/pages/home/index.tsx*.
 /*import { WxComponent, WxPage, PageConfig } from "mpreact";

import Tab from "./components/tab/index";

import "../../styles/home.scss";

@PageConfig({
    backgroundColor: "#999999"
})
export default class HomePage extends WxPage<{}, {
    name: string;
    tabs: Array<string>;
}> {

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

}*//*./test/src/component/pages/welcome/components/greet/index.tsx*.
 /*import wx, { WxComponent } from "mpreact";
import Dialog from "../../../../components/dialog/index";

export default class Greet extends WxComponent<{ message: string }, { currentTab: number }> {

    template = (
        <view>
            <Dialog title="greet">
                <view>{this.props.message}</view>
                <view bindtap={this.showMessage}>{this.props.message}</view>
            </Dialog>
        </view>
    )

   
    showMessage(e) {
        wx.showModal({ content: this.props.message, title: "tip" });
    }
}*//*./test/src/component/pages/welcome/index.tsx*.
 /*import { WxComponent, WxPage, PageConfig } from "mpreact";

import Greet from "./components/greet/index";

import "../../styles/welcome.scss";

export default class HomePage extends WxPage<{}, {
    name: string;
    person: {age: number; work: string;}
}> {

    template = (
        <view>
            <view>{this.state.name}, {this.state.person.work}</view>
            <Greet message={"hello world!!"}></Greet>
        </view>
    )


    mounted() {
        this.setState({
            name: "paopao",
            person: {
                age: 28,
                work: "soft engineer"
            }
        })
    }
    

}*//*./test/src/component/styles/app.scss*.
 /*@import "./main.scss";*//*./test/src/component/styles/base.scss*.
 /*.flex {
    display: flex;
}

@for $i from 1 through 4 {
    .flex-#{$i} {
        flex: #{$i};
    }
}*//*./test/src/component/pages/home/components/tab/index.tsx*.
 /*import {WxComponent} from "mpreact";

export default class Tab extends WxComponent<{tabs: string[]}, {currentTab: number}> {

    template = (
        <view>
            <view wx_for={this.props.tabs} wx_key={index}>
                <view>{item}</view>
            </view>
        </view>
    );

}*//*./test/src/component/styles/dialog.scss*.
 /*.dialog {
    background: gray;
}*//*./test/src/component/styles/home.scss*.
 /*@import "base.scss";

.container {
    background: #aaa;
}*//*./test/src/component/styles/main.scss*.
 /*.flex {
    display: flex;
}

.flex-1 {
    flex: 1;
}*//*./test/src/component/styles/welcome.scss*.
 /*@import "./base.scss";
.container {
    background: pink;
}*//*./test/src/helloworld/app.tsx*.
 /*import wx, { WxApp, AppConfig } from "mpreact";

import "./styles/app.css";

@AppConfig({
    pages: [
        "pages/home/index"
    ]
})
export default class TestApp extends WxApp {

    async mounted() {
        const sleep = (time) => new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, time)
        });
        await sleep(1000);
        console.log('dang~ dang~ dang~')
    }
}*//*./test/src/helloworld/styles/app.css*.
 /*@import "./main.wxss";*//*./test/src/helloworld/pages/home/index.tsx*.
 /*import { WxComponent, WxPage, PageConfig } from "mpreact";

import "../../styles/home.css";

@PageConfig({
    backgroundColor: "#999999"
})
export default class HomePage extends WxPage<{}, {
    title: string;
}> {

    state = {
        title: "hello world"
    }

    template = (
        <view class="container">
            <view>{this.state.title}</view>
        </view>
    )

    mounted() {
       
    }

}*//*./test/src/helloworld/styles/main.css*.
 /*.flex {
    display: flex;
}

.flex-1 {
    flex: 1;
}*//*./test/src/js/app.js*.
 /*import wx, { WxApp, AppConfig } from "mpreact";

import "./styles/app.scss";

@AppConfig({
    pages: [
        "pages/home/index"
    ]
})
export default class TestApp extends WxApp {

    async mounted() {
        const sleep = (time) => new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, time)
        });
        await sleep(1000);
        console.log('dang~ dang~ dang~ dang~ dang~')
    }
}*//*./test/src/js/jsconfig.json*.
 /*{
    "compilerOptions": {
      "target": "es2015",                          
      "module": "commonjs",                     
      "jsx": "preserve",                     
      "strictNullChecks": false,
      "experimentalDecorators": true
    }
}*//*./test/src/js/pages/home/index.jsx*.
 /*import { WxComponent, WxPage, PageConfig } from "mpreact";

import Tab from "./components/tab/index";
import "../../styles/home.scss";

@PageConfig({
    backgroundColor: "#999999"
})
export default class HomePage extends WxPage {

    template = (
        <view class="container">
            <view>{this.state.title}</view>
            <view>hello world</view>
            <view>hello world</view>
            <view>hello world</view>
            <view>hello world</view>
            <view>hello world</view>
            <view>hello world</view>
            <view>hello world</view>
            <Tab tabs={["js", "css", "html"]}></Tab>
        </view>
    )

    mounted() {
        this.setState({
            title: "hello pao"
        })
    }

}*//*./test/src/js/pages/home/components/tab/index.jsx*.
 /*import {WxComponent} from "mpreact";
import "../../../../styles/main.scss"

export default class Tab extends WxComponent {

    static propTypes = {
        tabs: Array
    }

    template = (
        <view class="flex">
            <view wx_for={this.props.tabs} wx_key={index} class="flex-1">
                {item}
            </view>
        </view>
    );

}*//*./test/src/helloworld/styles/home.css*.
 /*@import "./main.wxss";

.container {
    background: #aaa;
}*//*./test/src/js/styles/home.scss*.
 /*@import "./main.scss";

.container {
    background: #aaa;
}*//*./test/src/sass/app.tsx*.
 /*import wx, { WxApp, AppConfig } from "mpreact";

import "./styles/app.scss";

@AppConfig({
    pages: [
        "pages/home/index",
        "pages/welcome/index"
    ]
})
export default class TestApp extends WxApp {

    async mounted() {
        const sleep = (time) => new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, time)
        });
        await sleep(1000);
        console.log('dang~ dang~ dang~')
    }
}*//*./test/src/js/styles/main.scss*.
 /*.flex {
    display: flex;
}

.flex-1 {
    flex: 1;
}*//*./test/src/sass/components/dialog/index.tsx*.
 /*import {WxComponent} from "mpreact";

import "../../styles/dialog.scss";

export default class Dialog extends WxComponent<{title: string}, {}> {

    template = (
        <view>
            <view>{this.props.title}</view>
            <slot></slot>
        </view>
    ) 

}*//*./test/src/sass/pages/home/index.tsx*.
 /*import { WxComponent, WxPage, PageConfig } from "mpreact";

import Tab from "./components/tab/index";

import "../../styles/home.scss";

@PageConfig({
    backgroundColor: "#999999"
})
export default class HomePage extends WxPage<{}, {
    name: string;
    tabs: Array<string>;
}> {

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

}*//*./test/src/sass/pages/welcome/components/greet/index.tsx*.
 /*import wx, { WxComponent } from "mpreact";
import Dialog from "../../../../components/dialog/index";

export default class Greet extends WxComponent<{ message: string }, { currentTab: number }> {

    template = (
        <view>
            <Dialog title="greet">
                <view>{this.props.message}</view>
                <view bindtap={this.showMessage}>{this.props.message}</view>
            </Dialog>
        </view>
    )

   
    showMessage(e) {
        wx.showModal({ content: this.props.message, title: "tip" });
    }
}*//*./test/src/sass/pages/home/components/tab/index.tsx*.
 /*import {WxComponent} from "mpreact";

export default class Tab extends WxComponent<{tabs: string[]}, {currentTab: number}> {

    template = (
        <view>
            <view wx_for={this.props.tabs} wx_key={index}>
                <view>{item}</view>
            </view>
        </view>
    );

}*//*./test/src/sass/pages/welcome/index.tsx*.
 /*import { WxComponent, WxPage, PageConfig } from "mpreact";

import Greet from "./components/greet/index";

import "../../styles/welcome.scss";

export default class HomePage extends WxPage<{}, {
    name: string;
    person: {age: number; work: string;}
}> {

    template = (
        <view>
            <view>{this.state.name}, {this.state.person.work}</view>
            <Greet message={"hello world!!"}></Greet>
        </view>
    )


    mounted() {
        this.setState({
            name: "paopao",
            person: {
                age: 28,
                work: "soft engineer"
            }
        })
    }
    

}*//*./test/src/js/styles/app.scss*.
 /*@import "./main.scss";*//*./test/src/sass/styles/app.scss*.
 /*@import "./main.scss";*//*./test/src/sass/styles/home.scss*.
 /*@import "base.scss";

.container {
    background: #aaa;
}*//*./test/src/sass/styles/dialog.scss*.
 /*.dialog {
    background: gray;
}*//*./test/src/sass/styles/main.scss*.
 /*.flex {
    display: flex;
}

.flex-1 {
    flex: 1;
}*//*./test/src/sass/styles/base.scss*.
 /*.flex {
    display: flex;
}

@for $i from 1 through 4 {
    .flex-#{$i} {
        flex: #{$i};
    }
}*//*./test/src/sass/styles/welcome.scss*.
 /*@import "./base.scss";
.container {
    background: pink;
}*/