/**
 * @TODO
 * use scrollNext()/scrollPrev(), AbcJsUtils.paintCurrentKey('lightgreen')
 * сброс счетчика ошибок???
 * сохранение настроек
 * настройки отображения к нотам
 * ограничитель буфера undo redo
 * undo redo lib: https://www.cssscript.com/undo-redo-history/, https://github.com/kpdecker/jsdiff/blob/master/src/diff/base.js, https://stackoverflow.com/a/79310421/2223787
 * индикация МИДИ
 * редактор: инфо по горячи клавишам
 * редактор: кнопка открыть файл...
 * abcjsHelper.getVisualObj().makeVoicesArray()
 * https://github.com/paulrosen/abcjs/releases поверять иногда, сейчас 6.5.1(12.11.25)
 *
 * замены: %\d+\r\n, $,
 * убрать форшлаги {[^} ]+}
 * расставить голоса V и L по голосам
 * убрать %%scale, добавить %%measurenb 0 (?), проверить на дубли T:
 *
 * Чтобы запретить Chrome перехватывать ваши сочетания клавиш для управления мультимедиа, выполните следующие действия:
 * Открыть новую вкладку Chrome по адресу chrome://flags/#hardware-media-key-handling
 * Выбрать «Disabled» в меню в правой части страницы.
 * Перезапустить Chrome при появлении соответствующего запроса.
 */

let ABCJS,
    audioContext: AudioContext,
    abcjsHelper: AbcjsHelper,
    noteView:PlayedNoteView,
    editHash: IHashNavigator<MinDiff[]> = new utils.HashNavigator(true),
    wordDiff = new window['Diff']();

editHash.push([]); //zero element with no previous

////// elems scope
const elems = {};
function elem (id:string){
    return elemType(id, HTMLElement);
}
function elemType(id:string, type: any): typeof type {
    if(!elems[id]) throw new Error('Not found '+type.name+' by id: '+id);
    return  elems[id] as typeof type;
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
    debug:{
        onEvent: false
    }
};
function checkAbcjsHelper(){
    if(!abcjsHelper){ // singleton
        audioContext = new AudioContext();
        abcjsHelper = new AbcjsHelper(ABCJS, audioContext);
    }
}

function setAbcjsHelper(){
    abcjsHelper.abcOptions = getAbcOptions();
    abcjsHelper.synthControllerAudioParams = buildSynthControllerAudioParams()
    abcjsHelper.cursorOptions = {
        onEvent: (ev: CursorEvent)=>{
            if(abcjsHelper.getSynthControl().isStarted){// ev.measureStart &&
                scrollToBeatLineTop(ev.measureNumber, false)
            }

            currNoteTime = ev.milliseconds;// global
            if(currStartNoteTime!=-1 && currEndNoteTime!=-1){
                //@ts-ignore
                let koeff  = abcjsHelper.getSynthControl().warp/100;
                if(Math.floor(ev.milliseconds*koeff) > Math.round(currEndNoteTime)
                    || Math.round(ev.milliseconds*koeff) < Math.floor(currStartNoteTime)
                ){
                    //console.log(ev.milliseconds, startNoteTime.value, endNoteTime.value);
                    abcjsHelper.seekSeconds(currStartNoteTime);
                }
            }
            if(context.debug.onEvent) console.dir(ev);
        }
    }
}

function prepareMetronomeText(renderObj:IVisualObj){
    let mf = renderObj.getMeterFraction(),
        metroText = utils.elemType('metronomeText', HTMLInputElement);
    metroText.value = metroText.value == '' ? drumBeats[mf.num] || '' : metroText.value;
}
function prepareVoicesCheckControl(visualObj:IVisualObj){
    midiHandler.checkVoices=[]; // reset
    let span = utils.elem('voicesCheckControlPanel');
    span.innerHTML = '';
    visualObj.makeVoicesArray().forEach((it, ind, all)=>{
        let label = document.createElement('label');
        label.innerHTML = '<label>'+(ind+1)+'<input class="voicesCheckControlChb" id="voicesCheckChb_'+ind+'" type="checkbox" data-index="'+ind+'"></label>';
        span.appendChild(label);
    })
    document.querySelectorAll('.voicesCheckControlChb').forEach(el=>{
        utils.addListener("change", "#"+el.id, ()=>{
            let chbs = Array.from(document.querySelectorAll('.voicesCheckControlChb')) as  HTMLInputElement[],
                chbsChecked = chbs.filter(el=>el.checked);
            if(chbsChecked.length<chbs.length){
                let checkVoices: number[] =[];
                chbsChecked.forEach(ch=>{
                    checkVoices.push( parseInt(ch.getAttribute("data-index")!))
                })
                midiHandler.checkVoices=checkVoices; //console.log('midiHandler.checkVoices', checkVoices)
            }else{
                midiHandler.checkVoices=[]; //console.log('midiHandler.checkVoices = []')
            }
        });
    })
}

