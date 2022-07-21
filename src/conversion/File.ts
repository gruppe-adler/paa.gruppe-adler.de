import EventTarget from '@ungap/event-target'; // Polyfill for Safari 13

import { download, getFileExtension, getFileNameWithoutExtension, GradPaaFile, isSupportedFile, readFile } from '@/utils/file';
import { blobToImg, imageDataFromBlob, imageDataFromDrawable, imageDataToBlob } from '@/utils/image';
import { promisifyWorker } from '@/utils/worker';
import { supportedNames } from '@/utils/mime';

/* eslint-disable import/no-webpack-loader-syntax, import/default */
import fromPAAWorkerURL from 'worker-plugin/loader!@/worker/fromPAA.worker';
import toPAAWorkerURL from 'worker-plugin/loader!@/worker/toPAA.worker';
/* eslint-enable import/no-webpack-loader-syntax, import/default */

interface ConversionFileWarning {
    displayText: string;
    description: string;
}

type ConversionFileState = 'done'|'warning'|'error'|'loading'|'queued'|'setup';

export default class ConversionFile extends EventTarget {
    public readonly inputFile: GradPaaFile;
    public readonly id: string;
    private _result: GradPaaFile|null = null;
    private _worker: Worker|null = null;
    private _preChecksDone = false;
    private _warning: null|ConversionFileWarning = null;
    private _error: Error|null = null;
    private imageData: ImageData|null = null;

    constructor(file: GradPaaFile, id: string) {
        super();
        this.inputFile = file;
        this.id = id;
        this.preChecks().catch(err => {
            this.error = err;
            // eslint-disable-next-line no-console
            console.error(err);
        });
    }

    public get state (): ConversionFileState {
        if (this.warning !== null) return 'warning';
        if (this.error !== null) return 'error';
        if (this.result !== null) return 'done';

        if (!this._preChecksDone) return 'setup';
        if (this.worker !== null) return 'loading';

        return 'queued';
    }

    public get worker (): Worker|null { return this._worker; }
    public set worker (val: Worker|null) {
        if (!this._preChecksDone) throw new Error('Cannot set worker for ConversionFile, because pre-checks aren\'t done yet.');

        this._worker = val;
        this.dispatchEvent(new Event('update'));
    }

    public get warning (): null|ConversionFileWarning { return this._warning; }
    public set warning (val: null|ConversionFileWarning) {
        this._warning = val;
        this.dispatchEvent(new Event('update'));
    }

    public get error (): null|Error { return this._error; }
    public set error (val: null|Error) {
        this._error = val;
        this.dispatchEvent(new Event('update'));
    }

    public get preChecksDone (): boolean { return this._preChecksDone; }
    public set preChecksDone (val: boolean) {
        this._preChecksDone = val;
        this.dispatchEvent(new Event('preChecksDone'));
        this.dispatchEvent(new Event('update'));
    }

    /**
     * Extension of file to convert
     */
    private get extension () {
        return getFileExtension(this.inputFile.name);
    }

    private get newExtension (): string {
        return (this.extension === 'paa') ? 'png' : 'paa';
    }

    /**
     * Name of converted file
     */
    public get newName (): string {
        const nameWithoutExtension = getFileNameWithoutExtension(this.inputFile.name);

        return `${nameWithoutExtension}.${this.newExtension}`;
    }

    /**
     * Name of input file
     */
    public get name (): string {
        return this.inputFile.name;
    }

    public get result (): GradPaaFile|null { return this._result; }

    public download (): void {
        if (this.result === null) return;

        download(this.result);
    }

