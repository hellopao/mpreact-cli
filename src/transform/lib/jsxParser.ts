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
    "bindchange",
    "bindinput",
    "bindscrolltoupper",
    "bindscrolltolower",
    "bindscroll",
    "bindgetuserinfo"
];

function getMemberExpression(expression: types.MemberExpression, context: { props: string[] }) {
    let code = generate(expression).code;
    // const objects = [];
    // let node = expression.object;
    // while (node) {
    //     objects.push(generate(node).code);
    //     node = (node as types.MemberExpression).object;
    // }

    // const ctx = objects[objects.length - 1];
    // if (ctx === 'this') {
    //     code = code.replace(/^this\.(props|state)?\.?/, '')
    // }
    code = code.replace(/(^|\b)this\.(props|state)?\.?/g, '')
    return code;
}

export function parser(code: string, context: { props: string[] }) {
    const ast = babylon.parse(code, { plugins: ['jsx'] });
    traverse(ast, {
        JSXExpressionContainer(path) {
            const { expression } = path.node;
            let code = generate(expression).code;
            //if (types.isMemberExpression(expression) && !types.isMemberExpression(path.parentPath.node)) {
                code = getMemberExpression(expression as types.MemberExpression, context);
            //}
            path.node.expression = types.identifier(`{${code}}`);
        },
        JSXAttribute(attribute) {
            const { value, name } = attribute.node;

            const attrName = name.name as string;
            if (/^wx_/.test(attrName)) {
                attribute.node.name.name = attrName.replace(/^wx_/, 'wx:').replace(/\_/g, '-');
            }

            if (attrName == 'className') {
                attribute.node.name.name = 'class';
            }

            if (value) {
                const { expression } = value as types.JSXExpressionContainer;
                if (expression) {
                    if (/^on/.test(attrName) && /^this\.(?!(state|props))/.test(generate(expression).code)) {
                        attribute.node.name.name = attrName.replace(/^on/, 'bind').toLowerCase();
                        attribute.node.value = types.stringLiteral(`${getMemberExpression(expression as types.MemberExpression, context)}`);
                    } else {
                        if (MP_EVENT_NAMES.includes(attrName)) {
                            attribute.node.value = types.stringLiteral(`${getMemberExpression(expression as types.MemberExpression, context)}`);
                        } else {
                            attribute.node.value = types.stringLiteral(`{{${getMemberExpression(expression as types.MemberExpression, context)}}}`);
                        }
                    }
                }
            }
        },
    });

    code = generate(ast).code;
    
    // TODO
    return unescape(code.replace(/\\u/g, '%u')).replace(/;$/, '');
}

export function getJsxEvents(code: string, context: { props: string[] }) {
    const events = [];
    const ast = babylon.parse(code, { plugins: ['jsx'] });
    traverse(ast, {
        JSXAttribute(attribute) {
            const { value, name } = attribute.node;
            const attrName = name.name as string;
            if (MP_EVENT_NAMES.includes(attrName) || /^on/.test(attrName) && /^this\.(?!(state|props))/.test(generate((value as types.JSXExpressionContainer).expression).code)) {
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