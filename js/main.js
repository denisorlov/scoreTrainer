"use strict";
const utils = {
    elem: function (id) {
        let elementById = document.getElementById(id);
        if (elementById == null)
            throw new Error('Not found HTMLElement by id: ' + id);
        return elementById;
    },
    elemType: function (id, type) {
        return this.elem(id);
    },
    addListener: function (type, selector, foo) {
        document.querySelector(selector).addEventListener(type, foo);
    },
    toggle: function (selector) {
        let i, elems = document.querySelectorAll(selector);
        for (i = 0; i < elems.length; i++) {
            elems[i].style.display = elems[i].style.display == 'none' ? '' : 'none';
        }
    },
    setDraggable: function (el) {
        let rect = el.getBoundingClientRect();
        el.style.position = 'fixed';
        el.style.top = rect.top + 'px';
        el.style.left = rect.left + 'px';
        el.draggable = true;
        el.ondragstart = function (e) {
            el.style.cursor = 'move';
            el['_dragStartY'] = e.clientY;
            el['_dragStartX'] = e.clientX;
        };
        el.ondragend = function (e) {
            el.style.top = parseInt(el.style.top) + (e.clientY - window.screenY - el['_dragStartY']) + 'px';
            el.style.left = parseInt(el.style.left) + (e.clientX - window.screenX - el['_dragStartX']) + 'px';
        };
    },
    /**
     * https://stackoverflow.com/a/55111246/2223787
     * @param textarea
     */
    scrollToSelected: function (textarea) {
        let selectionEnd = textarea.selectionEnd, selectionStart = textarea.selectionStart;
        // First scroll selection region to view
        const fullText = textarea.value;
        textarea.value = fullText.substring(0, selectionEnd);
        // For some unknown reason, you must store the scollHeight to a variable
        // before setting the textarea value. Otherwise it won't work for long strings
        const scrollHeight = textarea.scrollHeight;
        textarea.value = fullText;
        let scrollTop = scrollHeight;
        const textareaHeight = textarea.clientHeight;
        if (scrollTop > textareaHeight) {
            // scroll selection to center of textarea
            scrollTop -= textareaHeight / 2;
        }
        else {
            scrollTop = 0;
        }
        textarea.scrollTop = scrollTop;
        // Continue to set selection range
        textarea.setSelectionRange(selectionStart, selectionEnd);
    },
    insertAtCursor: function (textarea, value) {
        if (textarea.selectionStart || textarea.selectionStart == 0) {
            let startPos = textarea.selectionStart, endPos = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, startPos)
                + value
                + textarea.value.substring(endPos, textarea.value.length);
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = startPos + value.length;
            return textarea.selectionStart;
        }
        else {
            textarea.value += value;
            textarea.focus();
            textarea.selectionStart = textarea.value.length;
            return textarea.selectionStart;
        }
    },
    HashNavigator: class HashNavigator {
        constructor(pushSlice) {
            this._index = -1;
            this._array = [];
            this._pushSlice = pushSlice;
        }
        push(newEl) {
            this.pushTo(this._index + 1, newEl);
            return this._index++;
        }
        pushTo(idx, newEl) {
            this._array.splice(idx, 0, newEl);
            if (this._pushSlice)
                this._array = this._array.slice(0, idx + 1); // не вставляем промежуточные, обрезаем
        }
        ;
        move(oldIdx, newIdx) {
            let el = this._array[oldIdx];
            this.remove(oldIdx);
            this.pushTo(newIdx, el);
        }
        ;
        setTo(el) {
            this._index = this._array.indexOf(el);
        }
        ;
        hasNext() {
            return this._index < this._array.length - 1;
        }
        ;
        hasPrevious() {
            return this._index > 0;
        }
        ;
        next() {
            if (!this.hasNext())
                return null;
            return this._array[++this._index];
        }
        ;
        previous() {
            if (!this.hasPrevious())
                return null;
            return this._array[--this._index];
        }
        ;
        // без перехода указателя
        getNext() {
            return this.hasNext() ? this._array[this._index + 1] : null;
        }
        ;
        // без перехода указателя
        getPrevious() {
            return this.hasPrevious() ? this._array[this._index - 1] : null;
        }
        ;
        current() {
            if (this._index < 0)
                return null;
            return this._array[this._index];
        }
        ;
        get index() {
            return this._index;
        }
        get array() {
            return this._array;
        }
        resetArray() { this._array = []; this._index = -1; }
        ;
        remove(idx) { this._array.splice(idx, 1); this._index = Math.min(this._array.length - 1, this._index); }
        ;
        moveTop(idx) { this.move(idx, 0); }
        ;
        moveBtm(idx) { this.move(idx, this._array.length - 1); }
        ;
    }
};
var DiffAction;
(function (DiffAction) {
    DiffAction["added"] = "a";
    DiffAction["removed"] = "r";
})(DiffAction || (DiffAction = {}));
const diffUtils = {
    wordDiffToMin: function (wordDiff) {
        let res = [], currPos = 0;
        wordDiff.forEach(it => {
            if (it.added) {
                res.push({ p: currPos, a: DiffAction.added, v: it.value });
                currPos += it.count;
            }
            else if (it.removed) {
                res.push({ p: currPos, a: DiffAction.removed, v: it.value });
            }
            else {
                currPos += it.count;
            }
        });
        return res;
    },
    redo: function (value, minDiff) {
        minDiff.forEach(it => {
            if (it.a == DiffAction.added) {
                value = [value.slice(0, it.p), it.v, value.slice(it.p)].join('');
            }
            else if (it.a == DiffAction.removed) {
                value = [value.slice(0, it.p), value.slice(it.p + it.v.length)].join('');
            }
        });
        return value;
    },
    undo: function (value, minDiff) {
        minDiff.slice().reverse().forEach(it => {
            if (it.a == DiffAction.added) {
                value = [value.slice(0, it.p), value.slice(it.p + it.v.length)].join('');
            }
            else if (it.a == DiffAction.removed) {
                value = [value.slice(0, it.p), it.v, value.slice(it.p)].join('');
            }
        });
        return value;
    }
};
const drumBeats = {
    "2/4": "dd 76 77 60 30",
    "3/4": "ddd 76 77 77 60 30 30",
    "4/4": "dddd 76 77 77 77 60 30 30 30",
    "5/4": "ddddd 76 77 77 76 77 60 30 30 60 30",
    "2/2": "dd 76 77 60 30",
    "6/8": "dddddd 76 77 77 76 77 77 60 30 30 50 30 30",
    "9/8": "ddd 76 77 77 60 30 30",
    "12/8": "dddd 76 77 77 77 60 30 30 30"
};
const pitchNames = {
    21: { note: "A", oct: "Субконтроктава", abc: "A,,,," },
    22: { note: "B♭", oct: "Субконтроктава", abc: "_B,,,," },
    23: { note: "B", oct: "Субконтроктава", abc: "B,,,," },
    24: { note: "C", oct: "Контроктава", abc: "C,,," },
    25: { note: "C#", oct: "Контроктава", abc: "^C,,," },
    26: { note: "D", oct: "Контроктава", abc: "D,,," },
    27: { note: "E♭", oct: "Контроктава", abc: "_E,,," },
    28: { note: "E", oct: "Контроктава", abc: "E,,," },
    29: { note: "F", oct: "Контроктава", abc: "F,,," },
    30: { note: "F#", oct: "Контроктава", abc: "^F,,," },
    31: { note: "G", oct: "Контроктава", abc: "G,,," },
    32: { note: "A♭", oct: "Контроктава", abc: "_A,,," },
    33: { note: "A", oct: "Контроктава", abc: "A,,," },
    34: { note: "A#", oct: "Контроктава", abc: "_B,,," },
    35: { note: "B", oct: "Контроктава", abc: "B,,," },
    36: { note: "C", oct: "Большая", abc: "C,," },
    37: { note: "C#", oct: "Большая", abc: "^C,," },
    38: { note: "D", oct: "Большая", abc: "D,," },
    39: { note: "E♭", oct: "Большая", abc: "_E,," },
    40: { note: "E", oct: "Большая", abc: "E,," },
    41: { note: "F", oct: "Большая", abc: "F,," },
    42: { note: "F#", oct: "Большая", abc: "^F,," },
    43: { note: "G", oct: "Большая", abc: "G,," },
    44: { note: "A♭", oct: "Большая", abc: "_A,," },
    45: { note: "A", oct: "Большая", abc: "A,," },
    46: { note: "B♭", oct: "Большая", abc: "_B,," },
    47: { note: "B", oct: "Большая", abc: "B,," },
    48: { note: "C", oct: "Малая", abc: "C," },
    49: { note: "C#", oct: "Малая", abc: "^C," },
    50: { note: "D", oct: "Малая", abc: "D," },
    51: { note: "E♭", oct: "Малая", abc: "_E," },
    52: { note: "E", oct: "Малая", abc: "E," },
    53: { note: "F", oct: "Малая", abc: "F," },
    54: { note: "F#", oct: "Малая", abc: "^F," },
    55: { note: "G", oct: "Малая", abc: "G," },
    56: { note: "A♭", oct: "Малая", abc: "_A," },
    57: { note: "A", oct: "Малая", abc: "A," },
    58: { note: "B♭", oct: "Малая", abc: "_B," },
    59: { note: "B", oct: "Малая", abc: "B," },
    60: { note: "C", oct: "Первая", abc: "C" },
    61: { note: "C#", oct: "Первая", abc: "^C" },
    62: { note: "D", oct: "Первая", abc: "D" },
    63: { note: "E♭", oct: "Первая", abc: "_E" },
    64: { note: "E", oct: "Первая", abc: "E" },
    65: { note: "F", oct: "Первая", abc: "F" },
    66: { note: "F#", oct: "Первая", abc: "^F" },
    67: { note: "G", oct: "Первая", abc: "G" },
    68: { note: "A♭", oct: "Первая", abc: "_A" },
    69: { note: "A", oct: "Первая", abc: "A" },
    70: { note: "B♭", oct: "Первая", abc: "_B" },
    71: { note: "B", oct: "Первая", abc: "B" },
    72: { note: "C", oct: "Вторая", abc: "c" },
    73: { note: "C#", oct: "Вторая", abc: "^c" },
    74: { note: "D", oct: "Вторая", abc: "d" },
    75: { note: "E♭", oct: "Вторая", abc: "_e" },
    76: { note: "E", oct: "Вторая", abc: "e" },
    77: { note: "F", oct: "Вторая", abc: "f" },
    78: { note: "F#", oct: "Вторая", abc: "^f" },
    79: { note: "G", oct: "Вторая", abc: "g" },
    80: { note: "A♭", oct: "Вторая", abc: "_a" },
    81: { note: "A", oct: "Вторая", abc: "a" },
    82: { note: "B♭", oct: "Вторая", abc: "_b" },
    83: { note: "B", oct: "Вторая", abc: "b" },
    84: { note: "C", oct: "Третья", abc: "c'" },
    85: { note: "C#", oct: "Третья", abc: "^c'" },
    86: { note: "D", oct: "Третья", abc: "d'" },
    87: { note: "E♭", oct: "Третья", abc: "_e'" },
    88: { note: "E", oct: "Третья", abc: "e'" },
    89: { note: "F", oct: "Третья", abc: "f'" },
    90: { note: "F#", oct: "Третья", abc: "^f'" },
    91: { note: "G", oct: "Третья", abc: "g'" },
    92: { note: "A♭", oct: "Третья", abc: "_a'" },
    93: { note: "A", oct: "Третья", abc: "a'" },
    94: { note: "B♭", oct: "Третья", abc: "_b'" },
    95: { note: "B", oct: "Третья", abc: "b'" },
    96: { note: "C", oct: "Четвертая", abc: "c''" },
    97: { note: "C#", oct: "Четвертая", abc: "^c''" },
    98: { note: "D", oct: "Четвертая", abc: "d''" },
    99: { note: "E♭", oct: "Четвертая", abc: "_e''" },
    100: { note: "E", oct: "Четвертая", abc: "e''" },
    101: { note: "F", oct: "Четвертая", abc: "f''" },
    102: { note: "F#", oct: "Четвертая", abc: "^f''" },
    103: { note: "G", oct: "Четвертая", abc: "g''" },
    104: { note: "A♭", oct: "Четвертая", abc: "_a''" },
    105: { note: "A", oct: "Четвертая", abc: "a''" },
    106: { note: "B♭", oct: "Четвертая", abc: "_b''" },
    107: { note: "B", oct: "Четвертая", abc: "b''" },
    108: { note: "C", oct: "Пятая", abc: "c'''" }
};
class MidiDriver {
    initMIDIAccess() {
        //@ts-ignore
        if (navigator.requestMIDIAccess) {
            console.log('navigator.requestMIDIAccess ok');
            //@ts-ignore
            navigator.requestMIDIAccess().then(this.requestMIDIAccessSuccess, window['_requestMIDIAccessFailure']);
        }
        else {
            console.log('navigator.requestMIDIAccess undefined');
        }
    }
    requestMIDIAccessSuccess(midi) {
        let inputs = midi.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
            input.value.onmidimessage = window['_midiOnMIDImessage'];
        }
        midi.onstatechange = window['_onstatechange'];
    }
    set requestMIDIAccessFailure(value) {
        window['_requestMIDIAccessFailure'] = value;
    }
    set midiOnMIDImessage(value) {
        window['_midiOnMIDImessage'] = value;
    }
    set onstatechange(value) {
        window['_onstatechange'] = value;
    }
}
/** Управление при помощи клавиш */
class TechMidi {
    constructor() {
        this.note58 = false;
        this.note59 = false;
        this.note60 = false;
        this.note61 = false;
    }
    set onTechNoteOn(value) {
        window['_techMidi_onTechNoteOn'] = value;
    }
    noteOn(pitch, velocity) {
        if (pitch == 58)
            this.note58 = true;
        else if (pitch == 59)
            this.note59 = true;
        else if (pitch == 60)
            this.note60 = true;
        else if (pitch == 61)
            this.note61 = true;
        let active = this.isActive();
        if (active)
            console.log('Tech keys are active!');
        if (active && (pitch < 58 || pitch > 61)) {
            window['_techMidi_onTechNoteOn'](pitch);
        }
    }
    noteOff(pitch) {
        if (pitch == 58)
            this.note58 = false;
        if (pitch == 59)
            this.note59 = false;
        if (pitch == 60)
            this.note60 = false;
        if (pitch == 61)
            this.note61 = false;
    }
    isActive() {
        return this.note58 && this.note59 && this.note60 && this.note61;
    }
}
class AbcjsHelper {
    constructor(ABCJS, audioContext) {
        this._synthControlVisualOptions = { displayLoop: true, displayRestart: true, displayPlay: true, displayProgress: true, displayWarp: true };
        this._synthControllerAudioParams = {};
        this.ABCJS = ABCJS;
        this.audioContext = audioContext;
    }
    /**
     * Рендерить нотный стан
     * @param paperElemId
     * @param abcStr
     * @param abcOptions
     * @param renderAbcCallBack
     */
    renderSheetMusic(paperElemId, abcStr, renderAbcCallBack) {
        let visualObj = this.ABCJS.renderAbc(paperElemId, abcStr, this._abcOptions)[0];
        visualObj.setUpAudio(); // без этого не будет информации о нотах
        if (renderAbcCallBack)
            renderAbcCallBack(visualObj);
        return visualObj;
    }
    renderEditor(paperElemId, audioElemId, editArea, editorParams) {
        this.destroySynthControl();
        this._cursorControl = this._cursorControl || new CursorControl(paperElemId, this._cursorOptions);
        editorParams = editorParams || {};
        editorParams.paper_id = paperElemId;
        editorParams.synth = {
            el: "#" + audioElemId,
            cursorControl: this._cursorControl,
            options: this._synthControlVisualOptions
        };
        editorParams.abcjsParams = this._abcOptions;
        this._editor = new ABCJS.Editor(editArea, editorParams);
        this._editor.synth.synthControl.visualObj.setUpAudio();
        this._mode = HelperMode.editor;
    }
    createSynth(paperElemId, audioElemId, visualObj, callBack) {
        var _a, _b;
        if (!this.ABCJS.synth.supportsAudio()) {
            document.querySelector('#' + audioElemId).innerHTML = "<div class='audio-error'>Audio is not supported in this browser.</div>";
            return;
        }
        this._cursorControl = this._cursorControl || new CursorControl(paperElemId, this._cursorOptions);
        if (!this._synthControl) {
            this.destroySynthControl();
            this._synthControl = new this.ABCJS.synth.SynthController();
            (_b = (_a = this._synthControl).load) === null || _b === void 0 ? void 0 : _b.call(_a, '#' + audioElemId, this._cursorControl, this._synthControlVisualOptions);
        }
        let helper = this;
        //let audioParams = this._synthControllerAudioParams as ISynthControllerAudioParams;
        this._synth = new this.ABCJS.synth.CreateSynth();
        helper._synth.init({
            audioContext: this.audioContext,
            visualObj: visualObj,
            options: {
                onEnded: (callbackContext) => { },
            }
        }).then(function (response) {
            var _a, _b, _c, _d;
            //console.log(response);
            (_b = (_a = helper._synthControl).disable) === null || _b === void 0 ? void 0 : _b.call(_a, true); // before setTune
            (_d = (_c = helper._synthControl).setTune) === null || _d === void 0 ? void 0 : _d.call(_c, visualObj, true, helper._synthControllerAudioParams).then(function (response) {
                //
            }).catch(function (error) {
                console.warn("Audio problem:", error);
            });
            helper._synth.prime().then(function (response) {
                if (callBack)
                    callBack();
            });
        }).catch(function (error) {
            console.warn("Audio problem:", error);
        });
        this._mode = HelperMode.synth;
    }
    get cursorControl() {
        return this._cursorControl;
    }
    isEditor() { return this._mode === HelperMode.editor; }
    ;
    get editor() {
        return this._editor;
    }
    getSynth() {
        return this.isEditor() ? this._editor.synth : this._synth;
    }
    getVisualObj() {
        return this.getSynthControl().visualObj;
    }
    getSynthControl() {
        return this.isEditor() ? this._editor.synth.synthControl : this._synthControl;
    }
    seekSeconds(noteTimeMs) {
        let synthControl = this.getSynthControl();
        if (synthControl) { // @ts-ignore
            let koeff = synthControl.warp / 100;
            // @ts-ignore // https://paulrosen.github.io/abcjs/audio/synthesized-sound.html#seek-percent-units
            synthControl.seek((noteTimeMs / 1000 / koeff).toFixed(3), 'seconds');
        }
    }
    _delegateSynthControl(functionName, arg) {
        if (this.getSynthControl()) { // @ts-ignore
            this.getSynthControl()[functionName](arg);
        }
    }
    play() {
        this._delegateSynthControl('play');
    }
    restart() {
        this._delegateSynthControl('restart');
    }
    // setWarp(warp: number): void{
    //     this._delegateSynthControl('setWarp', warp);
    // }
    /** текущий synthControl следует переиспользовать если возможно, иначе - уничтожить */
    destroySynthControl() {
        // if(this.getSynthControl()) { // @ts-ignore
        //     this.getSynthControl().destroy();
        // }
        this._delegateSynthControl('destroy');
    }
    set abcOptions(value) {
        this._abcOptions = value;
    }
    set synthControlVisualOptions(value) {
        this._synthControlVisualOptions = value;
    }
    set synthControllerAudioParams(value) {
        this._synthControllerAudioParams = value;
    }
    set cursorOptions(value) {
        this._cursorOptions = value;
    }
}
// https://paulrosen.github.io/abcjs/audio/synthesized-sound.html#cursorcontrol-object
function CursorControl(paperElemId, _cursorOptions) {
    //@ts-ignore
    let self = this;
    let options = _cursorOptions || {};
    self.beatSubdivisions = options.beatSubdivisions || 1;
    self.onReady = function () {
        if (options.onReady)
            options.onReady.call(self);
    };
    self.onStart = function () {
        if (options.cursor) {
            let svg = document.querySelector("#" + paperElemId + " svg");
            let cursor = document.createElementNS("http://www.w3.org/2000/svg", "line");
            cursor.setAttribute("class", "abcjs-cursor");
            cursor.setAttributeNS(null, 'x1', '0');
            cursor.setAttributeNS(null, 'y1', '0');
            cursor.setAttributeNS(null, 'x2', '0');
            cursor.setAttributeNS(null, 'y2', '0');
            svg.appendChild(cursor);
        }
        if (options.onStart)
            options.onStart.call(self);
    };
    self.onBeat = function (beatNumber, totalBeats, totalTime) {
        if (options.onBeat)
            options.onBeat.call(self, beatNumber, totalBeats, totalTime);
    };
    self.onEvent = function (ev) {
        if (ev.measureStart && ev.left === null)
            return; // this was the second part of a tie across a measure line. Just ignore it.
        removeClassFromPaper(paperElemId, "highlight");
        for (var i = 0; i < ev.elements.length; i++) {
            var note = ev.elements[i];
            for (var j = 0; j < note.length; j++) {
                note[j].classList.add("highlight");
            }
        }
        var cursor = document.querySelector("#" + paperElemId + " svg .abcjs-cursor");
        if (cursor) {
            cursor.setAttribute("x1", ev.left - 2 + '');
            cursor.setAttribute("x2", ev.left - 2 + '');
            cursor.setAttribute("y1", ev.top);
            cursor.setAttribute("y2", ev.top + ev.height);
        }
        if (options.onEvent)
            options.onEvent.call(self, ev);
    };
    self.onLineEnd = function (data) {
        if (options.onLineEnd)
            options.onLineEnd.call(self, data);
        // if(data.measureNumber>0)
        //     window.scrollBy({ top: parseInt(data.top)-currTop, left: 0, behavior: 'smooth' })
        // currTop = parseInt(data.top);
    };
    self.onFinished = function () {
        // var els = document.querySelectorAll("svg .highlight");
        // for (var i = 0; i < els.length; i++ ) {
        //     els[i].classList.remove("highlight");
        // }
        removeClassFromPaper(paperElemId, "highlight");
        var cursor = document.querySelector("#" + paperElemId + " svg .abcjs-cursor");
        if (cursor) {
            cursor.setAttribute("x1", '0');
            cursor.setAttribute("x2", '0');
            cursor.setAttribute("y1", '0');
            cursor.setAttribute("y2", '0');
        }
        if (options.onFinished)
            options.onFinished.call(self);
    };
}
function removeClassFromPaper(paperElemId, cls) {
    let lastSelection = document.querySelectorAll("#" + paperElemId + " svg ." + cls);
    for (let k = 0; k < lastSelection.length; k++)
        lastSelection[k].classList.remove(cls);
}
const allPitches = [
    'C,,,,', 'D,,,,', 'E,,,,', 'F,,,,', 'G,,,,', 'A,,,,', 'B,,,,',
    'C,,,', 'D,,,', 'E,,,', 'F,,,', 'G,,,', 'A,,,', 'B,,,',
    'C,,', 'D,,', 'E,,', 'F,,', 'G,,', 'A,,', 'B,,',
    'C,', 'D,', 'E,', 'F,', 'G,', 'A,', 'B,',
    'C', 'D', 'E', 'F', 'G', 'A', 'B',
    'c', 'd', 'e', 'f', 'g', 'a', 'b',
    "c'", "d'", "e'", "f'", "g'", "a'", "b'",
    "c''", "d''", "e''", "f''", "g''", "a''", "b''",
    "c'''", "d'''", "e'''", "f'''", "g'''", "a'''", "b'''",
    "c''''", "d''''", "e''''", "f''''", "g''''", "a''''", "b''''"
];
let AbcJsUtils = {
    moveNote: function (note, step) {
        step = step > 0 ? Math.min(step, 15) : Math.max(step, -15);
        let x = allPitches.indexOf(note);
        if (x >= 0)
            return allPitches[x - step] || note;
        return note;
    },
    tokenize: function (str) {
        let arr = str.split(/(!.+?!|".+?")/);
        let output = [];
        for (let i = 0; i < arr.length; i++) {
            let token = arr[i];
            if (token.length > 0) {
                if (token[0] !== '"' && token[0] !== '!') {
                    var arr2 = arr[i].split(/([A-Ga-g][,']*)/);
                    output = output.concat(arr2);
                }
                else
                    output.push(token);
            }
        }
        return output;
    },
    // https://paulrosen.github.io/abcjs/examples/dragging.html
    calcNewNoteText: function (abcElem, drag, abcString) {
        if (abcElem.pitches && drag && drag.step && abcElem.startChar >= 0 && abcElem.endChar >= 0) {
            return AbcJsUtils.calcNewNote(abcString.substring(abcElem.startChar, abcElem.endChar), drag.step);
        }
        return '';
    },
    calcNewNote: function (originalText, step) {
        let arr = AbcJsUtils.tokenize(originalText);
        // arr now contains elements that are either a chord, a decoration, a note name, or anything else. It can be put back to its original string with .join("").
        for (let i = 0; i < arr.length; i++) {
            arr[i] = AbcJsUtils.moveNote(arr[i], step);
        }
        return arr.join("");
    },
    checkNote(text) {
        let arr = AbcJsUtils.tokenize(text);
        for (let i = 0; i < arr.length; i++) {
            if (allPitches.indexOf(arr[i]) > -1)
                return true;
        }
        return false;
    },
    downloadMidi(abc, a) {
        a.setAttribute("href", ABCJS.synth.getMidiFile(abc, { midiOutputType: "encoded" }));
        a.click();
    }
};
// for AbcjsEditor
// function selectionChangeCallback(start, end) {
//     if (abcjsHelper.editor) {
//         var el = abcjsHelper.editor.tunes[0].getElementFromChar(start);
//         console.log(el);
//     }
// }
var HelperMode;
(function (HelperMode) {
    HelperMode["editor"] = "editor";
    HelperMode["synth"] = "synth";
})(HelperMode || (HelperMode = {}));
class AbcMidiHandler {
    constructor(paperElemId) {
        this.startIdx = 0;
        this.endIdx = 0;
        this.currIdx = 0;
        this._prevIdx = 0;
        this._wrongNote = 0;
        this._rightNote = 0;
        this.noteArr = [];
        /** список голосов, по которым проверяется нота, если пустой - по любым */
        this._checkVoices = [];
        this._maxWrongNotes = 4;
        this._prizeRightNotes = 5;
        this._onWrongNotes = (pitch) => { };
        this._onRightNotes = (pitch) => { };
        this._onNoteOff = (pitch) => { };
        this._onTimeStepDone = (currIdx) => { };
        this._onAllDoneNoteOff = () => { };
        /** Все ноты элемента выполнены */
        this._onAllElementNotesDone = (elem) => { };
        /**
         * При установке на старт
         * @param allDone флаг выполнения всех нот
         */
        this._onSetToStart = (allDone) => { };
        this._allDone = false;
        this.paperElemId = paperElemId;
    }
    initSteps(visualObj) {
        let preObj = {};
        visualObj.makeVoicesArray().forEach(arr => {
            arr.forEach(obj => {
                let elem = obj.elem;
                if (elem.type == "note") {
                    let time = Array.isArray(elem.abcelem.currentTrackMilliseconds) ? elem.abcelem.currentTrackMilliseconds[0] : elem.abcelem.currentTrackMilliseconds;
                    let arr = preObj[time] || [];
                    arr.push(elem);
                    preObj[time] = arr;
                }
            });
        });
        let resArr = [];
        for (let i in preObj) {
            let elems = preObj[i];
            resArr.push(new TimeStep(Number(i), elems));
        }
        resArr.sort((a, b) => {
            return a.time - b.time;
        });
        this.noteArr = resArr;
        this.startIdx = 0;
        this.endIdx = this.noteArr.length - 1;
        this._setToStartPrivate();
    }
    /**
     * Define startIdx and endIdx
     * @param startNoteTime if -1 from the START
     * @param endNoteTime if -1 till the END
     */
    initSelection(startNoteTime, endNoteTime) {
        let ok = 0;
        for (let ind = 0; ind < this.noteArr.length; ind++) {
            let timeStep = this.noteArr[ind];
            if (startNoteTime > -1) {
                if (timeStep.time == startNoteTime) {
                    this.startIdx = ind;
                    ok += 1;
                }
            }
            else {
                this.startIdx = 0;
                ok += 1; // от начала
            }
            if (ok == 1) { // найден старт
                if (endNoteTime > -1) {
                    if (timeStep.time == endNoteTime) {
                        this.endIdx = ind;
                        ok += 2;
                    }
                }
                else {
                    this.endIdx = this.noteArr.length - 1;
                    ok += 2; // до конца
                }
            }
            if (ok > 2)
                break;
        }
        if (ok < 3)
            throw new Error('Cannot initSelection, error code: ' + ok); // 1 - no end, 2 - no start
        this._setToStartPrivate();
        return {
            current: { index: this.currIdx, timeStep: this.noteArr[this.currIdx] },
            start: { index: this.startIdx, timeStep: this.noteArr[this.startIdx] },
            end: { index: this.endIdx, timeStep: this.noteArr[this.endIdx] },
        };
    }
    noteOn(pitch, velocity) {
        if (this.noteArr.length < 1)
            return;
        let currTimeStep = this.noteArr[this.currIdx];
        let ok = this._checkStep(currTimeStep, pitch);
        if (!ok) {
            if (this.currIdx > 0 && this._checkStep(this.noteArr[this._prevIdx], pitch)) {
                return; // это ноты предыдышего шага, не считаем за ошибку, музыкант закрепяет пройденное )
            }
            this._wrongNote++;
            this._onWrongNotes(pitch);
            if (this._wrongNote > this._maxWrongNotes) {
                this.setToStart(); // new try
            }
            return;
        }
        else {
            this._rightNote++;
            if (this._rightNote >= this._prizeRightNotes) {
                this._rightNote = 0;
                if (this._wrongNote > 0)
                    this._wrongNote--; // приз за старание
            }
            this._onRightNotes(pitch);
        }
        let checkDone = this.checkDone(currTimeStep.elems);
        if (checkDone) {
            this._onTimeStepDone(this.currIdx);
            this._prevIdx = this.currIdx;
            this.currIdx++;
            if (this._checkVoices.length > 0 && this.currIdx <= this.endIdx) {
                let intersection = this.getStepVoices(this.currIdx).filter(value => this._checkVoices.includes(value)); // https://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript
                while (this.currIdx <= this.endIdx && intersection.length < 1) { // пока нет голосов для проверки
                    this.currIdx++;
                    intersection = this.getStepVoices(this.currIdx).filter(value => this._checkVoices.includes(value));
                }
                ;
            }
            if (this.currIdx > this.endIdx) {
                this._allDone = true; // все сделано
                this.setToStart(true);
            }
        }
    }
    noteOff(pitch) {
        this._onNoteOff(pitch);
        if (this._allDone) {
            this._onAllDoneNoteOff();
            this._allDone = false;
        }
    }
    _setToStartPrivate() {
        this._wrongNote = 0;
        this._rightNote = 0;
        this.currIdx = this.startIdx;
        this.resetAllDone();
    }
    setToStart(allDone) {
        this._setToStartPrivate();
        this._onSetToStart(allDone);
    }
    /** Проверка ноты в рамках шага-времени  */
    _checkStep(timeStep, pitch) {
        let ok = false;
        timeStep.elems.forEach(elem => {
            if (this._checkVoices.length > 0 && this._checkVoices.indexOf(elem.counters.voice) == -1)
                return;
            let tryPitch = this.tryMidiPitch(pitch, elem);
            if (tryPitch) {
                ok = true;
            }
        });
        return ok;
    }
    /** Проверка ноты в рамках одного элемента шага-времени  */
    tryMidiPitch(pitch, elem) {
        let res = false;
        let allDone = true;
        elem.abcelem.midiPitches.forEach(mp => {
            if (mp.pitch == pitch) {
                mp._done = true;
                res = true;
            }
            if (!mp._done)
                allDone = false;
        });
        if (allDone) {
            this._onAllElementNotesDone(elem);
        }
        return res;
    }
    /** Проверка выполненых в рамках элементов шага-времени */
    checkDone(elems) {
        let res = true;
        elems.forEach(elem => {
            if (this._checkVoices.length > 0 && this._checkVoices.indexOf(elem.counters.voice) == -1)
                return;
            elem.abcelem.midiPitches.forEach(mp => {
                if (mp._done != true) {
                    res = false;
                }
            });
        });
        return res;
    }
    /** Сброс всех выполненых */
    resetAllDone() {
        let cnt = 0;
        this.noteArr.forEach(timeStep => {
            cnt += this.resetStepDone(timeStep);
        });
        return cnt;
    }
    /** Сброс выполненых в рамках шага-времени  */
    resetStepDone(timeStep) {
        let cnt = 0;
        timeStep.elems.forEach(elem => {
            elem.abcelem.midiPitches.forEach(mp => {
                if (mp._done) {
                    mp._done = false;
                    cnt++;
                }
            });
        });
        return cnt;
    }
    getCurrentIndex() {
        return this.currIdx;
    }
    getNextIndex() {
        return this.currIdx == this.endIdx ? this.startIdx : this.currIdx + 1;
    }
    getStep(index) {
        return this.noteArr[index];
    }
    getStepVoices(index) {
        let res = [];
        this.noteArr[index].elems.forEach(elem => {
            res.push(elem.counters.voice);
        });
        return res;
    }
    /**
     * Границы шага, для рассчета скроллинга
     * @param index
     */
    getStepTopBottom(index) {
        let step = this.noteArr[index];
        let top = Number.MAX_VALUE, bottom = 0;
        step.elems.forEach(elem => {
            elem.elemset.forEach(element => {
                let bcRect = element.getBoundingClientRect();
                top = Math.min(top, bcRect.top);
                bottom = Math.max(bottom, bcRect.bottom);
            });
        });
        return { top: top, bottom: bottom };
    }
    getEndStep() {
        return this.noteArr[this.noteArr.length - 1];
    }
    set prizeRightNotes(value) {
        this._prizeRightNotes = value;
    }
    set maxWrongNotes(value) {
        this._maxWrongNotes = value;
    }
    get maxWrongNotes() {
        return this._maxWrongNotes;
    }
    get wrongNote() {
        return this._wrongNote;
    }
    set onWrongNotes(foo) {
        this._onWrongNotes = foo;
    }
    set onRightNotes(foo) {
        this._onRightNotes = foo;
    }
    set onNoteOff(value) {
        this._onNoteOff = value;
    }
    set onTimeStepDone(value) {
        this._onTimeStepDone = value;
    }
    set onAllDoneNoteOff(value) {
        this._onAllDoneNoteOff = value;
    }
    set onAllElementNotesDone(value) {
        this._onAllElementNotesDone = value;
    }
    set onSetToStart(value) {
        this._onSetToStart = value;
    }
    set checkVoices(value) {
        this._checkVoices = value;
    }
}
class TimeStep {
    constructor(time, elems) {
        this.time = time;
        this.elems = elems;
    }
}
let abcLibIndex = [
    { cName: '-', mName: 'Cooley\'s', fName: 'Cooley\'s' },
    { cName: 'Bach J.S.', mName: 'BADINERIE aus der Orchestersuite Nr .2 h-Moll BWV1067', fName: 'Bach_BADINERIE' },
    { cName: 'Bach J.S.', mName: 'BADINERIE easy version', fName: 'Bach_BADINERIE_easy' },
    { cName: 'Beethoven L.', mName: 'Sonate No. 14, Moonlight 1', fName: 'Beethoven_Moonlight_1' },
    { cName: 'Mozart W.A.', mName: 'Eine kleine Nachtmusik', fName: 'Mozart_Eine_kleine_Nachtmusik_fragment' },
    { cName: 'Mozart W.A.', mName: 'Symphony No.40 in Gm, K550', fName: 'Mozart_Symphony_40_1' },
    { cName: 'Vivaldi A.', mName: 'Autumn', fName: 'Vivaldi_Autumn' },
    { cName: 'Л.Бекман', mName: 'В лесу родилась ёлочка', fName: 'V_lesu_rodilas_yolochka' },
];
let abcLibUtils = {
    initSelect: function (select, onchange) {
        abcLibIndex.forEach(it => {
            select.appendChild(abcLibUtils.newOption(it.cName + ': ' + it.mName, it.fName, false, false, { 'data-cName': it.cName }));
        });
        select.addEventListener('change', onchange);
    },
    newOption: function (text, value, defaultSelected, selected, attrs) {
        let op = new Option(text, value, defaultSelected, selected);
        attrs = attrs || {};
        for (let k in attrs)
            op.setAttribute(k, attrs[k]);
        return op;
    }
};
const languages = {
    ru: {
        titles: {
            noteOnViewLeft: "Влево",
            noteOnViewRight: "Вправо",
            noteOnViewSize: "Размер",
            noteOnViewClear: "Очистить",
            noteOnViewClose: "Закрыть",
            slowerButton: "Медленнее",
            tempoWarp: "Переключить темп половина/целый",
            fasterButton: "Быстрее",
            buildPlayerButton: "Построить",
            buildEditorButton: "Редактировать",
            noteOnViewButton: "Ноты миди",
            settingButton: "Настройки",
            staffWidth: "Width: Ширина в px",
            staffWidthResize: "Resize Mode: Ширина на всю страницу",
            staffScale: "Scale: Масштаб, игнорируется если ширина на всю страницу",
            preferredMeasuresPerLine: "Measures per Line: Предпочтительное кол-во тактов в строке",
            metronomeUse: "Use Metronome: Использовать метроном",
            metronomeOnlyUse: "Only Metronome: Использовать только метроном",
            metronomeText: "Metronome Text: Строка метронома в формате %%MIDI drum",
            changeInfo: "Параметры не менялись или применены",
            autoScroll: "Auto Scroll: Автоматическая прокрутка",
            scrollTopThreshold: "Scroll Top: Верхняя граница скролла",
            scrollBotThreshold: "Scroll Bottom: Нижняя граница скролла",
            scrollThresholdLineButton: "Показать уровни скролла",
            toStartButton: "В начало...",
            maxWrongNotes: "Максимум неверных нот",
            prizeNotes: "Призовые ноты, для сброса неверных нот",
            voicesCheckControlPanel: "Выбрать часть голосов для контроля",
            fixedDivTopHideButton: "Спрятать/показать панель",
            mouseWheelNote: "Перемещать колесом мыши выделенную ноту",
            //allowDragging: "Allow Dragging: Разрешить перетаскивание"
        },
        messages: {
            paramsChangedToApply: 'Параметры изменены, чтобы применить их  - нажмите "{0}"',
            paramsNotChanged: () => languages.ru.titles.changeInfo
        }
    },
    en: {
        titles: {
            noteOnViewLeft: "Left",
            noteOnViewRight: "Right",
            noteOnViewSize: "Size",
            noteOnViewClear: "Clear",
            noteOnViewClose: "Close",
            slowerButton: "Slower",
            tempoWarp: "Toggle tempo half/whole",
            fasterButton: "Faster",
            buildPlayerButton: "Build",
            buildEditorButton: "Edit",
            noteOnViewButton: "Midi Notes",
            settingButton: "Settings",
            staffWidth: "Width: Width in px",
            staffWidthResize: "Resize Mode: Full page width",
            staffScale: "Scale: Scale, ignored if full page width",
            preferredMeasuresPerLine: "Measures per Line: Preferred number of measures per line",
            metronomeUse: "Use Metronome: Use metronome",
            metronomeOnlyUse: "Only Metronome: Use metronome only",
            metronomeText: "Metronome Text: Metronome string in %%MIDI drum format",
            changeInfo: "Parameters not changed or applied",
            autoScroll: "Auto Scroll: Automatic scrolling",
            scrollTopThreshold: "Scroll Top: Upper scroll limit",
            scrollBotThreshold: "Scroll Bottom: Lower scroll limit",
            scrollThresholdLineButton: "Show scroll levels",
            toStartButton: "To the beginning...",
            maxWrongNotes: "Maximum of wrong notes",
            prizeNotes: "Prize notes, to reset wrong notes",
            voicesCheckControlPanel: "Select part of voices to check",
            fixedDivTopHideButton: "Hide/show panel",
            mouseWheelNote: "Move with mouse wheel selected note",
            //allowDragging: "Allow Dragging"
        },
        messages: {
            paramsChangedToApply: 'The parameters have been changed, to apply them - click "{0}"',
            paramsNotChanged: () => languages.en.titles.changeInfo
        }
    },
    ch: {
        titles: {
            noteOnViewLeft: "左",
            noteOnViewRight: "右",
            noteOnViewSize: "大小",
            noteOnViewClear: "清除",
            noteOnViewClose: "關閉",
            slowerButton: "慢一點",
            tempoWarp: "切換半/全節奏",
            fasterButton: "更快",
            buildPlayerButton: "建置",
            buildEditorButton: "編輯",
            noteOnViewButton: "Midi 筆記",
            settingButton: "設定",
            staffWidth: "寬度:以 px 為單位的寬度",
            staffWidthResize: "調整大小模式:全頁寬度",
            staffScale: "Scale:縮放,如果寬度為整頁則忽略",
            preferredMeasuresPerLine: "每行的測量數:每行的首選測量數",
            metronomeUse: "使用節拍器:使用節拍器",
            metronomeOnlyUse: "僅節拍器:僅使用節拍器",
            metronomeText: "節拍器文字:%%MIDI 鼓格式的節拍器字串",
            changeInfo: "參數尚未更改或套用",
            autoScroll: "自動滾動",
            scrollTopThreshold: "Scroll Top: 頂部滾動限制",
            scrollBotThreshold: "Scroll Bottom: 底部捲動邊框",
            scrollThresholdLineButton: "顯示滾動等級",
            toStartButton: "從頭開始...",
            maxWrongNotes: "最大錯誤筆記數",
            prizeNotes: "獎品備註,用於重置無效備註",
            voicesCheckControlPanel: "選擇部分票進行控制",
            fixedDivTopHideButton: "隱藏/顯示面板",
            mouseWheelNote: "移動滑鼠滾輪選擇音符",
            //allowDragging: "允許拖曳"
        },
        messages: {
            paramsChangedToApply: '設定已更改，要應用它們 - 單擊 "{0}"',
            paramsNotChanged: () => languages.ch.titles.changeInfo
        }
    }
};
const langUtils = {
    currentLanguage: 'ru',
    setCurrentLanguage: function (lang) {
        if (lang) {
            if (lang in languages)
                langUtils.currentLanguage = lang;
            else
                throw new Error('Not found language "' + lang + '" in languages');
        }
        langUtils.setTitles();
    },
    mess: function (code, vars) {
        if (!languages[langUtils.currentLanguage].messages[code]) {
            console.warn('Not found message for language "' + langUtils.currentLanguage + '" and code ' + code);
            return 'NOT_FOUND_MESSAGE_SEE_CONSOLE_WARN';
        }
        let mess = languages[langUtils.currentLanguage].messages[code];
        mess = mess instanceof Function ? mess() : mess;
        if (vars)
            mess = mess.replace(/\{(\d)\}/g, (s, num) => num < vars.length ? vars[num] : 'NOT_FOUND_VAR_' + num);
        return mess;
    },
    initSelect: function (select) {
        for (let k in languages) {
            select.appendChild(new Option(k, k, false, false));
        }
        select.addEventListener('change', (ev) => {
            let value = ev.target.value;
            langUtils.setCurrentLanguage(value);
        });
        select.dispatchEvent(new Event('change')); // init default
    },
    setTitles: function () {
        let lt = languages[langUtils.currentLanguage].titles;
        for (let k in lt) {
            let elementById = document.getElementById(k);
            if (!elementById) {
                console.warn("Not found element by id=" + k + " for setting title");
                continue;
            }
            elementById.title = lt[k];
        }
    }
};
// конфигурация TechMidi
let techMidi = new TechMidi();
techMidi.onTechNoteOn = (pitch) => {
    if (pitch == 62) {
        elem('playButton').click();
    } // D
    else if (pitch == 63) { } //D#
    else if (pitch == 64) {
        elem('slowerButton').click();
    } //E
    else if (pitch == 65) {
        elem('fasterButton').click();
    } //F
    else if (pitch == 66) {
        elem('metronomeUse').click();
    } //F#
    else if (pitch == 67) { } //G
    else if (pitch == 68) {
        elem('metronomeOnlyUse').click();
    } //G#
    else if (pitch == 69) { } //A
    else if (pitch == 70) {
        elem('extraMeasure').click();
    } //A#
    else if (pitch == 71) { } //B
};
// конфигурация MidiDriver
function midiNoteOn(pitch, velocity) {
    midiHandler.noteOn(pitch, velocity);
    techMidi.noteOn(pitch, velocity);
    noteView.addNote(pitch, true);
}
function midiNoteOff(pitch) {
    midiHandler.noteOff(pitch);
    techMidi.noteOff(pitch);
    noteView.delNote(pitch);
}
const midiDriver = new MidiDriver();
midiDriver.requestMIDIAccessFailure = (event) => {
    console.log('requestMIDIAccessFailure', event);
};
midiDriver.midiOnMIDImessage = (event) => {
    let data = event.data, cmd = data[0] >> 4, channel = data[0] & 0xf, type = data[0] & 0xf0, pitch = data[1], velocity = data[2];
    if (type == 144 && velocity > 0) {
        midiNoteOn(pitch, velocity);
    }
    else if (type == 128 || (type == 144 && velocity == 0)) {
        midiNoteOff(pitch);
    }
};
midiDriver.onstatechange = (event) => {
    console.log('onstatechange', event);
};
midiDriver.initMIDIAccess();
document.addEventListener('DOMContentLoaded', (event) => {
    ABCJS = window['ABCJS'];
    noteView = new PlayedNoteView(ABCJS, 'viewPaper', HighlightWrongCls);
    noteView.delNote(60); // empty
    undoBuffer1 = getAbcText();
    initElems(elems);
    utils.setDraggable(utils.elem('noteOnView'));
    setButtons();
    utils.addListener('change', '#abcText', (ev) => {
        let diff = wordDiff.diff(undoBuffer1, ev.currentTarget.value);
        if (diff.length > 0) { // если есть изменения
            editHash.push(diffUtils.wordDiffToMin(diff)); // положили разницу в буфер
            console.info('editHash.array.length=', editHash.array.length);
            undoBuffer1 = ev.currentTarget.value;
            handleUndoRedoButtons();
        }
        buildSheetMusicEditor();
    });
    // utils.addListener("change", "#allowDragging", (ev)=>{
    //     allowDragging = (ev.currentTarget as HTMLInputElement).checked; // global
    //     buildSheetMusicEditor();
    // });
    //selectAbc
    setSelectAbcText();
    setChanged(false);
    for (let el of utils.elem('settingPanel').children) {
        if (['INPUT'].indexOf(el.tagName) >= 0)
            utils.addListener("change", "#" + el.id, () => {
                setChanged(true);
                buildSheetMusicEditor();
            });
    }
    // tempo
    setTempoButtons();
    // set Scroll Lines
    setScrollLines();
    //
    createEditorButtons();
    //setKeydown();
    // midiHandler + WrongNotes Indicator
    setWrongNotesIndicator();
    // language titles
    langUtils.initSelect(utils.elemType('selectLang', HTMLSelectElement));
});
function setButtons() {
    utils.addListener("click", "#buildPlayerButton", () => {
        buildSheetMusicEditor(); //buildSheetMusicPlayer();
    });
    utils.addListener("click", "#buildEditorButton", () => {
        utils.toggle('#fixedDivBottom'); //buildSheetMusicEditor();
    });
    // play
    // utils.addListener("click", "#playButton", ()=>{
    //     checkAbcjsHelper(); abcjsHelper.play();
    // });
}
function setSelectAbcText() {
    abcLibUtils.initSelect(utils.elemType('selectAbc', HTMLSelectElement), (ev) => {
        let value = ev.target.value;
        if (!value)
            return;
        ev.target.title = value;
        fetch('/src/abclib/' + value)
            .then(response => response.text())
            .then(abcText => {
            setAbcText(abcText);
            undoBuffer1 = getAbcText();
            editHash.resetArray();
            editHash.push([]);
            handleUndoRedoButtons();
            buildSheetMusicEditor(); //buildSheetMusicPlayer();
        });
    });
}
function handleUndoRedoButtons() {
    elemType('undoButton', HTMLButtonElement).disabled = !editHash.hasPrevious();
    elemType('redoButton', HTMLButtonElement).disabled = !editHash.hasNext();
}
function setTempoButtons() {
    elem('tempoWarp').innerHTML = tempoWarp + '%';
    elemType('fasterButton', HTMLButtonElement).disabled = true;
    utils.addListener("click", "#slowerButton", () => {
        tempoWarp = Math.max(20, tempoWarp - 10);
        treatSlowerFasterButton();
    });
    utils.addListener("click", "#fasterButton", () => {
        tempoWarp = Math.min(100, tempoWarp + 10);
        treatSlowerFasterButton();
    });
    utils.addListener("click", "#tempoWarp", () => {
        showStatus('Темп ' + (tempoWarp == 100 ? 'пополам' : 'полный'));
        tempoWarp = tempoWarp == 100 ? 50 : 100;
        treatSlowerFasterButton();
    });
    function treatSlowerFasterButton() {
        elem('tempoWarp').innerHTML = tempoWarp + '%';
        checkAbcjsHelper();
        elemType('slowerButton', HTMLButtonElement).disabled = true;
        elemType('fasterButton', HTMLButtonElement).disabled = true;
        if (abcjsHelper && abcjsHelper.getSynthControl()) // @ts-ignore
            abcjsHelper.getSynthControl().setWarp(tempoWarp).then(function () {
                elemType('slowerButton', HTMLButtonElement).disabled = tempoWarp <= 20;
                elemType('fasterButton', HTMLButtonElement).disabled = tempoWarp >= 100;
            });
    }
}
function setScrollLines() {
    let stEl = utils.elemType('scrollTopThreshold', HTMLInputElement), sbEl = utils.elemType('scrollBotThreshold', HTMLInputElement), topLine = utils.elem('scrollTopThresholdLine'), botLine = utils.elem('scrollBotThresholdLine');
    utils.addListener("change", "#scrollTopThreshold", (ev) => {
        scrollTopThreshold = ev.currentTarget.value; // global
        topLine.style.top = scrollTopThreshold + 'px';
    });
    utils.addListener("change", "#scrollBotThreshold", (ev) => {
        scrollBotThreshold = (document.documentElement.clientHeight - parseInt(ev.currentTarget.value)); // global
        botLine.style.top = scrollBotThreshold + 'px';
    });
    utils.addListener("change", "#autoScroll", (ev) => {
        autoScroll = ev.currentTarget.checked; // global
        stEl.disabled = sbEl.disabled = !autoScroll;
        topLine.style.opacity = botLine.style.opacity = (autoScroll ? 1 : 0.3) + '';
    });
    let event = new Event('change');
    stEl.dispatchEvent(event);
    sbEl.dispatchEvent(event);
}
function createEditorButtons() {
    let htmlElement = utils.elem('noteButtons'), abcTextArea = elemType('abcTextArea', HTMLTextAreaElement);
    let map = { 'z': '𝄽', '^': '𝄰', '_': '𝄭', '=': '𝄮' };
    ['A,,', 'D,', 'G,', 'C', 'F', 'B', 'e',
        '^', '_', '=',
        '[', ']', '|', 'z', 'x'
    ].forEach((it, ind) => {
        let but = document.createElement('input');
        but.type = 'button';
        but.value = map[it] || it;
        but.setAttribute('data-value', it);
        but.addEventListener('click', (ev) => {
            if (abcTextArea.selectionStart != abcTextArea.selectionStart) {
                return;
            }
            utils.insertAtCursor(abcTextArea, ev.currentTarget.getAttribute('data-value'));
            abcTextArea.dispatchEvent(new Event('change'));
        });
        htmlElement.appendChild(but);
    });
    utils.addListener('click', '#undoButton', () => {
        if (editHash.hasPrevious()) {
            let undoDiff = editHash.current(); // get current...
            editHash.previous(); // but move index
            undoRedo((val) => diffUtils.undo(val, undoDiff));
        }
    });
    utils.addListener('click', '#redoButton', () => {
        if (editHash.hasNext()) {
            let redoDiff = editHash.next();
            undoRedo((val) => diffUtils.redo(val, redoDiff));
        }
    });
    function undoRedo(valueSupplier) {
        let selectionEnd = abcTextArea.selectionEnd, selectionStart = abcTextArea.selectionStart;
        undoBuffer1 = abcTextArea.value = valueSupplier(abcTextArea.value);
        buildSheetMusicEditor(); //abcTextArea.dispatchEvent(new Event('change'));
        abcTextArea.focus();
        abcTextArea.selectionStart = selectionStart;
        abcTextArea.selectionEnd = selectionEnd;
        handleUndoRedoButtons();
    }
    // utils.addListener('click', '#upNote', ()=>{
    //     dragNoteBySelection(abcTextArea, -1);
    //     abcTextArea.focus();
    // });
    utils.addListener('click', '#downloadMidi', () => {
        AbcJsUtils.downloadMidi(getAbcText(), utils.elemType('midi-download', HTMLAnchorElement));
    });
    utils.addListener('wheel', '#mouseWheelNote', (e) => {
        const delta = Math.sign(e.deltaY);
        dragNoteBySelection(abcTextArea, delta);
        abcTextArea.focus();
        e.preventDefault(); // !
    });
}
function setKeydown() {
    document.addEventListener('keydown', (event) => {
        let key = event.code;
        let prev = false;
        switch (key) {
            case 'Space': // backspace
                utils.elem('playButton').click();
                prev = true;
                break;
            case 'ArrowUp': // up narrow
                utils.elem('fasterButton').click();
                prev = true;
                break;
            case 'ArrowDown': // down narrow
                utils.elem('slowerButton').click();
                prev = true;
                break;
        }
        prev === true ? event.preventDefault() : 0;
    });
}
function setWrongNotesIndicator() {
    midiHandler.maxWrongNotes = 4;
    utils.elemType('maxWrongNotes', HTMLMeterElement).value = midiHandler.maxWrongNotes = 4;
    utils.addListener('change', '#maxWrongNotes', (ev) => {
        midiHandler.maxWrongNotes = ev.target.value;
    });
    midiHandler.prizeRightNotes = 5;
    utils.elemType('prizeNotes', HTMLMeterElement).value = 5;
    utils.addListener('change', '#prizeNotes', (ev) => {
        midiHandler.prizeRightNotes = ev.target.value;
    });
    midiHandler.onWrongNotes = (pitch) => {
        console.warn('Wrong note: ' + pitch);
        if (midiHandler.wrongNote > midiHandler.maxWrongNotes) {
            resetIndicator();
        }
        else {
            setIndicator("swmIndicator", midiHandler.wrongNote * 100 / midiHandler.maxWrongNotes, 'Mistakes:' + midiHandler.wrongNote);
            highlightWrongNote(pitch);
        }
        scrollByMidiHandlerSteps();
    };
    midiHandler.onRightNotes = (pitch) => {
        console.info('Right note: ' + pitch);
        if (midiHandler.wrongNote < 1) {
            resetIndicator();
        }
        else {
            setIndicator("swmIndicator", midiHandler.wrongNote * 100 / midiHandler.maxWrongNotes, 'Mistakes:' + midiHandler.wrongNote);
        }
        scrollByMidiHandlerSteps();
    };
    midiHandler.onNoteOff = (pitch) => {
    };
    midiHandler.onTimeStepDone = (currIdx) => {
        console.log('Time Step is done at index ' + currIdx);
    };
    midiHandler.onSetToStart = (allDone) => {
        if (!allDone) {
            settingToStart();
        }
    };
    midiHandler.onAllDoneNoteOff = () => {
        settingToStart();
    };
    midiHandler.onAllElementNotesDone = (elem) => {
        elem.elemset.forEach(element => {
            element.classList.add(highlightClassName);
        });
    };
    utils.addListener('click', '#toStartButton', (ev) => {
        if (!midiHandler.getEndStep()) {
            showStatus('Нотный набор не загружен');
            return;
        }
        showStatus('Контроль нот выставлен в начало фрагмента');
        midiHandler.setToStart(false);
        resetIndicator();
    });
}
function setIndicator(elemId, percent, label) {
    let swmIndicator = document.getElementById(elemId);
    swmIndicator.style.width = percent + '%';
    swmIndicator.innerHTML = label;
}
function resetIndicator() { setIndicator("swmIndicator", 0, '&nbsp;'); }
function scrollByMidiHandlerSteps() {
    let currentIndex = midiHandler.getCurrentIndex(), nextIndex = midiHandler.getNextIndex(), index = nextIndex > currentIndex ? nextIndex : currentIndex, topBtm = midiHandler.getStepTopBottom(index);
    scrollForBottom(topBtm.bottom); // сперва низ
    topBtm = midiHandler.getStepTopBottom(index);
    scrollForTop(topBtm.top); // затем проверем верх, т.к. внизу обычно есть запас
}
function settingToStart() {
    removeClassFromPaper(paperElemId, highlightClassName);
    scrollByMidiHandlerSteps();
    resetIndicator();
}
function highlightWrongNote(pitch, durationMs) {
    let note = pitchNames[pitch];
    showStatus('<span style="color: orange;font-weight: bold">Ошибка: ' + note.note + ' (окт: ' + note.oct + ')</span>');
    //-------------------
    let min = 1000, elemForHighlightWrongCls, step = midiHandler.getStep(midiHandler.getCurrentIndex());
    step.elems.forEach(elem => {
        elem.abcelem.midiPitches.forEach(mp => {
            let newMin = Math.abs(mp.pitch - pitch); // ищем ближайший набор фальшивой ноте
            if (newMin < min) {
                min = newMin;
                elemForHighlightWrongCls = elem;
            }
        });
    });
    elemForHighlightWrongCls.elemset.forEach(element => {
        element.classList.add(HighlightWrongCls);
    });
    setTimeout(() => { removeClassFromPaper(paperElemId, HighlightWrongCls); }, durationMs || 1000);
}
//////// played notes
class PlayedNote {
    constructor(pitch, abc, right) {
        this.pitch = pitch;
        this.abc = abc;
        this.right = right;
    }
}
class PlayedNoteView {
    constructor(ABCJS, paperElemId, highlightWrongClass) {
        this.playedNotes = {};
        this._abcOptions = { scale: 2.0, staffwidth: 150 };
        this._ABCJS = ABCJS;
        this._paperElemId = paperElemId;
        this._highlightWrongClass = highlightWrongClass;
    }
    addNote(pitch, right) {
        this.playedNotes[pitch] = new PlayedNote(pitch, pitchNames[pitch].abc, right);
        this.renderPlayedNote();
    }
    delNote(pitch) {
        delete this.playedNotes[pitch];
        this.renderPlayedNote();
    }
    clear() {
        this.playedNotes = {};
        this.renderPlayedNote();
    }
    renderPlayedNote() {
        let trebleV = 1, bassV = 10, trebleScore = '', bassScore = '', trebleVoices = '', bassVoices = '', wrongs = [];
        for (let pitch in this.playedNotes) {
            let playedNote = this.playedNotes[pitch];
            if (!playedNote.right)
                wrongs.push(playedNote.abc);
            if (playedNote.pitch >= 60) {
                trebleScore += trebleV + ' ';
                trebleVoices += '\r\n' + 'V:' + trebleV + '\r\n' + playedNote.abc;
                trebleV++;
            }
            else {
                bassScore += bassV + ' ';
                bassVoices += '\r\n' + 'V:' + bassV + '\r\n' + playedNote.abc;
                bassV++;
            }
        }
        let abcStr = 'X:1\n' +
            '%%score { ('
            + (trebleV == 1 ? trebleV : trebleScore) +
            ') | ('
            + (bassV == 10 ? bassV : bassScore) +
            ') }\n' +
            'L:1\n' +
            'V:1 treble\n' +
            'V:10 bass' +
            (trebleV == 1 ? '\r\n' + 'V:' + trebleV + '\r\n' + 'x' : trebleVoices) +
            (bassV == 10 ? '\r\n' + 'V:' + bassV + '\r\n' + 'x' : bassVoices);
        //console.log(abcStr);
        this._ABCJS.renderAbc(this._paperElemId, abcStr, this._abcOptions); //{ scale: 2.0, staffWidth: 180}
        if (wrongs.length > 0) {
            let paths = document.querySelectorAll('#' + this._paperElemId + ' path');
            for (let k = 0; k < paths.length; k++) {
                let dataName = paths[k].getAttribute('data-name') || '';
                if (wrongs.indexOf(dataName) >= 0) {
                    paths[k].classList.add(this._highlightWrongClass);
                }
            }
        }
    }
    set abcOptions(value) {
        this._abcOptions = value;
    }
    get abcOptions() {
        return this._abcOptions;
    }
}
//////// played notes
function initElems(elems) {
    elems.changeInfo = utils.elem('changeInfo');
    elems.buildPlayerButton = utils.elem('buildPlayerButton');
    elems.abcTextArea = utils.elemType(abcTextElemId, HTMLTextAreaElement);
    //elems.playButton = utils.elem('playButton');
    elems.slowerButton = utils.elemType('slowerButton', HTMLButtonElement);
    elems.fasterButton = utils.elemType('fasterButton', HTMLButtonElement);
    elems.undoButton = utils.elemType('undoButton', HTMLButtonElement);
    elems.redoButton = utils.elemType('redoButton', HTMLButtonElement);
    elems.tempoWarp = utils.elem('tempoWarp');
    elems.metronomeUse = utils.elem('metronomeUse');
    elems.metronomeOnlyUse = utils.elem('metronomeOnlyUse');
    //elems.extraMeasure = utils.elem('extraMeasure');
}
/**
 * @TODO
 * сброс счетчика ошибок???
 * сохранение настроек
 * настройки отображения к нотам
 * ограничитель буфера undo redo
 * undo redo lib: https://www.cssscript.com/undo-redo-history/, https://github.com/kpdecker/jsdiff/blob/master/src/diff/base.js, https://stackoverflow.com/a/79310421/2223787
 * глобальная замена в редакторе
 * индикация МИДИ
 *
 * замены: %\d+\r\n, $,
 * убрать форшлаги {[^} ]+}
 * расставить голоса V и L по голосам
 * убрать %%scale, добавить %%measurenb 0 (?), проверить на дубли T:
 */
let ABCJS, audioContext, abcjsHelper, noteView, editHash = new utils.HashNavigator(true), wordDiff = new window['Diff']();
editHash.push([]); //zero element with no previous
////// elems scope
const elems = {};
function elem(id) {
    return elemType(id, HTMLElement);
}
function elemType(id, type) {
    if (!elems[id])
        throw new Error('Not found ' + type.name + ' by id: ' + id);
    return elems[id];
}
const paperElemId = 'paper';
const audioElemId = 'audio';
const abcTextElemId = 'abcText';
const highlightClassName = 'highlight';
/** класс "невыделенных нот", для визуализации частичного выделения */
const UnselectedNotesCls = 'unselected-notes';
/** класс "неправильных нот", для визуализации */
const HighlightWrongCls = 'highlight-wrong';
// @ts-ignore
let midiHandler = new AbcMidiHandler(paperElemId);
let changed;
let tempoWarp = 100;
let context = {
    debug: {
        onEvent: false
    }
};
function checkAbcjsHelper() {
    if (!abcjsHelper) { // singleton
        audioContext = new AudioContext();
        abcjsHelper = new AbcjsHelper(ABCJS, audioContext);
    }
}
function setAbcjsHelper() {
    abcjsHelper.abcOptions = getAbcOptions();
    abcjsHelper.synthControllerAudioParams = buildSynthControllerAudioParams();
    abcjsHelper.cursorOptions = {
        onEvent: (ev) => {
            if (abcjsHelper.getSynthControl().isStarted) { // ev.measureStart &&
                scrollScore(ev);
            }
            currNoteTime = ev.milliseconds; // global
            if (currStartNoteTime != -1 && currEndNoteTime != -1) {
                //@ts-ignore
                let koeff = abcjsHelper.getSynthControl().warp / 100;
                if (Math.floor(ev.milliseconds * koeff) > Math.round(currEndNoteTime)
                    || Math.round(ev.milliseconds * koeff) < Math.floor(currStartNoteTime)) {
                    //console.log(ev.milliseconds, startNoteTime.value, endNoteTime.value);
                    abcjsHelper.seekSeconds(currStartNoteTime);
                }
            }
            if (context.debug.onEvent)
                console.dir(ev);
        }
    };
}
function prepareMetronomeText(renderObj) {
    let mf = renderObj.getMeterFraction();
    utils.elemType('metronomeText', HTMLInputElement).value = drumBeats[mf.num + '/' + mf.den] || '';
}
function prepareVoicesCheckControl(visualObj) {
    let span = utils.elem('voicesCheckControlPanel');
    span.innerHTML = '';
    visualObj.makeVoicesArray().forEach((it, ind, all) => {
        let label = document.createElement('label');
        label.innerHTML = '<label>' + (ind + 1) + '<input class="voicesCheckControlChb" id="voicesCheckChb_' + ind + '" type="checkbox" data-index="' + ind + '"></label>';
        span.appendChild(label);
    });
    document.querySelectorAll('.voicesCheckControlChb').forEach(el => {
        utils.addListener("change", "#" + el.id, () => {
            let chbs = Array.from(document.querySelectorAll('.voicesCheckControlChb')), chbsChecked = chbs.filter(el => el.checked);
            if (chbsChecked.length < chbs.length) {
                let checkVoices = [];
                chbsChecked.forEach(ch => {
                    checkVoices.push(parseInt(ch.getAttribute("data-index")));
                });
                midiHandler.checkVoices = checkVoices; //console.log('midiHandler.checkVoices', checkVoices)
            }
            else {
                midiHandler.checkVoices = []; //console.log('midiHandler.checkVoices = []')
            }
        });
    });
}
function buildSheetMusicPlayer() {
    let renderObj = ABCJS.renderAbc("*", getAbcText())[0];
    prepareMetronomeText(renderObj);
    prepareVoicesCheckControl(renderObj);
    checkAbcjsHelper();
    setAbcjsHelper();
    let visualObj = abcjsHelper.renderSheetMusic(paperElemId, getAbcText());
    abcjsHelper.createSynth(paperElemId, audioElemId, visualObj, () => {
        midiHandler.initSteps(abcjsHelper.getVisualObj());
    });
    utils.elem('fixedDivBottom').style.display = 'none';
    resetIndicator();
    setChanged(false);
}
function buildSheetMusicEditor() {
    let renderObj = ABCJS.renderAbc("*", getAbcText())[0];
    prepareMetronomeText(renderObj);
    prepareVoicesCheckControl(renderObj);
    checkAbcjsHelper();
    setAbcjsHelper();
    abcjsHelper.renderEditor(paperElemId, audioElemId, abcTextElemId, { warnings_id: 'warnings' });
    midiHandler.initSteps(abcjsHelper.getVisualObj());
    //utils.elem('fixedDivBottom').style.display = 'block';
    resetIndicator();
    setChanged(false);
}
function setChanged(_changed) {
    changed = _changed;
    let changeInfo = elem('changeInfo'), buildPlayerButton = elem('buildPlayerButton');
    changeInfo.style.color = _changed ? 'red' : 'green';
    changeInfo.title = _changed ? langUtils.mess('paramsChangedToApply', [buildPlayerButton.title]) : langUtils.mess('paramsNotChanged');
    if (_changed)
        showStatus(changeInfo.title);
    return _changed;
}
function getAbcText() {
    return utils.elemType(abcTextElemId, HTMLTextAreaElement).value;
}
function setAbcText(text) {
    utils.elemType(abcTextElemId, HTMLTextAreaElement).value = text;
}
// https://paulrosen.github.io/abcjs/visual/render-abc-options.html
function getAbcOptions() {
    let staffWidth = utils.elemType('staffWidth', HTMLInputElement).value, paddingLeft = utils.elemType('paddingLeft', HTMLInputElement).value, paddingRight = utils.elemType('paddingRight', HTMLInputElement).value, staffScale = utils.elemType('staffScale', HTMLInputElement).value, preferredMeasuresPerLine = utils.elemType('preferredMeasuresPerLine', HTMLInputElement).value, staffWidthResize = utils.elemType('staffWidthResize', HTMLInputElement).checked;
    return {
        // If the number passed is between zero and one, then the music is printed smaller, if above one, then it is printed bigger
        scale: staffScale,
        add_classes: true,
        clickListener: clickListener,
        // https://paulrosen.github.io/abcjs/examples/dragging.html
        dragging: allowDragging, //selectTypes: [ 'note'], //dragColor: "blue", //selectionColor: "green",
        responsive: staffWidthResize ? "resize" : "",
        // This is the width in pixels of the layout. It won't change where things are laid out, it will just change the amount of spacing between elements
        staffwidth: parseInt(staffWidth),
        paddingleft: paddingLeft,
        paddingright: paddingRight,
        wrap: {
            minSpacing: 1.5,
            maxSpacing: 2.7,
            lastLineLimit: false,
            preferredMeasuresPerLine: preferredMeasuresPerLine
        }
    };
}
function clickListener(abcElem, tuneNumber, classes, analysis, drag, mouseEvent) {
    var _a;
    console.dir({
        currentTrackMilliseconds: abcElem.currentTrackMilliseconds,
        currentTrackWholeNotes: abcElem.currentTrackWholeNotes,
        analysis: analysis,
        midiPitches: abcElem.midiPitches,
        gracenotes: abcElem.gracenotes,
        midiGraceNotePitches: abcElem.midiGraceNotePitches
    });
    let lastClicked = abcElem.midiPitches;
    if (!lastClicked)
        return;
    ABCJS.synth.playEvent(lastClicked, abcElem.midiGraceNotePitches, (_a = abcjsHelper === null || abcjsHelper === void 0 ? void 0 : abcjsHelper.getSynthControl().visualObj) === null || _a === void 0 ? void 0 : _a.millisecondsPerMeasure()).then(function (response) {
    }).catch(function (error) {
        console.log("error playing note", error);
    });
    if (abcjsHelper.isEditor()) {
        if (allowDragging)
            dragNoteByAbcElem(abcjsHelper.editor.editarea.textarea, abcElem, drag);
        utils.scrollToSelected(abcjsHelper.editor.editarea.textarea);
    }
    handleNoteSelection(abcElem, abcjsHelper.getVisualObj()); // set globals: currNoteTime, currStartNoteTime, currEndNoteTime
    abcjsHelper.seekSeconds(currStartNoteTime); // seek by click
}
////////// NoteDragging
let allowDragging = false;
function dragNoteByAbcElem(editorTextarea, abcElem, drag) {
    let abcString = editorTextarea.value, newText = AbcJsUtils.calcNewNoteText(abcElem, drag, abcString);
    if (newText != '') {
        drawDragged(editorTextarea, newText, abcElem.startChar, abcElem.endChar);
    }
}
function dragNoteBySelection(editorTextarea, step) {
    let abcString = editorTextarea.value, originalText, selectionEnd = editorTextarea.selectionEnd, selectionStart = editorTextarea.selectionStart;
    if (selectionEnd == selectionStart) {
        do {
            selectionStart--;
            originalText = abcString.substring(selectionStart, selectionEnd);
        } while (!/[\s|:]/.test(originalText) // пробел, перенос и т.д. и знаки |,:
            && !AbcJsUtils.checkNote(originalText) && selectionStart > 1);
    }
    else
        originalText = abcString.substring(selectionStart, selectionEnd);
    let newText = AbcJsUtils.calcNewNote(originalText, step);
    if (newText != '') {
        drawDragged(editorTextarea, newText, selectionStart, selectionEnd);
    }
}
let undoBuffer1 = '';
function drawDragged(editorTextarea, newText, start, end) {
    let abcString = editorTextarea.value;
    abcString = abcString.substring(0, start) + newText + abcString.substring(end);
    editorTextarea.value = abcString;
    editorTextarea.dispatchEvent(new Event('change'));
    editorTextarea.setSelectionRange(start, start + newText.length);
}
////////// NoteSelection for MidiHandler
let currNoteTime = -1;
let currStartNoteTime = -1;
let currEndNoteTime = -1;
function handleNoteSelection(abcElem, visualObj) {
    let startNoteTime = document.querySelector("#startNoteTime");
    let endNoteTime = document.querySelector("#endNoteTime");
    let currentMs = Array.isArray(abcElem.currentTrackMilliseconds) ? abcElem.currentTrackMilliseconds[0] : abcElem.currentTrackMilliseconds;
    currNoteTime = currentMs;
    if (startNoteTime.value == "-1") {
        startNoteTime.value = currentMs; // first set start
    }
    else if (startNoteTime.value != "-1" && endNoteTime.value == "-1") {
        if (currentMs > startNoteTime.value) // set endNote
            endNoteTime.value = currentMs;
        else if (currentMs < startNoteTime.value) { // change endNote and startNote
            endNoteTime.value = startNoteTime.value;
            startNoteTime.value = currentMs;
        }
        else if (currentMs == startNoteTime.value) { // from start till END
            let initSelection = midiHandler.initSelection(parseFloat(startNoteTime.value), -1);
            endNoteTime.value = initSelection.end.timeStep.time + '';
            unselectNotes(visualObj, startNoteTime.value, endNoteTime.value);
            return;
        }
    }
    else if (startNoteTime.value != "-1" && endNoteTime.value != "-1") {
        startNoteTime.value = currentMs;
        endNoteTime.value = "-1"; // reset end
    }
    currStartNoteTime = parseFloat(startNoteTime.value);
    currEndNoteTime = parseFloat(endNoteTime.value);
    if (currStartNoteTime != -1 && currEndNoteTime != -1) { // both are set
        midiHandler.initSelection(currStartNoteTime, currEndNoteTime);
        unselectNotes(visualObj, currStartNoteTime, currEndNoteTime);
        removeClassFromPaper(paperElemId, highlightClassName);
    }
    else {
        midiHandler.initSelection(-1, -1); //from the START till the END //midiHandler.initSteps(abcjsHelper.getVisualObj());
        // unset UnselectedNotes Class
        removeClassFromPaper(paperElemId, UnselectedNotesCls);
        removeClassFromPaper(paperElemId, highlightClassName);
    }
}
// set UnselectedNotes Class
function unselectNotes(visualObj, startNoteTime, endNoteTime) {
    visualObj.makeVoicesArray().forEach(arr => {
        arr.forEach(obj => {
            if (obj.elem.type == "note") {
                let noteCurrentMs = Array.isArray(obj.elem.abcelem.currentTrackMilliseconds) ? obj.elem.abcelem.currentTrackMilliseconds[0] : obj.elem.abcelem.currentTrackMilliseconds;
                if (noteCurrentMs < startNoteTime || noteCurrentMs > endNoteTime)
                    obj.elem.elemset[0].classList.add(UnselectedNotesCls);
            }
        });
    });
}
////////// NoteSelection
/** Прокрутка нот */
// global
let autoScroll = true, // отключать авто-прокрутку
scrollTopThreshold, scrollBotThreshold;
function scrollScore(ev) {
    if (!autoScroll)
        return;
    let svgElem = ev.elements[0][0];
    if (svgElem)
        scrollForElementRect(svgElem);
}
function scrollForElementRect(element) {
    if (!autoScroll)
        return;
    let bcRect = element.getBoundingClientRect();
    scrollForBottom(bcRect.bottom);
    scrollForTop(bcRect.top);
}
function scrollForTop(top) {
    if (!autoScroll)
        return;
    let st = scrollTopThreshold;
    if (top < st) {
        let scrlLen = top - st;
        window.scrollBy({ top: scrlLen, left: 0, behavior: 'smooth' });
    }
}
function scrollForBottom(bottom) {
    if (!autoScroll)
        return;
    let sb = scrollBotThreshold;
    if (bottom > document.documentElement.clientHeight - sb) {
        let scrlLen = bottom - document.documentElement.clientHeight + sb;
        window.scrollBy({ top: scrlLen, left: 0, behavior: 'smooth' });
    }
}
function buildSynthControllerAudioParams() {
    let drumStr = (utils.elemType('metronomeText', HTMLInputElement).value || '').trim(), metronome = drumStr.length > 4 && (utils.elemType('metronomeUse', HTMLInputElement).checked || utils.elemType('metronomeOnlyUse', HTMLInputElement).checked) ? drumStr : '', onlyMetronome = utils.elemType('metronomeOnlyUse', HTMLInputElement).checked, extraMeasure = false //elem('extraMeasure').checked
    ;
    return {
        drum: metronome, drumBars: 1, drumIntro: extraMeasure ? 1 : 0,
        chordsOff: onlyMetronome, voicesOff: onlyMetronome
    };
}
function showStatus(str, dur) {
    dur = dur || 4000;
    let el = document.getElementById('statusPanel');
    el.innerHTML = str;
    setTimeout((function (_el, _str) {
        return () => { _el.innerHTML == _str ? _el.innerHTML = '' : 0; };
    }(el, str)), dur);
}
(() => {
    console.info('diffUtilsTest: Tests started...');
    console.time('diffUtilsTest');
    const wordDiff = new window['Diff']();
    let diff1 = wordDiff.diff('93331118889', '00033390888111000');
    //console.log('diff1', diff1);
    let minDiff1 = diffUtils.wordDiffToMin(diff1);
    //console.log('minDiff1', minDiff1);
    let redo = diffUtils.redo('93331118889', minDiff1);
    console.assert(redo == '00033390888111000', redo + '==00033390888111000');
    let undo = diffUtils.undo('00033390888111000', minDiff1);
    console.assert(undo == '93331118889', undo + '==93331118889');
    let str1 = 'Съешь же ещё этих мягких французских булок, да выпей чаю\n', bigStr1 = str1.repeat(50);
    let diff2 = wordDiff.diff(bigStr1 + str1 + bigStr1, bigStr1 + str1.replace('мягких', 'жестких') + bigStr1);
    let minDiff2 = diffUtils.wordDiffToMin(diff2);
    //console.log(minDiff2);
    console.assert(minDiff2.length == 2, minDiff2.length + '==' + 2);
    console.assert(minDiff2[0].p == minDiff2[1].p, minDiff2[0].p + '==' + minDiff2[1].p);
    console.assert(minDiff2[0].a == DiffAction.removed, minDiff2[0].a + '==' + DiffAction.removed);
    console.assert(minDiff2[0].v == 'мяг', minDiff2[0].v + '==' + 'мяг');
    console.assert(minDiff2[1].a == DiffAction.added, minDiff2[1].a + '==' + DiffAction.added);
    console.assert(minDiff2[1].v == 'жест', minDiff2[1].v + '==' + 'жест');
    let bigStr11 = bigStr1 + str1 + bigStr1, bigStr22 = str1.repeat(30) + str1.replace('мягких', 'жестких') + bigStr1, diff3 = wordDiff.diff(bigStr11, bigStr22);
    let minDiff3 = diffUtils.wordDiffToMin(diff3);
    console.log(minDiff3);
    console.assert(minDiff3.length == 5, minDiff3.length + '==' + 5);
    let redo2 = diffUtils.redo(bigStr11, minDiff3);
    console.assert(redo2 == bigStr22);
    let undo2 = diffUtils.undo(bigStr22, minDiff3);
    console.assert(undo2 == bigStr11);
    console.timeEnd('diffUtilsTest');
})();
(() => {
    let testName = 'utilsTest';
    console.info(testName + ': Tests started...');
    console.time(testName);
    let hn = new utils.HashNavigator(true);
    hn.push(0);
    hn.push(1);
    hn.push(2);
    hn.push(3);
    hn.push(4);
    hn.push(5);
    console.assert(hn.index == 5, 'hn.index==5');
    console.assert(hn.array.length == 6, 'hn.array.length==6');
    hn.previous();
    hn.previous();
    console.assert(hn.index == 3, 'hn.index==3');
    hn.push(44);
    console.assert(hn.index == 4, 'hn.index==4');
    console.assert(hn.array.length == 5, 'hn.array.length==5');
    console.timeEnd(testName);
})();
