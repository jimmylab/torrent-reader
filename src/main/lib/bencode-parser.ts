import util from 'util';

// const
//   PREFIX_INT = 'i'.charCodeAt(0), SEPARATOR_STR = ':'.charCodeAt(0),
//   PREFIX_LIST = 'l'.charCodeAt(0), PREFIX_DICT = 'd'.charCodeAt(0),
//   APPENDIX = 'e'.charCodeAt(0),
//   CHAR_ZERO = '0'.charCodeAt(0), CHAR_NINE = '9'.charCodeAt(0), CHAR_NEGATIVE = '-'.charCodeAt(0)
// ;
const
  PREFIX_INT = 105, SEPARATOR_STR = 58,
  PREFIX_LIST = 108, PREFIX_DICT = 100,
  APPENDIX = 101,
  CHAR_ZERO = 48, CHAR_NINE = 57, CHAR_NEGATIVE = 45
;

const IS_DIGIT = (c: number) => c >= CHAR_ZERO && c <= CHAR_NINE;
const IS_NUMBERIC = (c: number) => (c >= CHAR_ZERO && c <= CHAR_NINE) || c === CHAR_NEGATIVE;

type StringOrNumber = number | string | Buffer;

function readNum(data: DataSourceReader) : number {
  if (data.readNext() !== PREFIX_INT) {
    throw new Error(`Cannot parse number at ${data.pos}`);
  }
  let num = 0;
  let ch: number = data.peekNext();
  let sign = (ch === CHAR_NEGATIVE) ? (data.readNext(), -1) : +1;
  while((ch = data.readNext()) !== APPENDIX) {
    if (!IS_DIGIT(ch)) {
      throw new Error(`Invalid number at ${data.pos}`);
    }
    num = num * 10 + (ch - CHAR_ZERO);
  }
  return sign * num;
}

function readStr(data: DataSourceReader, encoding?: BufferEncoding) : string | Buffer{
  if ( !IS_DIGIT(data.peekNext()) ) {
    throw new Error(`Cannot parse string at ${data.pos}`);
  }
  let strLen = 0;
  for(let ch: number; (ch = data.readNext()) !== SEPARATOR_STR; ) {
    if (!IS_DIGIT(ch)) {
      throw new Error(`Invalid string length at ${data.pos}`);
    }
    strLen = strLen * 10 + (ch - CHAR_ZERO);
  }
  return data.readNextString(strLen, encoding);
}

function readList(data: DataSourceReader) : any[] {
  if (data.readNext() !== PREFIX_LIST) {
    throw new Error(`Cannot parse list at ${data.pos}`)
  }
  let arr:any[] = [];
  while ( data.peekNext() !== APPENDIX ) {
    arr.push(readAllType(data));
  }
  data.readNext() === APPENDIX;
  return arr;
}

function readDict(data: DataSourceReader) : Map<StringOrNumber, any> {
  if (data.readNext() !== PREFIX_DICT) {
    throw new Error(`Cannot parse dict at ${data.pos}`)
  }
  let dict = new Map();
  while ( data.peekNext() !== APPENDIX ) {
    const k = readNumOrStr(data, 'utf-8');
    let v = readAllType(data);
    dict.set(k ,v);
  }
  data.readNext();
  return dict;
}

function readNumOrStr(data: DataSourceReader, encoding?: BufferEncoding) : StringOrNumber {
  const ch = data.peekNext();
  const cha = String.fromCharCode(data.peekNext());
  if (ch === PREFIX_INT) {
    return readNum(data)
  } else if ( IS_DIGIT(ch) ) {
    return readStr(data, encoding);
  }
  throw new Error(`Cannot parse number or string at ${data.pos}`);
}

function readAllType(data: DataSourceReader) : any {
  const ch = data.peekNext();
  switch (ch) {
    case PREFIX_INT:  return readNum(data);
    case PREFIX_LIST: return readList(data);
    case PREFIX_DICT: return readDict(data);
    default:
      if (IS_DIGIT(ch)) {
        return readStr(data);
      }
      throw new Error(`Cannot parse any type at ${data.pos}`);
  }
}

export function parseBencode(buf: Buffer) {
  const data = new DataSourceReader(buf);
  return readAllType(data);
}

class DataSourceReader {
  private buf: Buffer;
  private i: number;
  public isEnd: boolean;
  constructor(buf: Buffer) {
    this.buf = buf;
    this.i = 0;
    this.isEnd = false;
  }
  readNext() {
    return this.buf.readUInt8(this.i++);
  }
  peekNext() {
    return this.buf.readUInt8(this.i);
  }
  readNextChar() {
    return String.fromCharCode(this.buf.readUInt8(this.i++));
  }
  readNextString(len: number, encoding?: BufferEncoding) {
    let data = this.buf.slice(this.i, this.i += len);
    return encoding ? data.toString(encoding) : data;
  }
  get pos() {
    return this.i;
  }
}

function test() {
  function inspect(obj: Object) {
    console.log(
      util.inspect(obj, { colors: true, depth: Infinity, maxArrayLength: null })
    )
  }
  const testDoc = Buffer.from(
    `
    d
      3:bar 4:spam
      3:foo i42e
      i-123e d
        4:aaaa  3:ggg
        5:bbbbb i456e
        2:Cc    l
          3:xxx
          i789e
          3:yyy
        e
        4:qwer 5:hhhhh
      e
      4:asdf 4:zxcv
    e
    `.replace(/\s/g, '')
  );
  inspect(parseBencode(testDoc))
}

if (require.main === module) {
  test();
}

