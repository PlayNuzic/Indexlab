import { StaveModifier, StaveModifierPosition } from './stavemodifier.js';
import { Tables } from './tables.js';
export var BarlineType;
(function (BarlineType) {
    BarlineType[BarlineType["SINGLE"] = 1] = "SINGLE";
    BarlineType[BarlineType["DOUBLE"] = 2] = "DOUBLE";
    BarlineType[BarlineType["END"] = 3] = "END";
    BarlineType[BarlineType["REPEAT_BEGIN"] = 4] = "REPEAT_BEGIN";
    BarlineType[BarlineType["REPEAT_END"] = 5] = "REPEAT_END";
    BarlineType[BarlineType["REPEAT_BOTH"] = 6] = "REPEAT_BOTH";
    BarlineType[BarlineType["NONE"] = 7] = "NONE";
})(BarlineType || (BarlineType = {}));
export class Barline extends StaveModifier {
    static get CATEGORY() {
        return "Barline";
    }
    static get type() {
        return BarlineType;
    }
    static get typeString() {
        return {
            single: BarlineType.SINGLE,
            double: BarlineType.DOUBLE,
            end: BarlineType.END,
            repeatBegin: BarlineType.REPEAT_BEGIN,
            repeatEnd: BarlineType.REPEAT_END,
            repeatBoth: BarlineType.REPEAT_BOTH,
            none: BarlineType.NONE,
        };
    }
    constructor(type) {
        super();
        this.thickness = Tables.STAVE_LINE_THICKNESS;
        const TYPE = BarlineType;
        this.widths = {};
        this.widths[TYPE.SINGLE] = 5;
        this.widths[TYPE.DOUBLE] = 5;
        this.widths[TYPE.END] = 5;
        this.widths[TYPE.REPEAT_BEGIN] = 5;
        this.widths[TYPE.REPEAT_END] = 5;
        this.widths[TYPE.REPEAT_BOTH] = 5;
        this.widths[TYPE.NONE] = 5;
        this.paddings = {};
        this.paddings[TYPE.SINGLE] = 0;
        this.paddings[TYPE.DOUBLE] = 0;
        this.paddings[TYPE.END] = 0;
        this.paddings[TYPE.REPEAT_BEGIN] = 15;
        this.paddings[TYPE.REPEAT_END] = 15;
        this.paddings[TYPE.REPEAT_BOTH] = 15;
        this.paddings[TYPE.NONE] = 0;
        this.layoutMetricsMap = {};
        this.layoutMetricsMap[TYPE.SINGLE] = {
            xMin: 0,
            xMax: 1,
            paddingLeft: 5,
            paddingRight: 5,
        };
        this.layoutMetricsMap[TYPE.DOUBLE] = {
            xMin: -3,
            xMax: 1,
            paddingLeft: 5,
            paddingRight: 5,
        };
        this.layoutMetricsMap[TYPE.END] = {
            xMin: -5,
            xMax: 1,
            paddingLeft: 5,
            paddingRight: 5,
        };
        this.layoutMetricsMap[TYPE.REPEAT_END] = {
            xMin: -10,
            xMax: 1,
            paddingLeft: 5,
            paddingRight: 5,
        };
        this.layoutMetricsMap[TYPE.REPEAT_BEGIN] = {
            xMin: -2,
            xMax: 10,
            paddingLeft: 5,
            paddingRight: 5,
        };
        this.layoutMetricsMap[TYPE.REPEAT_BOTH] = {
            xMin: -10,
            xMax: 10,
            paddingLeft: 5,
            paddingRight: 5,
        };
        this.layoutMetricsMap[TYPE.NONE] = {
            xMin: 0,
            xMax: 0,
            paddingLeft: 5,
            paddingRight: 5,
        };
        this.setPosition(StaveModifierPosition.BEGIN);
        this.setType(type);
    }
    getType() {
        return this.type;
    }
    setType(type) {
        this.type = typeof type === 'string' ? Barline.typeString[type] : type;
        this.setWidth(this.widths[this.type]);
        this.setPadding(this.paddings[this.type]);
        this.setLayoutMetrics(this.layoutMetricsMap[this.type]);
        return this;
    }
    draw() {
        const stave = this.checkStave();
        const ctx = stave.checkContext();
        this.setRendered();
        ctx.openGroup('stavebarline', this.getAttribute('id'));
        switch (this.type) {
            case BarlineType.SINGLE:
                this.drawVerticalBar(stave, this.x, false);
                break;
            case BarlineType.DOUBLE:
                this.drawVerticalBar(stave, this.x, true);
                break;
            case BarlineType.END:
                this.drawVerticalEndBar(stave, this.x);
                break;
            case BarlineType.REPEAT_BEGIN:
                this.drawRepeatBar(stave, this.x, true);
                if (stave.getX() !== this.x) {
                    this.drawVerticalBar(stave, stave.getX());
                }
                break;
            case BarlineType.REPEAT_END:
                this.drawRepeatBar(stave, this.x, false);
                break;
            case BarlineType.REPEAT_BOTH:
                this.drawRepeatBar(stave, this.x, false);
                this.drawRepeatBar(stave, this.x, true);
                break;
            default:
                break;
        }
        ctx.closeGroup();
    }
    drawVerticalBar(stave, x, doubleBar) {
        const staveCtx = stave.checkContext();
        const topY = stave.getTopLineTopY();
        const botY = stave.getBottomLineBottomY();
        if (doubleBar) {
            staveCtx.fillRect(x - 3, topY, 1, botY - topY);
        }
        staveCtx.fillRect(x, topY, 1, botY - topY);
    }
    drawVerticalEndBar(stave, x) {
        const staveCtx = stave.checkContext();
        const topY = stave.getTopLineTopY();
        const botY = stave.getBottomLineBottomY();
        staveCtx.fillRect(x - 5, topY, 1, botY - topY);
        staveCtx.fillRect(x - 2, topY, 3, botY - topY);
    }
    drawRepeatBar(stave, x, begin) {
        const staveCtx = stave.checkContext();
        const topY = stave.getTopLineTopY();
        const botY = stave.getBottomLineBottomY();
        let xShift = 3;
        if (!begin) {
            xShift = -5;
        }
        staveCtx.fillRect(x + xShift, topY, 1, botY - topY);
        staveCtx.fillRect(x - 2, topY, 3, botY - topY);
        const dotRadius = 2;
        if (begin) {
            xShift += 4;
        }
        else {
            xShift -= 4;
        }
        const dotX = x + xShift + dotRadius / 2;
        let yOffset = (stave.getNumLines() - 1) * stave.getSpacingBetweenLines();
        yOffset = yOffset / 2 - stave.getSpacingBetweenLines() / 2;
        let dotY = topY + yOffset + dotRadius / 2;
        staveCtx.beginPath();
        staveCtx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2, false);
        staveCtx.fill();
        dotY += stave.getSpacingBetweenLines();
        staveCtx.beginPath();
        staveCtx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2, false);
        staveCtx.fill();
    }
}
