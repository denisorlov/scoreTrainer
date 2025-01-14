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
                scrollScore(ev);
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
    let mf = renderObj.getMeterFraction();
    utils.elemType('metronomeText', HTMLInputElement).value = drumBeats[mf.num+'/'+mf.den] || '';
}
function prepareVoicesCheckControl(visualObj:IVisualObj){
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
    });
    utils.elem('fixedDivBottom').style.display = 'none';
    resetIndicator();
    setChanged(false);
}

function buildSheetMusicEditor(){
    let renderObj:IVisualObj = ABCJS.renderAbc("*", getAbcText())[0];
    prepareMetronomeText(renderObj);
    prepareVoicesCheckControl(renderObj);
    checkAbcjsHelper();setAbcjsHelper();

    abcjsHelper.renderEditor(paperElemId,audioElemId,abcTextElemId, {warnings_id:'warnings'});
    midiHandler.initSteps(abcjsHelper.getVisualObj());
    //utils.elem('fixedDivBottom').style.display = 'block';
    resetIndicator();
    setChanged(false);
}

function setChanged(_changed: boolean){
    changed = _changed;
    let changeInfo = elem('changeInfo'),
        buildPlayerButton = elem('buildPlayerButton');
    changeInfo.style.color = _changed ? 'red' : 'green';
    changeInfo.title = _changed ? langUtils.mess('paramsChangedToApply', [buildPlayerButton.title]) : langUtils.mess('paramsNotChanged');
    if(_changed) showStatus(changeInfo.title);
    return _changed;
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
////////// NoteSelection

/** Прокрутка нот */
// global
let autoScroll = true, // отключать авто-прокрутку
    scrollTopThreshold, scrollBotThreshold;
function scrollScore(ev: CursorEvent){
    if(!autoScroll) return;
    let svgElem = ev.elements[0][0] as SVGElement;
    if(svgElem) scrollForElementRect(svgElem);
}
function scrollForElementRect(element: Element){
    if(!autoScroll) return;
    let bcRect = element.getBoundingClientRect();
    scrollForBottom(bcRect.bottom);
    scrollForTop(bcRect.top);
}
function scrollForTop(top: number){
    if(!autoScroll) return;
    let st  = scrollTopThreshold;

    if(top<st){
        let scrlLen = top-st;
        window.scrollBy({ top: scrlLen, left: 0, behavior: 'smooth' })
    }
}
function scrollForBottom(bottom: number){
    if(!autoScroll) return;
    let sb  = scrollBotThreshold;

    if(bottom>document.documentElement.clientHeight-sb){
        let scrlLen = bottom-document.documentElement.clientHeight+sb;
        window.scrollBy({ top: scrlLen, left: 0, behavior: 'smooth' });
    }
}

function buildSynthControllerAudioParams(): ISynthControllerAudioParams{
    let drumStr  = (utils.elemType('metronomeText', HTMLInputElement).value || '').trim(),
        metronome = drumStr.length>4 && (utils.elemType('metronomeUse', HTMLInputElement).checked || utils.elemType('metronomeOnlyUse', HTMLInputElement).checked) ? drumStr : '',
        onlyMetronome = utils.elemType('metronomeOnlyUse', HTMLInputElement).checked,
        extraMeasure = false //elem('extraMeasure').checked
    ;

    return {
        drum: metronome, drumBars: 1, drumIntro: extraMeasure ? 1 : 0,
        chordsOff: onlyMetronome, voicesOff: onlyMetronome
    }
}

function showStatus(str, dur?:number){
    dur = dur || 4000;
    let el = document.getElementById('statusPanel')!;
    el.innerHTML = str;
    setTimeout( (function(_el, _str){
        return ()=>{ _el.innerHTML ==_str ? _el.innerHTML = '': 0;}
    }(el, str)), dur);
}

