class AbcjsHelper {
    private ABCJS: any;
    private audioContext: AudioContext;
    //@ts-ignore
    private _synthControl: ISynthController;
    private _mode: HelperMode | undefined; // editor|synth

    private _abcOptions: IAbcOptions | undefined;
    private _synthControlVisualOptions: ISynthControllerVisualOptions = {displayLoop: true, displayRestart: true, displayPlay: true, displayProgress: true, displayWarp: true};
    private _synthControllerAudioParams: ISynthControllerAudioParams = {};
    private _cursorOptions: ICursorOptions | undefined;

    private _synth: any;
    /** Комплексный элемент, включает в себя собственный synth+synthControl */
    private _editor: any;
    private _cursorControl: any;

    constructor(ABCJS: any, audioContext: AudioContext) {
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
    renderSheetMusic(paperElemId: string, abcStr: string,
                     renderAbcCallBack?:(vo: IVisualObj)=>void): IVisualObj {
        let visualObj = this.ABCJS.renderAbc(paperElemId, abcStr, this._abcOptions)[0] as IVisualObj;
        visualObj.setUpAudio();// без этого не будет информации о нотах
        if(renderAbcCallBack)
            renderAbcCallBack(visualObj);
        return visualObj;
    }

    renderEditor(paperElemId: string, audioElemId: string, editArea: string | HTMLTextAreaElement, editorParams: IEditorParams): void{
        this.destroySynthControl();
        this._cursorControl = this._cursorControl || new CursorControl(paperElemId, this._cursorOptions);
        editorParams = editorParams || {};
        editorParams.paper_id = paperElemId;
        editorParams.synth = {
            el: "#"+audioElemId,
            cursorControl: this._cursorControl,
            options: this._synthControlVisualOptions
        }
        editorParams.abcjsParams = this._abcOptions
        this._editor = new ABCJS.Editor(editArea, editorParams);
        this._editor.synth.synthControl.visualObj.setUpAudio();
        this._mode = HelperMode.editor;
    }

    createSynth(paperElemId: string, audioElemId: string, visualObj: IVisualObj, callBack?: ()=>void):void{
        if (!this.ABCJS.synth.supportsAudio()) {
            document.querySelector('#'+audioElemId)!.innerHTML = "<div class='audio-error'>Audio is not supported in this browser.</div>";
            return;
        }

        this._cursorControl = this._cursorControl || new CursorControl(paperElemId, this._cursorOptions);
        if(!this._synthControl){
            this.destroySynthControl();
            this._synthControl = new this.ABCJS.synth.SynthController();
            this._synthControl.load?.('#'+audioElemId, this._cursorControl,
                this._synthControlVisualOptions);
        }

        let helper = this;
        //let audioParams = this._synthControllerAudioParams as ISynthControllerAudioParams;
        this._synth = new this.ABCJS.synth.CreateSynth();

        helper._synth.init({ // https://paulrosen.github.io/abcjs/audio/synthesized-sound.html#init-synthoptions
            audioContext: this.audioContext,
            visualObj: visualObj,
            options: {
                onEnded: (callbackContext)=>{},
            }
        }).then(function (response) {
            //console.log(response);
            helper._synthControl.disable?.(true);// before setTune
            helper._synthControl.setTune?.(visualObj, true, helper._synthControllerAudioParams).
            then(function (response) {
                //
            }).catch(function (error) {
                console.warn("Audio problem:", error);
            });

           helper._synth.prime().then(function (response) {
                if(callBack) callBack();
            });
        }).catch(function (error) {
            console.warn("Audio problem:", error);
        });
        this._mode = HelperMode.synth;
    }

    get cursorControl(): any {
        return this._cursorControl;
    }

    isEditor(){return this._mode === HelperMode.editor};

    get editor(): any {
        return this._editor;
    }

    getSynth(): any {
        return this.isEditor() ? this._editor.synth : this._synth;
    }

    getVisualObj(): IVisualObj{
        return this.getSynthControl().visualObj as IVisualObj;
    }

    getSynthControl(): ISynthController {
        return this.isEditor() ? this._editor.synth.synthControl : this._synthControl;
    }

    seekSeconds(noteTimeMs: number){
        let synthControl = this.getSynthControl();
        if(synthControl) { // @ts-ignore
            let koeff  = synthControl.warp/100;
            // @ts-ignore // https://paulrosen.github.io/abcjs/audio/synthesized-sound.html#seek-percent-units
            synthControl.seek((noteTimeMs/1000/koeff).toFixed(3), 'seconds');
        }
    }

    _delegateSynthControl(functionName: string, arg?: any){
        if(this.getSynthControl()) { // @ts-ignore
            this.getSynthControl()[functionName](arg);
        }
    }

    play(): void{
        this._delegateSynthControl('play');
    }

    restart(): void{
        this._delegateSynthControl('restart');
    }

    // setWarp(warp: number): void{
    //     this._delegateSynthControl('setWarp', warp);
    // }

    /** текущий synthControl следует переиспользовать если возможно, иначе - уничтожить */
    destroySynthControl(): void {
        // if(this.getSynthControl()) { // @ts-ignore
        //     this.getSynthControl().destroy();
        // }
        this._delegateSynthControl('destroy');
    }


    set abcOptions(value: IAbcOptions | undefined) {
        this._abcOptions = value;
    }

    set synthControlVisualOptions(value: ISynthControllerVisualOptions) {
        this._synthControlVisualOptions = value;
    }

    set synthControllerAudioParams(value: ISynthControllerAudioParams) {
        this._synthControllerAudioParams = value;
    }

    set cursorOptions(value: ICursorOptions | undefined) {
        this._cursorOptions = value;
    }
}

// https://paulrosen.github.io/abcjs/audio/synthesized-sound.html#cursorcontrol-object
function CursorControl(paperElemId: string, _cursorOptions?: ICursorOptions) {
    //@ts-ignore
    let self = this;
    let options = _cursorOptions || {};
    self.beatSubdivisions = options.beatSubdivisions || 1;

    self.onReady = function() {
        if(options.onReady) options.onReady.call(self);
    };
    self.onStart = function() {
        if(options.cursor){
            let svg = document.querySelector("#"+paperElemId+" svg")!;
            let cursor = document.createElementNS("http://www.w3.org/2000/svg", "line");
            cursor.setAttribute("class", "abcjs-cursor");
            cursor.setAttributeNS(null, 'x1', '0');
            cursor.setAttributeNS(null, 'y1', '0');
            cursor.setAttributeNS(null, 'x2', '0');
            cursor.setAttributeNS(null, 'y2', '0');
            svg.appendChild(cursor);
        }
        if(options.onStart) options.onStart.call(self);
    };
    self.onBeat = function(beatNumber, totalBeats, totalTime) {
        if(options.onBeat) options.onBeat.call(self, beatNumber, totalBeats, totalTime);
    };
    self.onEvent = function(ev) {
        if (ev.measureStart && ev.left === null)
            return; // this was the second part of a tie across a measure line. Just ignore it.

        removeClassFromPaper(paperElemId, "highlight");

        for (var i = 0; i < ev.elements.length; i++ ) {
            var note = ev.elements[i];
            for (var j = 0; j < note.length; j++) {
                note[j].classList.add("highlight");
            }
        }

        var cursor = document.querySelector("#"+paperElemId+" svg .abcjs-cursor");
        if (cursor) {
            cursor.setAttribute("x1", ev.left - 2+'');
            cursor.setAttribute("x2", ev.left - 2+'');
            cursor.setAttribute("y1", ev.top);
            cursor.setAttribute("y2", ev.top + ev.height);
        }

        if(options.onEvent) options.onEvent.call(self, ev);
    };
    self.onLineEnd = function(data){
        if(options.onLineEnd) options.onLineEnd.call(self, data);
        // if(data.measureNumber>0)
        //     window.scrollBy({ top: parseInt(data.top)-currTop, left: 0, behavior: 'smooth' })
        // currTop = parseInt(data.top);
    };
    self.onFinished = function() {
        // var els = document.querySelectorAll("svg .highlight");
        // for (var i = 0; i < els.length; i++ ) {
        //     els[i].classList.remove("highlight");
        // }
        removeClassFromPaper(paperElemId, "highlight");

        var cursor = document.querySelector("#"+paperElemId+" svg .abcjs-cursor");
        if (cursor) {
            cursor.setAttribute("x1", '0');
            cursor.setAttribute("x2", '0');
            cursor.setAttribute("y1", '0');
            cursor.setAttribute("y2", '0');
        }
        if(options.onFinished) options.onFinished.call(self);
    };
}

function removeClassFromPaper (paperElemId: string, cls: string){
    let lastSelection = document.querySelectorAll("#"+paperElemId+" svg ."+cls);
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
    moveNote: function(note, step) {
        step = step>0 ? Math.min(step, 15) : Math.max(step, -15) ;
        let x = allPitches.indexOf(note);
        if (x >= 0)
            return allPitches[x-step] || note;
        return note;
    },
    tokenize: function(str) {
        let arr = str.split(/(!.+?!|".+?")/);
        let output: any[] = [];
        for (let i = 0; i < arr.length; i++) {
            let token = arr[i];
            if (token.length > 0) {
                if (token[0] !== '"' && token[0] !== '!') {
                    var arr2 = arr[i].split(/([A-Ga-g][,']*)/);
                    output = output.concat(arr2);
                } else
                    output.push(token);
            }
        }
        return output;
    },
    // https://paulrosen.github.io/abcjs/examples/dragging.html
    calcNewNoteText: function (abcElem: Abcelem, drag, abcString: string):string {
        if (abcElem.pitches && drag && drag.step && abcElem.startChar >= 0 && abcElem.endChar >= 0) {
            return AbcJsUtils.calcNewNote(abcString.substring(abcElem.startChar, abcElem.endChar), drag.step);
        }
        return '';
    },
    calcNewNote: function (originalText: string, step: number):string {
        let arr = AbcJsUtils.tokenize(originalText);
        // arr now contains elements that are either a chord, a decoration, a note name, or anything else. It can be put back to its original string with .join("").
        for (let i = 0; i < arr.length; i++) {
            arr[i] = AbcJsUtils.moveNote(arr[i], step);
        }
        return arr.join("");
    },
    checkNote(text: string){
        let arr = AbcJsUtils.tokenize(text);
        for (let i = 0; i < arr.length; i++) {
            if(allPitches.indexOf(arr[i])>-1) return true;
        }
        return false;
    },

    downloadMidi(abc:string, a: HTMLAnchorElement) {
        a.setAttribute("href", ABCJS.synth.getMidiFile(abc, { midiOutputType: "encoded" }));
        a.click();
    }
}

// for AbcjsEditor
// function selectionChangeCallback(start, end) {
//     if (abcjsHelper.editor) {
//         var el = abcjsHelper.editor.tunes[0].getElementFromChar(start);
//         console.log(el);
//     }
// }


enum HelperMode {
    editor = 'editor',
    synth = 'synth'
}

interface ISynthController extends Partial<SynthControllerStrict> {}
interface SynthControllerStrict {
    load(t,r,i),
    onWarp(t),
    options: any, //{drum: '', drumBars: 1, drumIntro: 0, chordsOff: false, onEnded: ƒ, …}
    pause(),
    percent: number
    play(),
    restart(),
    seek(t,r),
    setProgress(t,r),
    disable(b: boolean),
    setTune(t,r,n),
    setWarp(t),
    toggleLoop(),
    destroy(),
    visualObj: IVisualObj
    warp: number
    isStarted: boolean
}

interface IVisualObj {
    setUpAudio():void
    getBpm():number
    getMeterFraction(): {num: number, den: number}
    millisecondsPerMeasure():number
    makeVoicesArray()
}

interface IAbcOptions extends Partial<abcOptionsStrict> {}
interface abcOptionsStrict {
    // If the number passed is between zero and one, then the music is printed smaller, if above one, then it is printed bigger
    scale: number,
    add_classes: boolean,
    clickListener(abcElem, tuneNumber, classes, analysis, drag, mouseEvent): void,
    responsive: string, // "resize"
    staffwidth: number,
    paddingleft: number,
    paddingright: number,
    wrap: abcOptionsWrap,
    selectionColor: string, //"green",
    dragColor: string, //"blue",
    dragging: boolean,
    selectTypes: string[], //['note'],
}

interface abcOptionsWrap {
    minSpacing: number,
    maxSpacing: number,
    lastLineLimit: boolean,
    preferredMeasuresPerLine: number
}

interface ISynthControllerVisualOptions extends Partial<SynthControllerVisualOptionsStrict> {}
interface SynthControllerVisualOptionsStrict {
    // default	false	Whether to display a button that the user can press to make the tune loop instead of stopping when it gets to the end.
    displayLoop: boolean,
    // default	false	Whether to display a button that the user can press to make the tune go back to the beginning.
    displayRestart: boolean,
    // default	true	Whether to display a button that the user can press to make the tune start playing. (Note: this turns into the "pause" button when the tune is playing.)
    displayPlay: boolean,
    // default	true	Whether to display the progress slider. The user can click anywhere on this to get the music to jump to that location.
    displayProgress: boolean,
    // default	false	Whether to display the tempo and allow the user to change it on the fly.
    displayWarp: boolean
}

interface ICursorOptions extends Partial<CursorOptionsStrict> {}
interface CursorOptionsStrict {
    cursor: boolean,
    beatSubdivisions: number,
    onReady():void,
    onStart();void,
    onBeat(beatNumber: number, totalBeats: number, totalTime: number):void,
    onEvent(ev: CursorEvent): void,
    onLineEnd(data: {bottom: number,measureNumber: number,milliseconds: number, top: number}):void,
    onFinished():void
}
interface CursorEvent {
    //true if this is the beginning of a measure. (Note, beware of the case where the only event at the beginning
    // of a measure is a note tied from a previous note. There might not be anything to do.)
    measureStart: boolean,
    line: number,
    measureNumber: number,
    //The actual SVG elements that represent the note(s) being played.
    elements: any[],
    //The leftmost point of the current elements.
    left: number,
    //The topmost point of the current elements.
    top: number,
    //The height of the current elements.
    height: number,
    //the width of the current elements.
    width: number,
    milliseconds: number,
}

interface IEditorParams extends Partial<EditorParamsStrict> {}
// https://paulrosen.github.io/abcjs/interactive/interactive-editor.html#editor-params
interface EditorParamsStrict {
    // If present, then parser warnings are displayed on the page. The warnings are displayed just above the music.
    generate_warnings:boolean,
    // If present, the HTML id to place the warnings. This supersedes generate_warnings. This can either be an id or the actual HTML element.
    warnings_id: string,
    // If present, the callback function to call whenever there has been a change in the ABC string.
    onchange: ()=>void,
    // If present, the callback function to call whenever there has been a change of selection.
    selectionChangeCallback: (start: number, end: number)=>void,
    // The dirty flag is set if this is true. When the user types in the textarea then the class abc_textarea_dirty is added to the textarea. Also see the isDirty and setNotDirty methods below.
    indicate_changed:boolean,

    //---------- in AbcjsHelper not for manual setting
    // HTML id to draw in. If not present, then the drawing happens just below the editor. This can either be an ID or the actual HTML element.
    paper_id: string,
    // Options to send to abcjs when re-rendering both the visual and the audio.
    abcjsParams:any,
    // If present, add an audio control
    synth:any,
}

interface ISynthControllerAudioParams extends Partial<SynthControllerAudioParamsStrict> {}
// https://paulrosen.github.io/abcjs/audio/synthesized-sound.html#settune-visualobj-useraction-audioparams
interface SynthControllerAudioParamsStrict {
    //default: create it.	An AudioContext object so that they can be reused.
    audioContext: AudioContext,
    //default: null	A function that is called at various times in the creation of the audio.
    debugCallback(),
    //default: use the default	The publicly available URL of the soundfont to use.
    // "https://paulrosen.github.io/midi-js-soundfonts/abcjs/"	Это публичный URL для звукового шрифта.
    // Если его нет, то звуковые шрифты берутся из репозитория github. Его можно заменить, если новый звуковой шрифт соответствует тому же формату.
    // https://github.com/gleitz/MIDI.js/tree/master/examples/soundfont/acoustic_grand_piano-mp3
    soundFontUrl: string,
    //default: 1.0	This is the amount to multiply all the volumes to compensate for different volume soundfonts. If you find that either the volume is too low or the output is clipped, you can experiment with this number.
    soundFontVolumeMultiplier: number,
    //default: calculated	An override of the tempo in the tune.
    millisecondsPerMeasure: number,
    //default: null	The object returned from renderAbc.
    visualObj: IVisualObj,
    //default: null	An alternate audio specification, if visualObj is not present.
    sequence,
    //default: null	A callback function when the AudioBuffer finishes playing.
    onEnded(callbackContext),
    //default: null	A hook to get the instructions that will be passed to the Audio Buffer. This can be used either to debug what audio was generated or to modify the sequence before the audio is created. This can be useful to add "swing" to the beats, or do any other processing that isn't possible in ABC notation.
    sequenceCallback(),
    //default: null	This is passed back with the sequenceCallback. It can be anything you want.
    callbackContext,
    //default: 0	The midi program (aka "instrument") to use, if not specified in ABC string.
    program: number,
    //default: 0	The number of half-steps to transpose everything, if not specified in ABC string.
    midiTranspose: number,
    //default: 0	The "midi channel" to use. This isn't particularly useful except that specifying channel 10 means to use the percussion sounds.
    channel: number,
    //default: null	Whether to add a drum (or metronome) track. A string formatted like the %%MIDI drum specification. Using this parameter also implies %%MIDI drumon See the section for "Drum Parameter" for an explanation.
    drum: string,
    //default: 1	How many bars to spread the drum pattern over. See the section for "Drum Parameter" for an explanation.
    drumBars: number,
    //default: 0	The number of measures of count in beats before the music starts.
    drumIntro: number,
    //default: false	If you want a metronome only for the intro measures but not when the tune starts, use this along with the drumIntro and drum params. This has no effect if either one of those is missing.
    drumOff: boolean,
    //default: null	The tempo to use. This overrides a tempo that is in the tune.
    qpm: number,
    //default: null	The tempo to use, only if there is no tempo in the tune.
    defaultQpm: number,
    //default: false	If true, then don't turn the guitar chord symbols into sound. (But do play the metronome if there is one.)
    chordsOff: boolean,
    //default: false	If true, play the metronome and accompaniment; do the animation callbacks, but don't play any melody lines. This can also be an array of voices to turn off. The voices are numbered starting at zero.
    voicesOff: boolean,
    //default: 0	The number of cents to raise the pitch of the top note of an octave that is played at the same time. That is, in multipart music, if the tenor and soprano parts are an octave apart the soprano note gets lost in the overtones. Making the top note slightly sharp brings it out without making it sound out of tune
    detuneOctave: number,
}

/////////////////// Elem
interface Elem {
    tuneNumber: number
    abcelem: Abcelem
    duration: number
    durationClass: number
    minspacing: number
    x: number
    children: any
    heads: any
    extra: any[]
    extraw: number
    w: number
    right: any
    invisible: boolean
    bottom: number
    top: number
    type: string
    fixed: Fixed2
    specialY: SpecialY2
    elemset: Element[]
    counters: Counters2
    notePositions: NotePosition2[]
}

interface Abcelem {
    pitches: Pitch[]
    duration: number
    el_type: string
    startChar: number
    endChar: number
    averagepitch: number
    minpitch: number
    maxpitch: number
    abselem: Abselem
    currentTrackMilliseconds: number
    currentTrackWholeNotes: number
    midiPitches: MidiPitch[]
}

interface Pitch {
    pitch: number
    name: string
    verticalPos: number
    highestVert: number
}

interface Abselem {
    tuneNumber: number
    abcelem: any
    duration: number
    durationClass: number
    minspacing: number
    x: number
    children: any
    heads: any
    extra: any[]
    extraw: number
    w: number
    right: any
    invisible: boolean
    bottom: number
    top: number
    type: string
    fixed: Fixed
    specialY: SpecialY
    elemset: Elemset[]
    counters: Counters
    notePositions: NotePosition[]
}

interface Fixed {
    w: number
    t: number
    b: number
}

interface SpecialY {
    tempoHeightAbove: number
    partHeightAbove: number
    volumeHeightAbove: number
    dynamicHeightAbove: number
    endingHeightAbove: number
    chordHeightAbove: number
    lyricHeightAbove: number
    lyricHeightBelow: number
    chordHeightBelow: number
    volumeHeightBelow: number
    dynamicHeightBelow: number
}

interface Elemset {}

interface Counters {
    line: number
    measure: number
    measureTotal: number
    voice: number
    note: number
}

interface NotePosition {
    x: number
    y: number
}

interface MidiPitch {
    cmd: string
    pitch: number
    volume: number
    start: number
    duration: number
    instrument: number
    startChar: number
    endChar: number
    gap: number
    _done: boolean
}

interface Fixed2 {
    w: number
    t: number
    b: number
}

interface SpecialY2 {
    tempoHeightAbove: number
    partHeightAbove: number
    volumeHeightAbove: number
    dynamicHeightAbove: number
    endingHeightAbove: number
    chordHeightAbove: number
    lyricHeightAbove: number
    lyricHeightBelow: number
    chordHeightBelow: number
    volumeHeightBelow: number
    dynamicHeightBelow: number
}

// interface Elemset2 {
//     classList: any
// }

interface Counters2 {
    line: number
    measure: number
    measureTotal: number
    voice: number
    note: number
}

interface NotePosition2 {
    x: number
    y: number
}