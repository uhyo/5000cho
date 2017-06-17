export interface PrecisionNumber{
    num: number;
    precision: number;
    exp: number;
    hasunit: boolean;
}

export interface PositionedNumber extends PrecisionNumber{
    position: number;
    length: number;
}

/**
 * Find all numbers with unit.
 */
export function getNumbers(text: string): Array<PositionedNumber>{
    const reg = /(\d[\d\s]*(?:\.[\s\d]+)?)\s*([京兆億万千百])?\s*([YZEPTGMkh]|da|[dcmu\u00b5npfazy])?([mgsAKLtBbJ]|mol|cd|rad|cal|5000兆)?/g;
    let ret: RegExpExecArray | null = null;
    const result: Array<PositionedNumber> = [];
    while (ret = reg.exec(text)){
        console.log(ret);
        const [all, numstr1, jpprefix, prefix, unit] = ret;
        const numstr = numstr1.replace(/\s/g, '');
        const precision = getPrecision(numstr);
        const {
            index,
        } = ret;

        const num = parseFloat(numstr);

        const expj = jprefixToExp(jpprefix);

        const exp = expj + (unit ? prefixToExp(prefix) : 0);

        result.push({
            position: index,
            length: all.length - (unit ? unit.length : (prefix ? prefix.length : 0)),
            precision,
            num,
            exp,
            hasunit: !!unit,
        });
    }
    return result;
}

/**
 * convert given number to 5000兆単位系.
 */
export function convert({
    num,
    precision,
    exp,
    hasunit,
}: PrecisionNumber): PrecisionNumber{
    // 5000兆 = 5 * 10e15
    // (5000兆)^(-1) = 1/5 * 10e-15 = 2 * 10e-16

    return {
        num: num * 2,
        precision,
        exp: exp - 16,
        hasunit,
    };
}

/**
 * normalize number.
 */
export function normalize({
    num,
    precision,
    exp,
    hasunit,
}: PrecisionNumber): PrecisionNumber{
    if (num === 0){
        return {
            num,
            precision,
            exp,
            hasunit,
        };
    }
    // x.pqr..
    const nu = Math.floor(Math.log10(num));
    // log10が0になるように
    const num2 = num * Math.pow(10, -nu);
    const exp2 = exp + nu;
    return {
        num: num2,
        precision,
        exp: exp2,
        hasunit,
    };
}

/**
 * convert number to html.
 */
export function toHTML({
    num,
    precision,
    exp,
}: PrecisionNumber): Node{
    const result = document.createDocumentFragment();

    if (num === 0){
        // 0だ
        result.appendChild(document.createTextNode('0'));
        return result;
    }
    if (-1 <= exp && exp <= 1){
        // 指数表記を使わない
        const num2 = num * Math.pow(10, exp);
        const numstr = num2.toFixed(Math.max(0, precision-1));
        const text = num2 === 1 ? '5000兆' : `${numstr}\u00a05000兆`;
        result.appendChild(document.createTextNode(text));
        return result;
    }

    const numstr = num.toFixed(Math.max(0, precision-1));
    const text1 = `${numstr}\u00a0×\u00a010`;
    const text2 = `${exp}`;
    const text3 = `\u00a05000兆`;
    // HTML化
    result.appendChild(document.createTextNode(text1));
    const sup = document.createElement('sup');
    sup.appendChild(document.createTextNode(text2));
    result.appendChild(sup);
    result.appendChild(document.createTextNode(text3));
    return result;
}

/**
 * convert number to text.
 */
export function toText({
    num,
    precision,
    exp,
    hasunit,
}: PrecisionNumber): string{
    if (hasunit){
        // unitがあるのでSI接頭辞を使っていいよね
        const prefix = expToPrefix(exp);
        const d = prefixToExp(prefix);
        const exp2 = exp - d;
        const num2 = num * Math.pow(10, exp2);
        const numstr = num.toFixed(precision);
        return `${numstr}\u00a0${prefix}5000兆`;
    }else{
        const num2 = num * Math.pow(10, exp);
        const numstr = usePrecision(num2, precision);
        return `${numstr}\u00a05000兆`;
    }

}


/**
 * 有効数字
 */
function getPrecision(text: string): number{
    const text2 = text.replace('.', '').replace(/^0+/, '');
    return text2.length;
}

/**
 * SI接頭辞をlog10に直す
 */
function prefixToExp(prefix: string): number{
    switch (prefix){
        case 'Y': return 24;
        case 'Z': return 21;
        case 'E': return 18;
        case 'P': return 15;
        case 'T': return 12;
        case 'G': return 9;
        case 'M': return 6;
        case 'k': return 3;
        case 'h': return 2;
        case 'da': return 1;
        case 'd': return -1;
        case 'c': return -2;
        case 'm': return -3;
        case 'u': case '\u00b5': return -6;
        case 'n': return -9;
        case 'p': return -12;
        case 'f': return -15;
        case 'a': return -18;
        case 'z': return -21;
        case 'y': return -24;
    }
    return 0;
}

/**
 * 日本語接頭辞も直す
 */
export function jprefixToExp(prefix: string): number{
    switch (prefix){
        case '百': return 2;
        case '千': return 3;
        case '万': return 4;
        case '億': return 8;
        case '兆': return 12;
        case '京': return 16;
    }
    return 0;
}

/**
 * expから近い接頭辞を用意する
 */
export function expToPrefix(exp: number): string{
    if (exp < -21){
        return 'y';
    }
    if (exp < -18){
        return 'z';
    }
    if (exp < -15){
        return 'a';
    }
    if (exp < -12){
        return 'f';
    }
    if (exp < -9){
        return 'p';
    }
    if (exp < -6){
        return 'n';
    }
    if (exp < -3){
        return '\u00b5';
    }
    if (exp < 0){
        return 'm';
    }
    if (exp < 3){
        return '';
    }
    if (exp < 6){
        return 'k';
    }
    if (exp < 9){
        return 'M';
    }
    if (exp < 12){
        return 'G';
    }
    if (exp < 15){
        return 'T';
    }
    if (exp < 18){
        return 'P';
    }
    if (exp < 21){
        return 'E';
    }
    if (exp < 24){
        return 'Z';
    }
    if (exp < 27){
        return 'Y';
    }
    return '';
}

/**
 * 有効数字を考えた表記
 */
export function usePrecision(num: number, precision: number): string{
    const offset = Math.log10(num);
    console.log(num, offset);

    if (offset < 0){
        // 0.xyz...の形

        // xyz...部分の0の長さ
        const n = -Math.ceil(offset) - 1;
        return num.toFixed(Math.min(20, n + precision));
    }
    // 小数以上の桁数
    const n = Math.ceil(offset + Number.EPSILON);
    return num.toFixed(Math.max(0, Math.min(20, precision - n)));
}

