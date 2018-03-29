import * as ts from "typescript";
import * as babylon from "babylon";
import * as types from "babel-types";
import generate from "babel-generator";
import traverse from "babel-traverse";

const MP_EVENT_NAMES = [
    "catchtap",
    "bindtap",
    "catchtouchstart",
    "bindtouchstart",
    "catchtouchmove",
    "bindtouchmove",
    "catchtouchend",
    "bindtouchend",
    "catchtouchcancel",
    "bindtouchcancel",
    "catchlongtap",
    "bindlongtap",
    "bindinput"
];

function getMemberExpression(expression: types.MemberExpression, context: { props: string[] }) {
    let code = generate(expression).code;
    const objects = [];
    let node = expression.object;
    while (node) {
        objects.push(generate(node).code);
        node = (node as types.MemberExpression).object;
    }

    const ctx = objects[objects.length - 1];
    if (ctx === 'this') {
        code = code.replace(/^this\.(props|state)?\.?/,'')
    }
    return code;
}

export function parser(code: string, context: { props: string[] }) {
    const ast = babylon.parse(code, { plugins: ['jsx'] });
    traverse(ast, {
        JSXExpressionContainer(path) {
            const { expression } = path.node;
            let code = generate(expression).code;
            if (types.isMemberExpression(expression) && !types.isMemberExpression(path.parentPath.node)) {
                code = getMemberExpression(expression, context);
            }
            path.node.expression = types.identifier(`{${code}}`);
        },
        JSXAttribute(attribute) {
            const { value, name } = attribute.node;

            if (/^wx_/.test(name.name as string)) {
                attribute.node.name.name = (name.name as string).replace(/^wx_/, 'wx:').replace(/\_/g, '-');
            }

            if (value) {
                const { expression } = value as types.JSXExpressionContainer;
                if (expression) {
                    if (MP_EVENT_NAMES.includes(name.name as string)) { 
                        attribute.node.value = types.stringLiteral(`${getMemberExpression(expression as types.MemberExpression, context)}`);
                    } else {
                        attribute.node.value = types.stringLiteral(`{{${getMemberExpression(expression as types.MemberExpression, context)}}}`);
                    }
                }
            }
        },
    });

    // TODO
    return generate(ast).code.replace(/;$/, '');
}

export function getJsxEvents(code: string, context: { props: string[] }) {
    const events = [];
    const ast = babylon.parse(code, { plugins: ['jsx'] });
    traverse(ast, {
        JSXAttribute(attribute) {
            const { value, name } = attribute.node;
            if (MP_EVENT_NAMES.includes(name.name as string)) {
                if (value) {
                    const { expression } = value as types.JSXExpressionContainer;
                    const event = getMemberExpression(expression as types.MemberExpression, context);
                    events.push(event)
                }
            }
        },
    });

    return events;
}