    /**
     * Pre checks include all checks that run actually before converting the file.
     * E.g. if the file is in a supported format or has valid dimensions.
     */
    private async preChecks () {
        // check if file is in a supported format
        if (!(await isSupportedFile(this.inputFile))) {
            this.warning = {
                displayText: 'Non supported format',
                description: `
                    <p>The file you uploaded is not in a supported format.</p>
                    <p>We support the following file formats:</p>
                    <p style="line-height: 2.5em; font-weight: bold;">${(await supportedNames()).map(x => `<code style="background-color: var(--color-container); padding: 0.5em 0.75em; border-radius: 1000px;">${x}</code>`).join(' ')}</p>
                    <p><i>Different web browsers may support more / less formats.</i></p>
                    `
            };
            this.preChecksDone = true;
            return;
        }

        switch (this.extension) {
        case 'paa':
            {
                const ab: ArrayBuffer = await readFile(this.inputFile.blob.slice(0, 2));
                const firstTwoBytes = new Uint16Array(ab)[0];

                switch (firstTwoBytes) {
                case 0xFF01:
                case 0xFF05:
                    // Valid PAA magic number
                    break;
                case 0xFF02:
                case 0xFF03:
                case 0xFF04:
                case 0x4444:
                case 0x1555:
                case 0x8888:
                case 0x8080:
                    // Valid PAA magic number, but type is not supported by grad_aff
                    this.warning = {
                        displayText: 'Unsupported PAA type',
                        description: `
                            <p>PAA files come in different types, which you can read more about <a target="_blank" rel="noreferrer noopener" href="https://community.bistudio.com/wiki?title=PAA_File_Format#TypeOfPaX_.28optional.29">here</a>.</p>
                            <p>To reduce complexity we only support the most common types DXT1 and DXT5. All other types are either old or barely used.</p>
                        `
                    };
                    break;
                default:
                    // INVALID PAA magic number
                    this.warning = {
                        displayText: 'Invalid PAA file',
                        description: `
                            <p>Seems like your file is not a valid PAA file.</p>
                            <button class="grad-paa-btn--primary grad-paa-btn--not-responsive" style="float: right;" data-grad-paa-open-feedback type="button">Report Error</button>
                        `
                    };
                    break;
                }
            }
            break;
        case 'svg':
            {
                // Firefox throws if you try to draw an SVG to canvas that doesn't have width/height.
                // In Chrome it loads, but drawImage behaves weirdly.
                // This function sets width/height if it isn't already set.
                const parser = new DOMParser();
                const text = await new Response(this.inputFile.blob).text();
                const doc = parser.parseFromString(text, 'image/svg+xml');
                const svg = doc.documentElement;

                if (doc.getElementsByTagName('parsererror').length > 0) {
                    this.warning = {
                        displayText: 'Invalid SVG image',
                        description: `
                            <p>Seems like your file is not a valid SVG image.</p>
                            <button class="grad-paa-btn--primary grad-paa-btn--not-responsive" style="float: right;" data-grad-paa-open-feedback type="button">Report Error</button>
                        `
                    };
                    break;
                }

                if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
                    this.imageData = await blobToImg(this.inputFile.blob).then(imageDataFromDrawable);
                    break;
                }

                const viewBox = svg.getAttribute('viewBox');
                if (viewBox === null) {
                    this.warning = {
                        displayText: 'SVGs must have width/height or viewBox',
                        description: 'SVGs must have either <code>width</code> and <code>height</code> attributes or a valid <code>viewBox</code> attribute, in order to be decoded.'
                    };
                    break;
                }

                const [, , w, h] = viewBox.split(/\s+/);
                svg.setAttribute('width', w);
                svg.setAttribute('height', h);

                const serializer = new XMLSerializer();
                const newSource = serializer.serializeToString(doc);

                this.imageData = await blobToImg(new Blob([newSource], { type: 'image/svg+xml' })).then(imageDataFromDrawable);
            }
            break;
        default:
            this.imageData = await imageDataFromBlob(this.inputFile.blob);
            break;
        }