function buildSheetMusicPlayer(){
    let renderObj:IVisualObj = ABCJS.renderAbc("*", getAbcText())[0];
    prepareMetronomeText(renderObj);
    prepareVoicesCheckControl(renderObj);
    checkAbcjsHelper(); setAbcjsHelper();

    let visualObj = abcjsHelper.renderSheetMusic(paperElemId, getAbcText());
    abcjsHelper.createSynth(paperElemId, audioElemId, visualObj, ()=>{
        midiHandler.initSteps(abcjsHelper.getVisualObj());
        initBeatLines(abcjsHelper.getVisualObj());
    });
    utils.elem('fixedDivBottom').style.display = 'none';
    // @ts-ignore
    //abcjsHelper.getSynthControl().restart();
    resetIndicator();
}

function buildSheetMusicEditor(){
    let renderObj:IVisualObj = ABCJS.renderAbc("*", getAbcText())[0];
    prepareMetronomeText(renderObj);
    prepareVoicesCheckControl(renderObj);
    checkAbcjsHelper();setAbcjsHelper();

    abcjsHelper.renderEditor(paperElemId,audioElemId,abcTextElemId, {warnings_id:'warnings'});
    midiHandler.initSteps(abcjsHelper.getVisualObj());
    initBeatLines(abcjsHelper.getVisualObj());
    // @ts-ignore
    //abcjsHelper.getSynthControl().restart();  // preplay
    //utils.elem('fixedDivBottom').style.display = 'block';
    resetIndicator();
    resetCurrStartEndNote();
    showStatus('Sheet Music Rebuild');
}

