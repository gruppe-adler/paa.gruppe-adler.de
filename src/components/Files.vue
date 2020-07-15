<template>
    <main class="grad-files">
        <ul style="padding: 0; margin: 0;">
            <FileItem
                v-for="f in value"
                :inputFile="f"
                :key="f"
                @remove="remove(f)"
                @result="setResult(f, $event)"
            />
        </ul>
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <button @click="$emit('convert_more')">
                <i class="material-icons">add</i>
                <span>Convert more Files</span>
            </button>
            <!-- TODO: Make button wörk -->
            <button @click="downloadAll">
                <i class="material-icons">get_app</i>
                <span>Download all Files</span>
            </button>
        </div>
    </main>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import FileItemVue from '@/components/FileItem.vue';

import JSZip from 'jszip';
import { download } from '@/utils/file';

@Component({
    components: {
        FileItem: FileItemVue
    }
})
export default class FilesVue extends Vue {
    @Prop({ type: Array, required: true }) private value!: File[];

    private results: Map<File, File> = new Map();

    private remove (file: File) {
        const index = this.value.indexOf(file);

        this.value.splice(index, 1);

        // remove from result list
        this.results.delete(file);
    }

    private setResult (inputFile: File, resultFile: File) {
        this.results.set(inputFile, resultFile);
    }

    private async downloadAll () {
        const zip = new JSZip();
        for (const file of Array.from(this.results.values())) {
            zip.file(file.name, file);
        }

        const blob = await zip.generateAsync({ type: 'blob' });

        const file = new File([blob], 'grad-paa.zip');

        download(file);
    }
}
</script>

<style scoped lang="scss">
.grad-files {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    grid-row-gap: 1.5rem;
    overflow-y: auto;

    > * {
        width: 50rem;
        max-width: calc(100vw - 2rem);
        box-sizing: border-box;
    }
}
</style>
