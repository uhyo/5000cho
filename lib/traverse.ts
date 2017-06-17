// range traverser

export interface PositionedNode{
    position: number;
    node: Text;
}

export interface TraverseResult{
    text: string;
    nodes: Array<PositionedNode>;
}

/**
 * cut off rewrite target as node.
 * @returns node to replace.
 */
export function cutoffNodes(position: number, length: number, nodes: Array<PositionedNode>): Text{
    // 二分探索により開始ノードを見つける
    let start = 0;
    let end = nodes.length;
    while (start < end-1){
        const t = Math.floor((start + end) / 2);
        const n = nodes[t];
        if (position < n.position){
            end = t;
        }else{
            start = t;
        }
    }
    // 開始点を見つけた
    const startNode = nodes[start].node;
    let targetNode: Text;
    if (nodes[start].position < position){
        targetNode = startNode.splitText(position - nodes[start].position);
        start++;
        // nodesをあわせて編集
        nodes.splice(start, 0, {
            position,
            node: targetNode,
        });
    }else{
        targetNode = startNode;
    }
    const endPosition = position + length;

    // targetNodeが終了点を通過していたら?
    if (targetNode.data.length > length){
        const nee = targetNode.splitText(length);
        nodes.splice(start+1, 0, {
            position: endPosition,
            node: nee,
        });
    }
    // 終了点まですすめる
    while (nodes[start+1]){
        const node = nodes[start+1];
        if (node.position+node.node.nodeValue!.length < endPosition){
            // このノードはもういらない
            nodes.splice(start+1, 1);
            node.node.parentNode!.removeChild(node.node);
            continue;
        }else if (node.position < endPosition){
            // 終点なので切る
            const nee = node.node.splitText(endPosition - node.position);
            node.node.parentNode!.removeChild(node.node);

            node.position = endPosition;
            node.node = nee;
        }
        break;
    }
    return targetNode;
}

export function traverse(range: Range): TraverseResult{
    const nodes: Array<PositionedNode> = [];
    let text = '';
    let position = 0;

    // 始点と終点を処理
    handleBoundaries(range);

    let auxRange = document.createRange();

    walk(range.commonAncestorContainer, range, auxRange, node=>{
        const {
            nodeValue,
        } = node;
        nodes.push({
            position,
            node,
        });
        text += nodeValue;
        position += nodeValue!.length;
    });

    return {
        text,
        nodes,
    };
}

/** is this element ediable?
 */
export function isContentEditable(node: Node): boolean{
    if ('boolean' === typeof (node as HTMLElement).isContentEditable){
        return (node as HTMLElement).isContentEditable;
    }else{
        const p = node.parentNode;
        if (p == null){
            return false;
        }
        return isContentEditable(p);
    }
}

function handleBoundaries(range: Range): void{
    const {
        startContainer,
        startOffset,
    } = range;

    if (startContainer.nodeType === Node.TEXT_NODE){
        const node = startContainer as Text;
        if (startOffset === 0){
            // 親に移す
            range.setStartBefore(node);
        }else if (startOffset === node.nodeValue!.length){
            range.setStartAfter(node);
        }else{
            // テキストノードを分割
            const next = node.splitText(startOffset);
            range.setStartBefore(next);
        }
    }
    const {
        endContainer,
        endOffset,
    } = range;
    if (endContainer.nodeType === Node.TEXT_NODE){
        const node = endContainer as Text;
        if (endOffset === 0){
            range.setEndBefore(node);
        }else if (startOffset === node.nodeValue!.length){
            range.setEndAfter(node);
        }else{
            const next = node.splitText(endOffset);
            range.setEndBefore(next);
        }
    }
}

/**
 * Get index of given element.
 */
function childIndex(node: Node): number{
    const parent = node.parentNode;
    if (parent == null){
        return -1;
    }else{
        return Array.from(parent.childNodes).indexOf(node);
    }
}

/**
 * Walk under given node to find Text nodes.
 *
 * @param node ancenstor node.
 * @param range Range containing search domain.
 * @param aux Range for auxiliary use.
 * @param callback callback for found Text node.
 * @returns true if it has gone out of range
 */
function walk(node: Node, range: Range, aux: Range, callback: (node: Text)=>void): boolean{
    aux.selectNode(node);

    const i1 = aux.compareBoundaryPoints(Range.START_TO_END, range);
    if (i1 <= 0){
        // これは全く入っていない
        return false;
    }
    const i2 = aux.compareBoundaryPoints(Range.END_TO_START, range);
    if (i2 >= 0){
        // これもやはり入っていない
        return true;
    }
    // TextはRangeをまたがないという仮定
    if (node.nodeType === Node.TEXT_NODE){
        callback(node as Text);
        return false;
    }

    const {
        childNodes,
    } = node;
    const l = childNodes.length;
    for (let i = 0; i < l; i++){
        const child = childNodes[i];
        const r = walk(child, range, aux, callback);
        if (r){
            break;
        }
    }
    return false;
}
