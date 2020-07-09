<template>
    <div
        v-if="isDragging"
        @drop="onDrop"
        @dragover="$event.preventDefault()"
        class="grad-overlay"
    >
        <div>
            <h1>DROP FILES HERE</h1>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class OverlayVue extends Vue {
    private isDragging = false;
    private dragTimeOut: number|null = null;

    private created () {
        document.body.addEventListener('dragover', this.onDrag);
    }

    private destroyed () {
        document.body.removeEventListener('dragover', this.onDrag);
    }

    private containsFiles (event: DragEvent): boolean {
        if (event.dataTransfer && event.dataTransfer.types) {
            for (let i = 0; i < event.dataTransfer.types.length; i++) {
                if (event.dataTransfer.types[i] === 'Files') {
                    return true;
                }
            }
        }

        return false;
    }

    private onDrag (event: DragEvent) {
        if (!this.containsFiles(event)) return;

        this.isDragging = true;
        if (this.dragTimeOut !== null) clearTimeout(this.dragTimeOut);
        this.dragTimeOut = window.setTimeout(() => { this.isDragging = false; }, 100);
    }

    private onDrop (event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.containsFiles(event)) return;

        if (!event.dataTransfer) return;
        this.$emit('input', event.dataTransfer.files);
    }
}
</script>

<style scoped lang="scss">
.grad-overlay {
    position: fixed;
    z-index: 1000;
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
    background-color: var(--color-background);
    padding: 2rem;
    opacity: 0.95;

    > div {
        width: 100%;
        height: 100%;
        border: 4px dashed var(--color-text);
        border-radius: 1.5rem;
        display: flex;
        justify-content: center;
        align-items: center;

        > h1 {
            letter-spacing: 0.1em;
        }
    }
}
</style>
