import {
    traverse,
    cutoffNodes,
    isContentEditable,
} from './traverse';
import {
    getNumbers,
    convert,
    normalize,
    toHTML,
    toText,
} from './numbers';

const selection = window.getSelection();

for (let i = 0; i < selection.rangeCount; i++){
    const range = selection.getRangeAt(i);
    if (range == null){
        continue;
    }
    if (range.collapsed){
        continue;
    }
    const r = range.cloneRange();

    const {
        text,
        nodes,
    } = traverse(r);
    const numbers = getNumbers(text);

    for (const numb of numbers){
        const {
            position,
            length,
            num,
            precision,
            exp,
        } = numb;
        // 該当ノードを切り出す
        const targetNode = cutoffNodes(position, length, nodes);

        // 単位系を変換
        const numb2 = normalize(convert(numb));

        const useHTML = !isContentEditable(targetNode);

        // ノードを得る
        if (useHTML){
            const n = toHTML(numb2);

            targetNode.parentNode!.replaceChild(n, targetNode);
        }else{
            const t = toText(numb2);

            targetNode.data = t;
        }
    }
}

// handle input selection
const {
    activeElement,
} = document;
if (activeElement != null && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')){
    const {
        selectionStart,
        selectionEnd,
        value,
    } = activeElement as HTMLInputElement;
    const v = value.substring(selectionStart, selectionEnd);

    const numbers = getNumbers(v);
    let cur = 0;
    let result = '';
    for (const num of numbers){
        const {
            position,
            length,
        } = num;
        if (cur < position){
            result += v.substring(cur, position);
            cur = position;
        }
        const t = toText(normalize(convert(num)));
        result += t;
        cur += length;
    }
    result += v.slice(cur);
    (activeElement as any).setRangeText(result);
}
