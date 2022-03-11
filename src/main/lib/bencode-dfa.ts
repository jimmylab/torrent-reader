import * as fs from 'fs';
// import util from 'util';
// import path from 'path';
import { Readable } from 'stream'

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

enum State {
  num,
  strlen,
  strval,
  list,
  dictkey,
  dictval,
  all,
  finished,
}

class Bencode {
  private input: BencodeData | null = null;
  private data : string | number | Map<string|number, any> | any[] = [];
  constructor(source?: string | Buffer | Readable) {
    if (typeof source === 'string') {
      this.input = new BencodeData(fs.createReadStream(source));
    } else if (Buffer.isBuffer(source) || source instanceof Readable) {
      this.input = new BencodeData(source);
    }
  }
  parse() {
    if (this.input === null) {
      return;
    }
    let ch: number;
    let stack : State[] = [];
    let stackObj : Array<string | number | Object> = [];
    let current : string | number | Object = null as any;
    let nextState : State = State.all;
    let preserveChar = false;
    nextState = Math.random();

    function pushCurrent(newData) {
      if (current != null)
        stackObj.push(current);
      current = newData();
    }

    const NextAction : Record<State, (...args: any[]) => void> = {
      [State.num]: function() {
        //
      },
      [State.strlen]: function() {
        //
      },
      [State.strval]: function() {
        //
      },
      [State.list]: function() {
        //
      },
      [State.dictkey]: function() {
        //
      },
      [State.dictval]: function() {
        //
      },
      [State.all]: function() {
        switch (ch) {
          case PREFIX_LIST:
            nextState = State.list;
            pushCurrent([]);
            break;
          case PREFIX_DICT:
            nextState = State.dictkey;
            pushCurrent(new Map());
            break;
          case PREFIX_INT:
            nextState = State.num;
            pushCurrent(0);
            break;
          case APPENDIX:
            nextState = State.finished;
            break;
          default:
            if (IS_DIGIT(ch)) {
              nextState = State.strlen;
              preserveChar = true;
              break;
            } else {
              throw new Error(`Cannot parse any structure at `);
            }
        }
      },
      [State.finished]: function() {
        //
      },
    }

    while(nextState !== State.finished) {
      if (!preserveChar) ch = this.input.readNextByte();
      preserveChar = false;
      let action = NextAction[nextState];
      action();
    }
  }
}

class BencodeData {
  private i = 0;
  constructor(input: Buffer | Readable) {
    this.i = 0;
  }
  readNextByte(): number {
    return 0;
  }
  peekNextByte(): number {
    return 0;
  }
  readString(len: number, encoding: BufferEncoding) : string;
  readString(len: number) : Buffer;
  readString(len: number, encoding?: BufferEncoding) : Buffer | string {
    if (typeof encoding === 'string') {
      return Buffer.alloc(0);
    } else {
      return '';
    }
  }
  get pos() {
    return this.i;
  }
}

class BencodeDataForBrowser {
  private i: number = 0;
  constructor(input: Uint8Array | ReadableStream) {
    this.i = 0;
  }
  readNextByte(): number {
    return 0;
  }
  peekNextByte(): number {
    return 0;
  }
  readString(len: number, encoding: BufferEncoding) : string;
  readString(len: number) : Buffer;
  readString(len: number, encoding?: BufferEncoding) : Uint8Array | string {
    if (typeof encoding === 'string') {
      return new Uint8Array(0);
    } else {
      const decoder = new TextDecoder();
      return decoder.decode();
    }
  }
}