function getAbcText(){
    return utils.elemType(abcTextElemId, HTMLTextAreaElement).value;
}
function setAbcText(text: string){
    utils.elemType(abcTextElemId, HTMLTextAreaElement).value = text;
}
// https://paulrosen.github.io/abcjs/visual/render-abc-options.html
function getAbcOptions(): IAbcOptions{
    let staffWidth = utils.elemType('staffWidth', HTMLInputElement).value,
        paddingLeft = utils.elemType('paddingLeft', HTMLInputElement).value,
        paddingRight = utils.elemType('paddingRight', HTMLInputElement).value,
        staffScale = utils.elemType('staffScale', HTMLInputElement).value,
        preferredMeasuresPerLine = utils.elemType('preferredMeasuresPerLine', HTMLInputElement).value,
        staffWidthResize = utils.elemType('staffWidthResize', HTMLInputElement).checked;
    return {
        // If the number passed is between zero and one, then the music is printed smaller, if above one, then it is printed bigger
        scale: staffScale,
        add_classes: true,
        clickListener: clickListener,
        // https://paulrosen.github.io/abcjs/examples/dragging.html
        dragging: allowDragging, //selectTypes: [ 'note'], //dragColor: "blue", //selectionColor: "green",
        responsive: staffWidthResize ? "resize": "",
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
    console.dir({
        currentTrackMilliseconds: abcElem.currentTrackMilliseconds,
        currentTrackWholeNotes: abcElem.currentTrackWholeNotes,
        analysis: analysis,
        midiPitches: abcElem.midiPitches,
        gracenotes: abcElem.gracenotes,
        midiGraceNotePitches: abcElem.midiGraceNotePitches
    });
    let clicked = '';

    if(abcElem.midiPitches)
    abcElem.midiPitches.forEach(mp=>{
        let pn = (pitchNames[mp.pitch] as pitchName),
            noteName = pn.note.length>1 && abcjsHelper.currentIsFlat() ? pn.note[1] : pn.note[0] // midiPitches в зависимости от ключа
        ;
        clicked+=noteName+' ('+pn.oct+') ';
    })
    if(clicked.length) showStatus(clicked);

    let lastClicked = abcElem.midiPitches;
    if (!lastClicked) return;

    ABCJS.synth.playEvent(lastClicked, abcElem.midiGraceNotePitches, abcjsHelper?.getSynthControl().visualObj?.millisecondsPerMeasure()).then(function (response) {
    }).catch(function (error) {
        console.log("error playing note", error);
    });

    if(abcjsHelper.isEditor()){
        if(allowDragging)
            dragNoteByAbcElem(abcjsHelper.editor.editarea.textarea, abcElem, drag);
        utils.scrollToSelected(abcjsHelper.editor.editarea.textarea);
    }

    handleNoteSelection(abcElem, abcjsHelper.getVisualObj()); // set globals: currNoteTime, currStartNoteTime, currEndNoteTime

    abcjsHelper.seekSeconds(currStartNoteTime);// seek by click
}


////////// NoteDragging
let allowDragging = false;
function dragNoteByAbcElem(editorTextarea: HTMLTextAreaElement, abcElem: Abcelem, drag){
    let abcString = editorTextarea.value,
        newText = AbcJsUtils.calcNewNoteText(abcElem, drag, abcString);
    if(newText!=''){
        drawDragged(editorTextarea, newText, abcElem.startChar, abcElem.endChar)
    }
}
function dragNoteBySelection(editorTextarea: HTMLTextAreaElement, step: number){
    let abcString = editorTextarea.value, originalText,
        selectionEnd = editorTextarea.selectionEnd,
        selectionStart = editorTextarea.selectionStart;
    if(selectionEnd==selectionStart){
        do{
            selectionStart--;
            originalText = abcString.substring(selectionStart, selectionEnd);
        }while(!/[\s|:]/.test(originalText) // пробел, перенос и т.д. и знаки |,:
            && !AbcJsUtils.checkNote(originalText) && selectionStart>1);
    } else
        originalText = abcString.substring(selectionStart, selectionEnd);
    let newText = AbcJsUtils.calcNewNote(originalText, step);
    if(newText!=''){
        drawDragged(editorTextarea, newText, selectionStart, selectionEnd)
    }
}
let undoBuffer1 = '';
function drawDragged(editorTextarea: HTMLTextAreaElement, newText: string, start: number, end: number){
    let abcString = editorTextarea.value;
    abcString = abcString.substring(0, start) + newText + abcString.substring(end);
    editorTextarea.value = abcString;
    editorTextarea.dispatchEvent(new Event('change'));
    editorTextarea.setSelectionRange(start, start+newText.length);
}
////////// NoteSelection for MidiHandler
let currNoteTime = -1;
let currStartNoteTime = -1;
let currEndNoteTime = -1;
function handleNoteSelection(abcElem: Abcelem, visualObj: IVisualObj){
    let startNoteTime = document.querySelector("#startNoteTime")! as HTMLInputElement;
    let endNoteTime = document.querySelector("#endNoteTime")! as HTMLInputElement;
    let currentMs = Array.isArray(abcElem.currentTrackMilliseconds) ? abcElem.currentTrackMilliseconds[0]:abcElem.currentTrackMilliseconds;
    currNoteTime = currentMs;
    if(startNoteTime.value=="-1"){
        startNoteTime.value = currentMs; // first set start
    } else if(startNoteTime.value!="-1" && endNoteTime.value=="-1") {
        if(currentMs>startNoteTime.value) // set endNote
            endNoteTime.value  = currentMs;
        else if(currentMs<startNoteTime.value){ // change endNote and startNote
            endNoteTime.value  = startNoteTime.value;
            startNoteTime.value = currentMs;
        }else if(currentMs==startNoteTime.value){ // from start till END
            let initSelection = midiHandler.initSelection(parseFloat(startNoteTime.value), -1);
            endNoteTime.value  = initSelection.end.timeStep.time+'';
            unselectNotes(visualObj, startNoteTime.value, endNoteTime.value);
            return;
        }
    } else if(startNoteTime.value!="-1" && endNoteTime.value!="-1"){
        startNoteTime.value = currentMs;
        endNoteTime.value  = "-1"; // reset end
    }

    currStartNoteTime = parseFloat(startNoteTime.value);
    currEndNoteTime = parseFloat(endNoteTime.value);

    if(currStartNoteTime!=-1 && currEndNoteTime!=-1){ // both are set
        midiHandler.initSelection(currStartNoteTime, currEndNoteTime);
        unselectNotes(visualObj, currStartNoteTime, currEndNoteTime);
        removeClassFromPaper(paperElemId, highlightClassName);
    }else{
        midiHandler.initSelection(-1, -1); //from the START till the END //midiHandler.initSteps(abcjsHelper.getVisualObj());
        // unset UnselectedNotes Class
        removeClassFromPaper(paperElemId, UnselectedNotesCls);
        removeClassFromPaper(paperElemId, highlightClassName);
    }
}

// set UnselectedNotes Class
function unselectNotes(visualObj: IVisualObj, startNoteTime, endNoteTime){
    visualObj.makeVoicesArray().forEach(arr=>{
        arr.forEach(obj=>{
            if(obj.elem.type=="note"){
                let noteCurrentMs = Array.isArray(obj.elem.abcelem.currentTrackMilliseconds) ? obj.elem.abcelem.currentTrackMilliseconds[0] :obj.elem.abcelem.currentTrackMilliseconds;
                if(noteCurrentMs < startNoteTime || noteCurrentMs > endNoteTime)
                    obj.elem.elemset[0].classList.add(UnselectedNotesCls);
            }
        })
    });
}
function resetCurrStartEndNote(){
    currNoteTime = -1;
    currStartNoteTime = -1;
    currEndNoteTime = -1;
}
////////// NoteSelection

/** Прокрутка нот */
// global
let autoScroll = true, // отключать авто-прокрутку
    lines: MeasureLine[]=[],
    beatLines = {},// карта тактов и линий с самым высоким элементом для расчета прокрутки see initBeatLines
    scrollTopThreshold, scrollBotThreshold;
interface MeasureLine{
    line: number, firstMeasure: number,
    top_elem:HTMLElement, top:number,
    btm_elem:HTMLElement, btm:number
}
function initBeatLines(visualObj: IVisualObj){
    let _lines={};
    beatLines = {};
    visualObj.makeVoicesArray().forEach(arr=>{
        arr.forEach(obj=>{
            if(!obj.elem.elemset || obj.elem.elemset.length<1) return;
            let bRect = obj.elem.elemset[0].getBoundingClientRect();
            if(bRect.left==0 ) return; // bug
            let line:MeasureLine = _lines[obj.line] = _lines[obj.line] || {line: obj.line, top_elem:null, top:null,
                btm_elem:null, btm:null, firstMeasure: obj.measureNumber};
            if(line.top==null || bRect.top<line.top){
                line.top = parseInt(bRect.top);
                line.top_elem = obj.elem.elemset[0];
            }
            if(line.btm==null || bRect.bottom>line.btm){
                line.btm = parseInt(bRect.bottom);
                line.btm_elem = obj.elem.elemset[0];
            }
            beatLines[obj.measureNumber] = line;
        })
    });

    lines  = [];
    for (let k in _lines) lines.push(_lines[k]);
}
function scrollToBeatLineTop(measureNumber: number, force: boolean){
    if(!autoScroll && !force) return;

    let st  = scrollTopThreshold,
        stb = scrollBotThreshold,
        top = beatLines[measureNumber].top_elem.getBoundingClientRect().top,
        btm = beatLines[measureNumber].btm_elem.getBoundingClientRect().bottom
    ;
    if(force || top<st || (top>st && btm>stb)){
        let scrlLen = top-st;
        window.scrollBy({ top: scrlLen, left: 0, behavior: (Math.abs(scrlLen)<500 ? 'smooth' : 'auto') })
    }
}

function defineCurrentScrollLine(){
    let st  = scrollTopThreshold;
    for(let i=0;i<lines.length;i++){
        let top = lines[i].top_elem.getBoundingClientRect().top;
        if(top>st-10 && top<st+10 ) return lines[i].line;
        if(top>st) return lines[i].line==0 ? -1 : lines[i].line;
    }
    return -1;
}

function scrollNext(){
    let currentLine = defineCurrentScrollLine();
    if(lines[currentLine+1])
        scrollToBeatLineTop(lines[currentLine+1].firstMeasure, true);
}
function scrollPrev(){
    let currentLine = defineCurrentScrollLine();
    if(lines[currentLine-1])
        scrollToBeatLineTop(lines[currentLine-1].firstMeasure, true);
}

function buildSynthControllerAudioParams(): ISynthControllerAudioParams{
    let drumStr  = (utils.elemType('metronomeText', HTMLInputElement).value || '').trim(),
        metronome = drumStr.length>4 && (utils.elemType('metronomeUse', HTMLInputElement).checked || utils.elemType('metronomeOnlyUse', HTMLInputElement).checked) ? drumStr : '',
        onlyMetronome = utils.elemType('metronomeOnlyUse', HTMLInputElement).checked,
        extraMeasure = false //elem('extraMeasure').checked
    ;

    return {
        soundFontUrl: window['app-options'].soundFontUrl, // see app-options.js
        drum: metronome, drumBars: 1, drumIntro: extraMeasure ? 1 : 0,
        chordsOff: true, voicesOff: onlyMetronome
    }
}

/** утилитарная функция - отсечение последнего такта по все голосам, для поиска проблем в abc нотации */
function cutEndMeasure(){
    let abcTextArea = elemType('abcTextArea', HTMLTextAreaElement),
        stringArr = abcTextArea.value.split('\n');
    stringArr.forEach((str, ind, arr)=>{
        let matches = [...str.matchAll(/\|/g)];
        if(matches.length>1){
            arr[ind] = str.substring(0, matches[matches.length-2].index+1);
            console.log(matches.length-2);
        }
    })
    abcTextArea.value = stringArr.join('\n');
    abcTextArea.dispatchEvent(new Event('change'));
}

function showStatus(str, dur?:number){
    dur = dur || 4000;
    let el = document.getElementById('statusPanel')!;
    el.innerHTML = str;
    setTimeout( (function(_el, _str){
        return ()=>{ _el.innerHTML ==_str ? _el.innerHTML = '': 0;}
    }(el, str)), dur);
}


