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
    const r = range.cloneRange();

    const {
        text,
        nodes,
    } = traverse(r);
    console.log(text, nodes);
    const numbers = getNumbers(text);
    console.log(numbers);

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
