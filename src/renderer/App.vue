<template>
  <div id="app"
    ondragover="event.stopPropagation(); event.preventDefault();"
    @drop="fileDrop"
  >
    <Header :fName = fName />
    <main>
      <div class="panel" v-if="fName">
        <h3 class="torrent-title">{{fName}}</h3>
          <div class="bordered-container">
            <TorrentList v-if="fileTree" :list="fileTree.files" />
          </div>
      </div>
      <div class="panel center-box-vertical" v-else>
        <h2 class="torrent-title" style="text-align: center">拖放.torrent文件到此处</h2>
      </div>
    </main>
  </div>
  <dialog ref="myDialog">
    <p>无效文件</p>
    <button onclick="this.closest('dialog').close()">确定</button>
  </dialog>
</template>

<script setup lang="ts">
import Header from './components/Header.vue'
import { defineComponent, ref, Ref} from 'vue';
import TorrentList from './components/TorrentList.vue'
import { openTorrent, TorrentFileTree } from './typings/drag-drop.def';

let fName: Ref<string> = ref('');
let fileTree: Ref<TorrentFileTree> = ref();
let myDialog = ref(null);
defineExpose({ myDialog });

async function fileDrop(ev: DragEvent) {
  ev.stopPropagation(); ev.preventDefault();
  let { dataTransfer } = ev;
  let { files } = dataTransfer;
  // console.log(files)
  if (files.length < 1) return;
  const file = files[0];
  if (!file.name.endsWith('.torrent')) {
    myDialog.value?.showModal()
    return;
  }
  fName.value = file.name;
  try {
    fileTree.value = await openTorrent(file.path);
    // console.log(fileTree)
    fName.value = fileTree.value.title;
  } catch (error) {
    console.log(error);
  }
}

</script>

<style lang="scss">
#app {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
main {
  overflow-x: hidden;
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
}
.panel {
  flex-grow: 1;
  margin: 0 1em 2em 1em;
}
.torrent-title {
  font-weight: lighter;
}
dialog {
  width: 150px;
  text-align: center;
  border: 1px solid black;
  button {
    margin-top: 1em;
  }
}

.center-box-vertical {
  display: flex;
  justify-content: center;
  align-items: center;
}
.bordered-container {
  padding-bottom: 0.5em;
  border: 1px solid #aaa;
  border-radius: 10px;
}

::-webkit-scrollbar {
  background-color: transparent;
  width: 12px;
}
::-webkit-scrollbar-thumb {
  box-shadow: inset 0 0 12px 12px #999;
  // background-color: #999;
  border-radius: 6px;
  border: solid 3px transparent;
}
::-webkit-scrollbar-button {
  display: none;
}
</style>