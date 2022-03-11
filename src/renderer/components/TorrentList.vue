<template>
  <ul>
    <template v-for="[fName, item] of list">
      <li
        v-if="item instanceof Map || !item.isPadding"
        :entry="item instanceof Map ? null : item.id"
      >
        <div class="row">
          <i class="toggle" v-if="(item instanceof Map)" @click="toggle = !toggle" />
          <label>
            <input type="checkbox" checked />
              <span class="fName">{{ fName }}</span>
              <span class="size" v-if="!(item instanceof Map)">{{readableSize(item.size)}}</span>
          </label>
        </div>
        <TorrentList
          v-if="(item instanceof Map)"
          :list="item"
          :isRoot="false"
          :class="{'toggle-sub-dir': toggle}" />
      </li>
    </template>
  </ul>
</template>

<script setup lang="ts">
import { watch, ref } from "vue";
import { TorrentDirectory, TorrentFileInfo } from "../typings/drag-drop.def";
import { readableSize } from "../utils";

interface Props {
  list: TorrentDirectory<TorrentFileInfo>;
  isRoot?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  isRoot: true,
});

let toggle = ref(false);

watch(props.list, () => {
  for (let [fName, item] of props.list) {
    console.log(fName);
  }
});
</script>

<style lang="scss" scoped>
ul {
  padding: 0;
  font-size: 12px;
  font-weight: lighter;
  overflow-y: hidden;
}
li {
  list-style-type: none;
  padding: 1px 0 1px 1.5em;
}
li .row {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
}
li label {
  flex-grow: 1;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
}
li span.fName {
  flex: 1 1 auto;
}
li span.size {
  width: 6em;
  flex: 0 0 6em;
}
.toggle {
  width: 0.5em;
  display: inline-block;
  margin-left: -0.5em;
}
.toggle::before {
  content: "";
  display: inline-block;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 5px 5px;
  border-color: transparent transparent #000 transparent;
  margin: 0 0 0.4em calc(-5px);
  cursor: pointer;
}
.toggle-sub-dir {
  height: 0;
}
</style>
