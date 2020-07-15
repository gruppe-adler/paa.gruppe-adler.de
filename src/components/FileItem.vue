<template>
    <li class="grad-file-item">
            <i class="material-icons grad-file-item__icon" style="opacity: 0.2;">insert_photo</i>
            <i class="material-icons grad-file-item__close" @click="$emit('remove')">clear</i>
            <span class="grad-file-item__name">
                <span>{{newName}}</span>
                <span style="opacity: 0.5; margin-left: .5rem;">from {{inputFile.name}}</span>
            </span>
            <div
                v-if="state === 'warning'"
                v-html="warning.displayText"
                style="grid-area: message; color: var(--color-warning); text-align: right; cursor: pointer;"
                @click="showWarning"
            ></div>
            <div v-if="state === 'error'" style="grid-area: message; color: var(--color-error); text-align: right;">
                An error occured<br/>Click <span style="text-decoration: underline; cursor: pointer;" @click="showError">here</span> to see the details
            </div>
            <i
                v-if="state === 'done'"
                class="material-icons grad-file-item--action-icon"
                style="color: var(--color-primary);"
                @click="download"
            >
                get_app
            </i>
            <i
                v-if="state === 'warning'"
                class="material-icons grad-file-item--action-icon"
                style="color: var(--color-warning);"
                @click="showWarning"
            >
                warning
            </i>
            <i
                v-if="state === 'error'"
                class="material-icons grad-file-item--action-icon"
                style="color: var(--color-error);"
                @click="showError"
            >
                error
            </i>
            <div v-if="state === 'loading'" class="grad-loader" style="font-size: 2rem; grid-area: action;"></div>
        </li>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { imageDataToUrl, imageDataFromFile } from '@/utils/image';
import { getFileExtension, getFileNameWithoutExtension, dataURItoBlob, download } from '@/utils/file';

import ConvertWorker from '@/assets/convert.worker.js';

interface Warning {
    displayText: string;
    description: string;
}

@Component
export default class FileItemVue extends Vue {
    @Prop({ type: File, required: true }) private inputFile!: File;

    private warning: null|Warning = null;
    private worker: ConvertWorker|null = null;
    private error: unknown|null = null;
    private result: File|null = null;

    private created () {
        this.convert().catch(e => { console.error(e); this.error = e; });
    }

    private destroyed () {
        if (this.worker !== null) this.worker.terminate();
    }

    @Watch('result')
    private emitResult () {
        this.$emit('result', this.result);
    }

    private download () {
        if (this.result === null) return;

        download(this.result);
    }

    private showError () {
        alert(`The following error occured, while trying to convert your file:\n\n${this.error}\n\nWe would appreciate if you would help us make this tool even better and report the issue, by clicking the "Having Issues?"-Button in the lower right corner of the screen.`);
    }

    private showWarning () {
        if (this.warning === null) return;

        alert(this.warning.description);
    }

    private async convert () {
        if (this.worker === null) {
            this.worker = new ConvertWorker();
        }

        if (this.extension === 'paa') {
            // convert paa to png
            const data = await this.worker.convertPaaToImage(this.inputFile);

            const blob = dataURItoBlob(imageDataToUrl(data));

            this.result = new File([blob], this.newName);
        } else {
            const data = await imageDataFromFile(this.inputFile);

            // check wether both dimensions are powers of two
            if (Math.log2(data.width) % 1 !== 0 || Math.log2(data.width) % 1 !== 0) {
                this.warning = {
                    displayText: 'Dimensions have to<br/>be powers of two',
                    description: 'The dimensions (width and height) of PAA Images have to be powers of two. Your image has to fullfill the same conditions, that we can conert it to PAA.'
                };
                return;
            }

            const blob = await this.worker.convertImageToPaa(data);

            const file = new File([blob], this.newName);
            this.result = file;
        }

        this.worker.terminate();
    }

    private get extension () {
        return getFileExtension(this.inputFile);
    }

    private get newName () {
        const nameWithoutExtension = getFileNameWithoutExtension(this.inputFile);

        return `${nameWithoutExtension}.${this.extension === 'paa' ? 'png' : 'paa'}`;
    }

    private get state () {
        if (this.result !== null) return 'done';

        if (this.warning !== null) return 'warning';
        if (this.error !== null) return 'error';

        return 'loading';
    }
}
</script>

<style scoped lang="scss">
.grad-file-item {
    display: grid;
    grid-template-columns: [icon] auto [name] 1fr [message] auto [action] auto;
    padding: 1rem 1.5rem;
    background-color: var(--color-container);
    border-radius: .5rem;
    grid-column-gap: 1rem;
    margin: 1rem 0;
    align-items: center;
    user-select: none;

    &__close,
    &__icon {
        grid-area: icon;
        font-size: 1.5rem;
    }
    &__close {
        visibility: hidden;
        cursor: pointer;
    }
    &:hover #{&}__icon {
        visibility: hidden;
    }
    &:hover > #{&}__close {
        visibility: initial;
    }

    &__name {
        grid-area: name;
    }

    &__message {
        grid-area: message;
    }

    &--action-icon {
        grid-area: action;
        font-size: 2rem !important;
        cursor: pointer;
    }
}

.grad-loader,
.grad-loader:after {
  border-radius: 50%;
  width: 1em;
  height: 1em;
}
.grad-loader {
    position: relative;
    border-top: .1em solid rgba(255, 255, 255, 0.2);
    border-right: .1em solid rgba(255, 255, 255, 0.2);
    border-bottom: .1em solid rgba(255, 255, 255, 0.2);
    border-left: .1em solid var(--color-primary);
    -webkit-transform: translateZ(0);
    -ms-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-animation: grad-loader 1.1s infinite linear;
    animation: grad-loader 1.1s infinite linear;
    box-sizing: border-box;
}
@-webkit-keyframes grad-loader {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes grad-loader {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
</style>
