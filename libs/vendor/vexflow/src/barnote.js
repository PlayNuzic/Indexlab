import { Note } from './note.js';
import { Barline, BarlineType } from './stavebarline.js';
import { log } from './util.js';
function L(...args) {
    if (BarNote.DEBUG)
        log('VexFlow.BarNote', args);
}
export class BarNote extends Note {
    static get CATEGORY() {
        return "BarNote";
    }
    constructor(type = BarlineType.SINGLE) {
        super({ duration: 'b' });
        this.metrics = {
            widths: {},
        };
        const TYPE = BarlineType;
        this.metrics.widths = {
            [TYPE.SINGLE]: 8,
            [TYPE.DOUBLE]: 12,
            [TYPE.END]: 15,
            [TYPE.REPEAT_BEGIN]: 14,
            [TYPE.REPEAT_END]: 14,
            [TYPE.REPEAT_BOTH]: 18,
            [TYPE.NONE]: 0,
        };
        this.ignoreTicks = true;
        this.setType(type);
    }
    getType() {
        return this.type;
    }
    setType(type) {
        this.type = typeof type === 'string' ? Barline.typeString[type] : type;
        this.setWidth(this.metrics.widths[this.type]);
        return this;
    }
    addToModifierContext(mc) {
        return this;
    }
    preFormat() {
        this.preFormatted = true;
        return this;
    }
    draw() {
        const ctx = this.checkContext();
        L('Rendering bar line at: ', this.getAbsoluteX());
        const barline = new Barline(this.type);
        barline.setX(this.getAbsoluteX());
        barline.setStave(this.checkStave());
        barline.setContext(ctx);
        barline.drawWithStyle();
        this.setRendered();
    }
}
BarNote.DEBUG = false;
