<template>
  <header :class="{ blur: isBlurred }">
	    {{ fName }}
      <template v-if="fName">-</template>
      Torrent Viewer
      <div class="controls">
        <i class="close icon icon-cross" @click="quit"/>
        <i class="maximize icon"
          :class="maximizeToggle ? 'icon-square-stack' : 'icon-square'"
          @click="maximize"
        />
        <i class="minimize icon icon-dash" @click="minimize"/>
      </div>
  </header>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watchEffect } from 'vue';
import { windowEvents, windowControls } from '../typings/window-control.def'

let isBlurred = ref(false);
window.addEventListener('blur', function(ev) { isBlurred.value = true; });
window.addEventListener('focus', function(ev) { isBlurred.value = false; });

const props = defineProps<{fName?: string}>();

watchEffect(() => {
  document.title = props.fName + (props.fName ? ' - ' : '') + 'Torrent Viewer';
})

function quit() {
  window.close()
}

function minimize() {
  windowControls.minimize();
}

const maximizeToggle = ref(null)
function maximize(ev: MouseEvent) {
  maximizeToggle.value ? windowControls.unmaximize() : windowControls.maximize();
}

{
  let x = Symbol(), y = Symbol();
  windowEvents
    .on('maximize', () => { maximizeToggle.value = true }, x)
    .on('unmaximize', () => { maximizeToggle.value = null }, y)
  onUnmounted(() => {
    windowEvents
      .off('maximize', x)
      .off('unmaximize', y)
  })
}

{
  let s = Symbol()
  windowEvents.on('minimize', function() {
    console.log('窗口已最小化' + Math.random());
  }, s)
  onUnmounted(() => {
    windowEvents.off('minimize', s)
  })
}
</script>

<style lang="scss">
@use '../assets/my-icon.scss';
$themeColor: #3c9e6d;
$themeColor: #4190eb;
$themeTextColor: #fff;
$height: 3em;
header {
  font-size: 14px;
  font-weight: lighter;
  line-height: $height;
  height: $height;
  margin: 0;
  padding: 0 1em;
  box-sizing: border-box;
  background-color: $themeColor;
  color: #fff;
  user-select: none;
  -webkit-app-region: drag;
  flex-grow: 0;
  position: relative;
  transition: background-color 200ms;
}
header.blur, header.blur .controls > i {
  background-color: adjust-color($themeColor, $lightness: 15%, $saturation: -10%);
}
.controls {
  position: absolute;
  height: $height;
  right: 0;
  top: 0;
}
.controls > i {
  user-select: none;
  -webkit-app-region: no-drag;
  width: $height;
  height: $height;
  float: right;
  transition: background-color 200ms;
  background-color: $themeColor;
}
.controls > i:hover {
  background-color: adjust-color($themeColor, $lightness: 15%) !important;
}
.controls > .maximize[toggle] {
  color: #b663b8;
}
</style>