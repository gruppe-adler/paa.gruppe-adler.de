
import { download, getFileExtension, getFileNameWithoutExtension, GradPaaFile, isSupportedFile, readFile } from '@/utils/file';
import { blobToImg, imageDataFromBlob, imageDataFromDrawable, imageDataToBlob } from '@/utils/image';
import { promisifyWorker } from '@/utils/worker';
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
        if (!isSupportedFile(this.inputFile)) {
            this.warning = {
                displayText: 'Non supported format',
                description: `
                    <p>The file you uploaded is not in a supported format.</p>
                    <p>We support the following file formats:</p>
                    <ul>
                        ${['.png', '.jpg / .jpeg', '.svg', '.paa'].map(x => `<li style="margin: .5rem 0;"><code>${x}</code></li>`).join('')}
                    </ul>
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
                            <p>PAA files come in different types, which you can read more about <a target="_blank" rel="noreferrer" href="https://community.bistudio.com/wiki?title=PAA_File_Format#TypeOfPaX_.28optional.29">here</a>.</p>
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
                            <button class="grad-paa-btn--primary" style="float: right;" data-grad-paa-open-feedback>Report Error</button>
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
                            <button class="grad-paa-btn--primary" style="float: right;" data-grad-paa-open-feedback>Report Error</button>
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
                    <svg viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: var(--text-color); width: 15em; display: block; margin: 0 auto;">
                        <rect x="16.5" y="0.5" width="127" height="63" stroke="currentColor" stroke-opacity="0.25"/>
                        <path d="M16 72L21 74.8868V69.1132L16 72ZM72 71.5H20.5V72.5H72V71.5Z" fill="currentColor" fill-opacity="0.5"/>
                        <path d="M152 0L149.113 5H154.887L152 0ZM152.5 24V4.5H151.5V24H152.5Z" fill="currentColor" fill-opacity="0.5"/>
                        <path d="M152 64L154.887 59H149.113L152 64ZM151.5 40V59.5H152.5V40H151.5Z" fill="currentColor" fill-opacity="0.5"/>
                        <path d="M144 72L139 69.1132V74.8868L144 72ZM139.5 71.5H88V72.5H139.5V71.5Z" fill="currentColor" fill-opacity="0.5"/>
                        <path d="M80.3984 76.5H74.8086V75.7207L77.7617 72.4395C78.1992 71.9434 78.5 71.541 78.6641 71.2324C78.832 70.9199 78.916 70.5977 78.916 70.2656C78.916 69.8203 78.7812 69.4551 78.5117 69.1699C78.2422 68.8848 77.8828 68.7422 77.4336 68.7422C76.8945 68.7422 76.4746 68.8965 76.1738 69.2051C75.877 69.5098 75.7285 69.9355 75.7285 70.4824H74.6445C74.6445 69.6973 74.8965 69.0625 75.4004 68.5781C75.9082 68.0938 76.5859 67.8516 77.4336 67.8516C78.2266 67.8516 78.8535 68.0605 79.3145 68.4785C79.7754 68.8926 80.0059 69.4453 80.0059 70.1367C80.0059 70.9766 79.4707 71.9766 78.4004 73.1367L76.1152 75.6152H80.3984V76.5ZM82.3027 67.998L82.4785 68.7188C82.7676 68.1797 83.1973 67.9102 83.7676 67.9102C84.7832 67.9102 85.291 68.5234 85.291 69.75V72.6855H84.2949V69.8379C84.2832 69.1152 84.002 68.7539 83.4512 68.7539C83.0215 68.7539 82.7207 68.9668 82.5488 69.3926V72.6855H81.5527V67.998H82.3027Z" fill="currentColor"/>
                        <path d="M152.398 36.5H146.809V35.7207L149.762 32.4395C150.199 31.9434 150.5 31.541 150.664 31.2324C150.832 30.9199 150.916 30.5977 150.916 30.2656C150.916 29.8203 150.781 29.4551 150.512 29.1699C150.242 28.8848 149.883 28.7422 149.434 28.7422C148.895 28.7422 148.475 28.8965 148.174 29.2051C147.877 29.5098 147.729 29.9355 147.729 30.4824H146.645C146.645 29.6973 146.896 29.0625 147.4 28.5781C147.908 28.0938 148.586 27.8516 149.434 27.8516C150.227 27.8516 150.854 28.0605 151.314 28.4785C151.775 28.8926 152.006 29.4453 152.006 30.1367C152.006 30.9766 151.471 31.9766 150.4 33.1367L148.115 35.6152H152.398V36.5ZM154.303 27.998L154.479 28.7188C154.768 28.1797 155.197 27.9102 155.768 27.9102C156.783 27.9102 157.291 28.5234 157.291 29.75V32.6855H156.295V29.8379C156.283 29.1152 156.002 28.7539 155.451 28.7539C155.021 28.7539 154.721 28.9668 154.549 29.3926V32.6855H153.553V27.998H154.303Z" fill="currentColor"/>
                    </svg>
                    <code style="font-size: 0.8em">2ⁿ = 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096 ...</code>
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

            // log google analytics
            // TODO: sanitize extensions (jpeg, jpg etc.)
            gtag('event', `${this.extension}2${this.newExtension}`, { event_category: 'conversion', non_interaction: true });
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

    public cancel (): void {
        if (this.worker) return this.worker.terminate();
    }
}
