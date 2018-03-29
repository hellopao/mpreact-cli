import wx, { WxApp, AppConfig } from "mpreact";

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
}