import fsPromises from 'fs/promises';
import util from 'util';
import path from 'path';
import { parseBencode } from './bencode-parser';

export type TorrentData<T extends (Buffer | string)> = {
  encoding?: Buffer;
  info: {
    name: T;
    'name.utf-8'?: T;
    files?: TorrentDataFileEntry<T>[];
    length?: number;
    'piece length': number;
    pieces: Buffer;
    announce?: T;
    'announce-list'?: T[];
    'created by'?: T;
    // 'root hash'?: Buffer;
  }
  comment?: T;
  'creation date'?: number;
}
export type TorrentDataFileEntry<T extends (Buffer | string)> = {
  path: T[];
  'path.utf-8'?: T[];
  length: number;
  ed2k?: Buffer;
  filehash?: Buffer;
}
export type TorrentFileTree = { title: string, files: TorrentDirectory<TorrentFileInfo> };
export type TorrentFileInfo = { size: number, id: number, isPadding?: boolean };
export type TorrentDirectory<T> = Map<string, T | TorrentDirectory<T>>;

const isValidIndex = (i: number, len: number) => i > 0 && i < len;  // NaN is considered also
const PaddingFilePattern = /^_____padding_file_\d+_/;

const proxyHandler : ProxyHandler<any> = {
  get(target: any, key: string, receiver) :any {
    let val;
    if (target instanceof Map) {
      if (!target.has(key)) return;
      val = target.get(key);
    }
    else if (target instanceof Array) {
      if (key in target) {
        val = target[key as any];
        // if (typeof val === 'function' && key in Array.prototype) {
        //   val = (val as Function).bind(receiver);
        // }
      }
    }
    if (val instanceof Map || val instanceof Array) {
      let proxy = new Proxy(val, proxyHandler);
      return proxy;
    } else return val;
  },
  set(target: any, key: string, val: any) {
    if (target instanceof Map) {
      target.set(key, val);
      return true;
    } else if (target instanceof Array) {
      let i = parseInt(key);
      if (!isValidIndex(i, target.length)) return false;
      target[i] = val;
      return true;
    } else {
      target[key] = val;
      return true
    }
  },
}

export class Torrent {
  bencode!: Map<string, any>;  // bencode
  encoding : BufferEncoding = 'utf-8';
  isSingle!: boolean;

  constructor() {
    this.bencode = new Map();
  };

  // Check util functions
  private checkEncoding() {
    let encoding : BufferEncoding = 'utf-8';
    if (this.bencode.has('encoding')) {
      let encProp = this.bencode.get('encoding');
      if (!Buffer.isBuffer(encProp)) {
        throw new Error('Key "encoding" should be a string or unset')
      }
      encoding = encProp.toString().toLocaleLowerCase() as BufferEncoding;
    }
  }
  private parseTorrentData() : boolean {  // decode string + integrity check
    if (!(this.bencode instanceof Map) || !this.bencode.has('info')) return false;
    this.checkEncoding();
    // Required fields of info
    const info = this.bencode.get('info');
    if (
      !(info instanceof Map) ||
      !info.has('name') || !Buffer.isBuffer(info.get('name')) ||
      !info.has('pieces') || !Buffer.isBuffer(info.get('pieces')) ||
      !info.has('piece length') || 'number' !== typeof info.get('piece length')
    ) return false;
    if (info.has('length')) {
      // Single file torrent
      if (info.has('files') || 'number' !== typeof info.has('length')) {
        this.isSingle = true;
        return false;
      }
    } else {
      // Multiple files torrent
      if (!info.has('files')) return false;
      let files = info.get('files');
      if (!(files instanceof Array)) return false;
      if (
        !files.every(f => {
          if (!(f instanceof Map)) return false;
          return (
            f.has('path') && f.get('path') instanceof Array &&
            f.has('length') && 'number' === typeof f.get('length')
          )
        })
      ) return false;
      this.isSingle = false;
    }

    return true;
  }
  async readFromFile(fPath: string) {
    let buf = await fsPromises.readFile(fPath);
    const data = parseBencode(buf);
    this.bencode = data;
    this.parseTorrentData();
  }
  private decodePath(f: TorrentDataFileEntry<Buffer>) {
    return (
      f['path.utf-8']?.map(segment => segment.toString('utf-8')) ??
      f.path.map(segment => {
        return segment.toString(this.encoding)
      })

    )
  }
  get data() {
    return new Proxy(this.bencode, proxyHandler) as TorrentData<Buffer>
  }
  get fileTree() : TorrentFileTree {
    if ('undefined' === typeof this.isSingle) throw new Error('Uninitialized torrent!');
    const { info } = this.data;
    const title = (
      info?.['name.utf-8']?.toString('utf-8') ??
      info.name.toString(this.encoding)
    );
    if (this.isSingle) {
      return {
        title,
        files: new Map([
          [title, {
            size: info.length!,
            id: -1,
            isPadding: false,
          }]
        ])
      }
    } else {
      // TODO: more elegant way using Proxy?
      let root : TorrentDirectory<TorrentFileInfo> = new Map();
      info.files!.forEach((f, i) => {
        let fPath = this.decodePath(f);
        if (!fPath.length) throw new Error();
        let fName = fPath.pop()!;
        let curDir = root;
        fPath.map(folderName => {
          if (!curDir.has(folderName)) {
            curDir.set(folderName, new Map())
          }
          curDir = curDir.get(folderName) as TorrentDirectory<TorrentFileInfo>;
        } )
        curDir.set(fName, {
          size: f.length,
          id: i,
          isPadding: Torrent.isPaddingFile(fName, i)
        })
      })
      return {
        title,
        files: root
      };
    }
  }
  /** Accurate padding file checking */
  isPaddingFile(id: number): boolean;
  /** Accurate padding file checking */
  isPaddingFile(f: TorrentFileInfo): boolean;
  /** Accurate padding file checking */
  isPaddingFile(file: TorrentFileInfo | number): boolean {
    let id:number;
    if (typeof file === 'object' && 'id' in file && 'size' in file) {
      id = file.id;
    } else if (typeof file === 'number') {
      id = file;
    } else throw new Error();
    if (id < 1 || this.isSingle) {
      // id == -1 : Single file torrent has no padding
      // id == 0  : The first file shall not be a padding
      return false;
    }
    const { info } = this.data;
    const { files } = info;
    const chunkLen = info['piece length'];
    const entry = files![id];
    const entryPrev = files![id - 1];

    let p = this.decodePath(entry);
    return (
      (entryPrev.length + entry.length) % chunkLen === 0
      && p.length === 1
      && PaddingFilePattern.test(p[0])  // more confidence!
    )
  }
  static isPaddingFile(fName: string, id: number) {
    return (
      PaddingFilePattern.test(fName)
    );
  }
}

async function test() {
  function inspect(obj: Object) {
    console.log(
      util.inspect(obj, { colors: true, depth: Infinity, maxArrayLength: null })
    )
  }

  console.time();
  const f = new Torrent();
  await f.readFromFile(path.join(__dirname, 'samples/single.torrent'));
  // inspect(f.data);
  let fileTree = f.fileTree;
  fileTree.files.forEach((fInfo, fName, map) => {
    if (fInfo instanceof Map) return;
    if (fInfo.isPadding) {
      map.delete(fName);
    }
  } )
  inspect(fileTree);
  console.timeLog()
}

if (require.main === module) {
  test();
}