        if (this.imageData && (Math.log2(this.imageData.width) % 1 !== 0 || Math.log2(this.imageData.height) % 1 !== 0)) {
            this.warning = {
                displayText: 'Dimensions have to be powers of two',
                description: `
                    <p>The dimensions (width and height) of PAA images have to be powers of two (2ⁿ).</p>
                    <p>Your image has to fulfill the same conditions in order to convert it to PAA.</p>
                    <svg viewBox="0 0 161 86" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: var(--text-color); width: 15em; display: block; margin: 0 auto;">
                        <path d="M142.107 1.17969H1.02881V71.4563H142.107V1.17969Z" stroke="currentColor" stroke-opacity="0.25"/>
                        <path d="M0.473145 80.9385L6.02742 84.1587V77.7183L0.473145 80.9385ZM62.681 80.3807H5.47199V81.4962H62.681V80.3807Z" fill="currentColor" fill-opacity="0.5"/>
                        <path d="M151.55 0.62207L148.343 6.19958H154.757L151.55 0.62207ZM152.105 27.3941V5.64183H150.994V27.3941H152.105Z" fill="currentColor" fill-opacity="0.5"/>
                        <path d="M151.55 72.0142L154.757 66.4367H148.343L151.55 72.0142ZM150.994 45.2422V66.9945H152.105V45.2422H150.994Z" fill="currentColor" fill-opacity="0.5"/>
                        <path d="M142.663 80.9385L137.109 77.7183V84.1587L142.663 80.9385ZM137.664 80.3807H80.4551V81.4962H137.664V80.3807Z" fill="currentColor" fill-opacity="0.5"/>
                        <path d="M72.0109 85.9579H65.8014V85.0886L69.0819 81.4284C69.5679 80.875 69.902 80.4261 70.0843 80.0818C70.2708 79.7332 70.3642 79.3738 70.3642 79.0034C70.3642 78.5066 70.2144 78.0993 69.915 77.7811C69.6157 77.4631 69.2164 77.304 68.7174 77.304C68.1186 77.304 67.6521 77.4761 67.318 77.8204C66.9883 78.1603 66.8233 78.6351 66.8233 79.2452H65.6191C65.6191 78.3694 65.8991 77.6613 66.4588 77.121C67.0229 76.5807 67.7758 76.3105 68.7174 76.3105C69.5983 76.3105 70.2947 76.5436 70.8068 77.0099C71.3188 77.4718 71.5749 78.0883 71.5749 78.8596C71.5749 79.7965 70.9803 80.912 69.7914 82.2061L67.2529 84.9709H72.0109V85.9579ZM74.1263 76.4739L74.3216 77.2779C74.6427 76.6765 75.1201 76.3759 75.7536 76.3759C76.8818 76.3759 77.4459 77.0599 77.4459 78.4282V81.7028H76.3393V78.5263C76.3263 77.7201 76.014 77.3171 75.4021 77.3171C74.9248 77.3171 74.5906 77.5546 74.3997 78.0295V81.7028H73.2931V76.4739H74.1263Z" fill="currentColor"/>
                        <path d="M151.992 41.3377H145.783V40.4684L149.064 36.8082C149.549 36.2548 149.883 35.806 150.066 35.4617C150.252 35.1131 150.346 34.7537 150.346 34.3833C150.346 33.8865 150.196 33.4791 149.897 33.161C149.597 32.843 149.198 32.6839 148.699 32.6839C148.1 32.6839 147.634 32.856 147.3 33.2003C146.97 33.5402 146.805 34.015 146.805 34.6251H145.601C145.601 33.7493 145.88 33.0412 146.44 32.5008C147.004 31.9606 147.757 31.6904 148.699 31.6904C149.58 31.6904 150.277 31.9235 150.788 32.3897C151.3 32.8517 151.556 33.4682 151.556 34.2395C151.556 35.1764 150.962 36.2919 149.772 37.586L147.234 40.3507H151.992V41.3377Z" fill="currentColor"/>
                        <path d="M154.108 31.8537L154.304 32.6578C154.625 32.0564 155.101 31.7558 155.735 31.7558C156.545 31.7558 157.064 32.1086 157.293 32.8144C157.313 32.738 157.339 32.6782 157.349 32.6578C157.671 32.0564 158.147 31.7558 158.781 31.7558C159.909 31.7558 160.473 32.4398 160.473 33.8081V37.0827H159.367V33.9062C159.353 33.1 159.041 32.6969 158.429 32.6969C157.952 32.6969 157.618 32.9344 157.427 33.4094L157.416 33.4874C157.423 33.5797 157.427 33.6758 157.427 33.7755L157.427 33.8081V37.0827H156.321V33.9062C156.307 33.1 155.995 32.6969 155.383 32.6969C154.906 32.6969 154.572 32.9344 154.381 33.4094V37.0827H153.275V31.8537H154.108Z" fill="currentColor"/>
                    </svg>
                    <code style="font-size: 0.8em">2ⁿ = 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096 ...</code>
                    <code style="font-size: 0.8em">2ᵐ = 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096 ...</code>
                `
            };
        }

        this.preChecksDone = true;
    }

    public async convert (): Promise<void> {
        if (this.warning !== null) throw new Error('Cannot start conversion with warnings.');
        if (!this.preChecksDone) throw new Error('Conversion started before pre-Checks were done.');

        try {
            if (this.extension === 'paa') {
                // convert paa to png
                this.worker = new Worker(fromPAAWorkerURL);
                this.imageData = await promisifyWorker<Blob, ImageData>(this.worker, this.inputFile.blob);

                const blob = await imageDataToBlob(this.imageData);

                this._result = { blob, name: this.newName };
            } else {
                this.worker = new Worker(toPAAWorkerURL);
                // If the preChecks are done we're sure that this.imageData is not null
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const blob = await promisifyWorker<ImageData, Blob>(this.worker, this.imageData!, [this.imageData!.data.buffer]);

                this._result = { blob, name: this.newName };
            }

            this.trackConversion();
        } catch (err) {
            this.error = err;
            // eslint-disable-next-line no-console
            console.error(err);
        } finally {
            if (this.worker) {
                this.worker.terminate();
                this.worker = null;
            }
        }
    }

    private trackConversion () {
        if (this.result === null) return;

        let action: string;
        let label: string;
        if (this.newExtension === 'paa') {
            action = 'toPAA';
            label = this.inputFile.blob.type;
        } else {
            action = 'fromPAA';
            label = this.result.blob.type;
        }

        gtag('event', action, { event_category: 'conversion', non_interaction: true, event_label: label });
    }

    public cancel (): void {
        if (this.worker) return this.worker.terminate();
    }
}
