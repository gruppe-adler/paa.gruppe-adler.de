<template>
    <main class="grad-files">
        <ul style="padding: 0; margin: 0;">
            <FileItem
                v-for="f in value"
                :value="f"
                :key="f"
                @remove="value.splice(value.indexOf(f), 1)"
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

@Component({
    components: {
        FileItem: FileItemVue
    }
})
export default class FilesVue extends Vue {
    @Prop({ type: Array, required: true }) private value!: File[];

    private downloadAll () {
        alert('This shit not implemented yo.');
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
