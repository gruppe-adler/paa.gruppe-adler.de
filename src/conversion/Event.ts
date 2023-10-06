import type ConversionFile from './File';

export default class ConversionEvent extends Event {
    public readonly file: ConversionFile;

    constructor (type: string, file: ConversionFile, eventInitDict?: EventInit) {
        super(type, eventInitDict);
        this.file = file;
    }
}
