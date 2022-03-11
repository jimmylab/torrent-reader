import type {
  TorrentData,
  TorrentDataFileEntry,
  TorrentFileTree,
  TorrentFileInfo,
  TorrentDirectory,
} from '../../main/lib/torrent-parser'

const openTorrent = (window as any).openTorrent as (fName: string) => Promise<TorrentFileTree>;

export {
  openTorrent,
  TorrentData,
  TorrentDataFileEntry,
  TorrentFileTree,
  TorrentFileInfo,
  TorrentDirectory,
}

