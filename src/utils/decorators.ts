import chalk from "chalk";

export function logger(message: string, getFile?: (ctx: any) => string) {
    return function (target: any, name: string, descriptor: any) {
        let method = descriptor.value;
        descriptor.value = function (...args) {
            const start = Date.now();
            const file = getFile ? getFile(this) : "";
            return method.apply(this, args).then((res) => {
                console.log(chalk.yellow(`${message} ${file} 完成, 耗时${Date.now() - start}毫秒`));
                return res;
            }).catch(err => {
                console.log(chalk.red(`${message}失败`, file || err.id, err.stack))
                return null;
            })
        }

        return descriptor;
    }
}
