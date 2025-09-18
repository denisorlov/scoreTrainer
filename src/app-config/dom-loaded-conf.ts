document.addEventListener('DOMContentLoaded', (event): void => {
    ABCJS = window['ABCJS'];
    noteView = new PlayedNoteView(ABCJS,'viewPaper', HighlightWrongCls);
    noteView.delNote(60);// empty
    undoBuffer1 = getAbcText();

    initElems(elems)
    utils.setDraggable(utils.elem('noteOnView'));

    setButtons();

    utils.addListener('change', '#abcText', (ev)=>{
        let diff: WordDiff[] = wordDiff.diff(undoBuffer1, (ev.currentTarget as HTMLTextAreaElement).value);
        if(diffUtils.isDiff(diff)){ // если есть изменения
            editHash.push(diffUtils.wordDiffToMin(diff));// положили разницу в буфер
            console.info('editHash.array.length=', editHash.array.length);
            undoBuffer1 = (ev.currentTarget as HTMLTextAreaElement).value;
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
    // on change settingPanel children
    for (let el of utils.elem('settingPanel').children) {
        if(['INPUT', 'SELECT'].indexOf(el.tagName) >= 0)
            utils.addListener("change", "#"+el.id, ()=>{
                buildSheetMusicEditor();
            });
    }

    // tempo
    setTempoButtons();
    // set Scroll Lines
    setScrollLines();
    //
    createEditorButtons();
    //
    initReplaceFromList();

    //setKeydown();
    // midiHandler + WrongNotes Indicator
    setWrongNotesIndicator();
    // language titles
    langUtils.initSelect(utils.elemType('selectLang', HTMLSelectElement))
}); // DOMContentLoaded

function setButtons(){
    utils.addListener("click", "#buildEditorButton", ()=>{
        utils.toggle('#fixedDivBottom');//buildSheetMusicEditor();
    });
    // play
    // utils.addListener("click", "#playButton", ()=>{
    //     checkAbcjsHelper(); abcjsHelper.play();
    // });
}

function setSelectAbcText(){
    //abcLibUtils.initSelect
    abcLibUtils.initGroupSelect(utils.elemType('selectAbc', HTMLSelectElement), (ev)=>{
        let value = (ev.target as HTMLSelectElement).value;
        if(!value) return;
        (ev.target as HTMLSelectElement).title = value;
        fetch('./src/abclib/'+value)
            .then(response => {
                // Проверяем, успешно ли выполнен запрос (статус в диапазоне 200–299)
                if (!response.ok) {
                    // Если запрос не успешен, генерируем ошибку с соответствующим статусом
                    throw new Error(`HTTP error: status: ${response.status} statusText: ${response.statusText}`);
                }
                return response.text();
            })
            .then(abcText =>{
                setAbcText(abcText);
                undoBuffer1 = getAbcText();
                editHash.resetArray();editHash.push([]); handleUndoRedoButtons();
                buildSheetMusicEditor();//buildSheetMusicPlayer();
            })
            .catch(error => {
                // Обрабатываем ошибки, возникшие при выполнении запроса
                showStatus('Fetch error:'+ error);
            });
    }, utils.elemType('selectGroupAbc', HTMLSelectElement));
}

function handleUndoRedoButtons(){
    elemType('undoButton', HTMLButtonElement).disabled = !editHash.hasPrevious();
    elemType('redoButton', HTMLButtonElement).disabled = !editHash.hasNext();
}

function setTempoButtons(){
    elem('tempoWarp').innerHTML = tempoWarp+'%';
    elemType('fasterButton', HTMLButtonElement).disabled = true;
    utils.addListener("click", "#slowerButton", ()=>{tempoWarp = Math.max(20, tempoWarp-10);
        treatSlowerFasterButton();
    });
    utils.addListener("click", "#fasterButton", ()=>{tempoWarp = Math.min(100, tempoWarp+10);
        treatSlowerFasterButton();
    });
    utils.addListener("click", "#tempoWarp", ()=>{
        showStatus('Темп '+(tempoWarp==100 ? 'пополам': 'полный'));
        tempoWarp = tempoWarp==100 ? 50: 100;
        treatSlowerFasterButton();
    });
    function treatSlowerFasterButton(){
        elem('tempoWarp').innerHTML = tempoWarp+'%';
        checkAbcjsHelper();
        elemType('slowerButton', HTMLButtonElement).disabled = true;
        elemType('fasterButton', HTMLButtonElement).disabled = true;


        if(abcjsHelper && abcjsHelper.getSynthControl())// @ts-ignore
        abcjsHelper.getSynthControl().setWarp(tempoWarp).then(function () {
            elemType('slowerButton', HTMLButtonElement).disabled = tempoWarp<=20;
            elemType('fasterButton', HTMLButtonElement).disabled = tempoWarp>=100;
        })
    }
}

function setScrollLines(){
    let stEl = utils.elemType('scrollTopThreshold', HTMLInputElement),
        //sbEl = utils.elemType('scrollBotThreshold', HTMLInputElement),
        topLine  = utils.elem('scrollTopThresholdLine')
        //botLine  = utils.elem('scrollBotThresholdLine')
    ;

    utils.addListener("change", "#scrollTopThreshold", (ev)=>{
        scrollTopThreshold = parseInt((ev.currentTarget as HTMLInputElement).value); // global
        topLine.style.top = scrollTopThreshold +'px';
    });
    // utils.addListener("change", "#scrollBotThreshold", (ev)=>{
    //     scrollBotThreshold = document.documentElement.clientHeight - parseInt((ev.currentTarget as HTMLInputElement).value); // global
    //     botLine.style.top = scrollBotThreshold +'px';
    // });
    utils.addListener("change", "#autoScroll", (ev)=>{
        autoScroll = (ev.currentTarget as HTMLInputElement).checked; // global
        //stEl.disabled = !autoScroll;//= sbEl.disabled
        //topLine.style.opacity  = (autoScroll ? 1 : 0.3)+'';//= botLine.style.opacity
    });

    let event = new Event('change');
    stEl.dispatchEvent(event);
    //sbEl.dispatchEvent(event);
}

function createEditorButtons() {
    let htmlElement = utils.elem('noteButtons'),
        abcTextArea = elemType('abcTextArea', HTMLTextAreaElement);
    let map = {'z':'𝄽', '^':'𝄰', '_':'𝄭', '=':'𝄮'};
    ['A,,', 'D,', 'G,', 'C', 'F', 'B', 'e',
        '^','_','=',
        '[', ']', '|', 'z', 'x'
    ].forEach((it, ind)=>{
        let but = document.createElement('input');
        but.type = 'button';
        but.value = map[it] || it;
        but.setAttribute('data-value', it);
        but.addEventListener('click', (ev)=>{
            if (abcTextArea.selectionStart != abcTextArea.selectionStart){
                return;
            }
            utils.insertAtCursor(abcTextArea, (ev.currentTarget as HTMLInputElement).getAttribute('data-value'));
            abcTextArea.dispatchEvent(new Event('change'));
        })
        htmlElement.appendChild(but);
    })
    utils.addListener('click', '#replaceButton', ()=>{
        let replaceFromVal = utils.elemType('replaceFrom', HTMLInputElement).value;
        if(replaceFromVal.length>0){
            abcTextArea.value = abcTextArea.value.replace(new RegExp(replaceFromVal,'g'), utils.elemType('replaceTo', HTMLInputElement).value);
            abcTextArea.dispatchEvent(new Event('change'));
        }
    });

    utils.addListener('click', '#undoButton', ()=>{
        if(editHash.hasPrevious()){
            let undoDiff = editHash.current()!; // get current...
            editHash.previous(); // but move index
            undoRedo((val)=>diffUtils.undo(val, undoDiff) );
        }
    });

    utils.addListener('click', '#redoButton', ()=>{
        if(editHash.hasNext()){
            let redoDiff = editHash.next()!;
            undoRedo((val)=>diffUtils.redo(val, redoDiff) );
        }
    });
    function undoRedo(valueSupplier: Function){
        let selectionEnd = abcTextArea.selectionEnd,
            selectionStart = abcTextArea.selectionStart;
        undoBuffer1 = abcTextArea.value = valueSupplier(abcTextArea.value);
        buildSheetMusicEditor();//abcTextArea.dispatchEvent(new Event('change'));
        abcTextArea.focus();
        abcTextArea.selectionStart = selectionStart;
        abcTextArea.selectionEnd = selectionEnd;
        handleUndoRedoButtons();
    }


    // utils.addListener('click', '#upNote', ()=>{
    //     dragNoteBySelection(abcTextArea, -1);
    //     abcTextArea.focus();
    // });
    utils.addListener('click', '#downloadMidi', ()=>{
        AbcJsUtils.downloadMidi(getAbcText(), utils.elemType('midi-download', HTMLAnchorElement))
    });
    utils.addListener('click', '#saveToFileBut', (e)=>{
        utils.initSaveTextFile(getAbcText(), 'application/octet-stream', 'Author__Name__Lev.txt');
    });

    utils.addListener('wheel', '#mouseWheelNote', (e) =>{
        const delta = Math.sign((e as WheelEvent).deltaY);
        moveNote(delta, e);
    });
    abcTextArea.addEventListener('keydown', (event: KeyboardEvent)=> {
        if ((event.code == 'ArrowUp' || event.code == 'ArrowDown') && (event.ctrlKey || event.metaKey)) {
            moveNote(event.code == 'ArrowUp' ? -1 : 1, event);
        }
    });
    function moveNote(delta: number, event: Event){
        dragNoteBySelection(abcTextArea, delta);
        abcTextArea.focus();
        event.preventDefault(); // !
    }


    abcTextArea.style.fontSize = '1.5em';
    utils.addListener('click', '#fontSmallerButton', ()=>{
        abcTextArea.style.fontSize = parseFloat(abcTextArea.style.fontSize)-0.5+'em';
    });
    utils.addListener('click', '#fontBiggerButton', ()=>{
        abcTextArea.style.fontSize = parseFloat(abcTextArea.style.fontSize)+0.5+'em';
    });
}

function initReplaceFromList(){
    let select = document.getElementById('replaceFromList'),
        options=[
            '\\\$', '!\\\d!', '![^!]+!','{[^} ]+}', '%\\d+\\n', '\\\[Q:[^\\\]]+\\\]'
        ];

    for(let o in options ){
        select!.appendChild( new Option( options[o], options[o],  false, false) );
    }
}

function setKeydown(){
    document.addEventListener('keydown', (event)=>{
        let key = event.code;
        let prev = false;
        switch(key) {
            case 'Space': // backspace
                utils.elem('playButton').click(); prev = true; break;
            case 'ArrowUp': // up narrow
                utils.elem('fasterButton').click(); prev = true; break;
            case 'ArrowDown': // down narrow
                utils.elem('slowerButton').click(); prev = true; break;
        }
        prev === true ? event.preventDefault() : 0;
    });
}

function setWrongNotesIndicator(){
    midiHandler.maxWrongNotes = 4;
    utils.elemType('maxWrongNotes', HTMLMeterElement).value = midiHandler.maxWrongNotes = 4;
    utils.addListener('change', '#maxWrongNotes', (ev)=>{
        midiHandler.maxWrongNotes = (ev.target as HTMLMeterElement).value;
    });
    midiHandler.prizeRightNotes = 5;
    utils.elemType('prizeNotes', HTMLMeterElement).value = 5;
    utils.addListener('change', '#prizeNotes', (ev)=>{
        midiHandler.prizeRightNotes = (ev.target as HTMLMeterElement).value;
    });
    midiHandler.onWrongNotes = (pitch)=>{
        console.warn('Wrong note: '+pitch);
        if(midiHandler.wrongNote>midiHandler.maxWrongNotes){
            resetIndicator();
        }else{
            setIndicator("swmIndicator", midiHandler.wrongNote*100/midiHandler.maxWrongNotes, 'Mistakes:' + midiHandler.wrongNote);
            highlightWrongNote(pitch);
        }
        scrollByMidiHandlerSteps();
    };
    midiHandler.onRightNotes = (pitch)=>{
        console.info('Right note: '+pitch);
        if(midiHandler.wrongNote<1){
            resetIndicator();
        }else{
            setIndicator("swmIndicator", midiHandler.wrongNote*100/midiHandler.maxWrongNotes, 'Mistakes:' + midiHandler.wrongNote);
        }
        scrollByMidiHandlerSteps();
    };
    midiHandler.onNoteOff = (pitch)=>{

    }
    midiHandler.onTimeStepDone = (currIdx)=>{
        console.log('Time Step is done at index '+currIdx);
    };
    midiHandler.onSetToStart = (allDone)=>{
        if(!allDone){
            settingToStart();
        }
    };
    midiHandler.onAllDoneNoteOff = ()=>{
        settingToStart();
    };
    midiHandler.onAllElementNotesDone = (elem: Elem)=>{
        elem.elemset.forEach(element=>{ // красим элемент
            element.classList.add(highlightClassName);
        })
    };
    utils.addListener('click', '#toStartButton', (ev)=>{
        if(!midiHandler.getEndStep()){
            showStatus('Нотный набор не загружен'); return;
        }
        showStatus('Контроль нот выставлен в начало фрагмента');
        midiHandler.setToStart(false);
        resetIndicator();
    })
}
function setIndicator(elemId: string, percent: number, label: string){
    let swmIndicator = document.getElementById(elemId)!;
    swmIndicator.style.width = percent+'%';
    swmIndicator.innerHTML = label;
}
function resetIndicator(){setIndicator("swmIndicator", 0, '&nbsp;')}

function scrollByMidiHandlerSteps(){
    let currentIndex = midiHandler.getCurrentIndex(),
         nextIndex = midiHandler.getNextIndex(),
         index = nextIndex<currentIndex ? nextIndex : currentIndex // to begin or continue
    ;

    scrollToBeatLineTop(midiHandler.getStep(index).measureNumber)
}
function settingToStart(){
    removeClassFromPaper(paperElemId, highlightClassName);
    scrollByMidiHandlerSteps()
    resetIndicator();
}
function highlightWrongNote(pitch:number, durationMs?: number) { //@TODO how to draw Wrong Note dynamically?
    let note = (pitchNames[pitch]as pitchName),
        noteName = note.note.length>1 && AbcJsUtils.currentIsFlat() ? note.note[1] : note.note[0] // midiPitches в зависимости от ключа
    ;
    showStatus('<span style="color: orange;font-weight: bold">Ошибка: '+noteName+' (окт: '+note.oct+')</span>');
    //-------------------
    let min = 1000, elemForHighlightWrongCls: Elem|null = null,
        step: TimeStep = midiHandler.getStep(midiHandler.getCurrentIndex());
    step.elems.forEach(elem=>{
        elem.abcelem.midiPitches.forEach(mp=>{
            let newMin = Math.abs(mp.pitch-pitch);// ищем ближайший набор фальшивой ноте
            if(newMin<min){
                min = newMin;
                elemForHighlightWrongCls = elem;
            }
        })
    })
    if(elemForHighlightWrongCls!=null)
        (elemForHighlightWrongCls as Elem).elemset.forEach(element=>{ // красим элемент
            element.classList.add(HighlightWrongCls);
        })
    setTimeout( ()=>{removeClassFromPaper(paperElemId, HighlightWrongCls)}, durationMs || 1000);
}
//////// played notes
class PlayedNote {
    constructor(public pitch: number, public abc: string, public right: boolean) {}
}
class PlayedNoteView {
    private readonly _ABCJS: any;
    private readonly _paperElemId: string;
    private readonly _highlightWrongClass: string;
    private playedNotes= {};
    private _abcOptions: IAbcOptions = { scale: 2.0, staffwidth: 150};

    constructor(ABCJS: any, paperElemId: string, highlightWrongClass: string) {
        this._ABCJS = ABCJS;
        this._paperElemId = paperElemId;
        this._highlightWrongClass = highlightWrongClass;
    }

    addNote(pitch:number, right: boolean){
        let pn = (pitchNames[pitch] as pitchName),
            abcNote = pn.note.length>1 && AbcJsUtils.currentIsFlat() ? pn.abc[1] : pn.abc[0] // midiPitches в зависимости от ключа
        ;
        this.playedNotes[pitch] = new PlayedNote(pitch, abcNote, right);
        this.renderPlayedNote();
    }
    delNote(pitch){
        delete this.playedNotes[pitch];
        this.renderPlayedNote();
    }
    clear(){
        this.playedNotes = {}; this.renderPlayedNote();
    }
    renderPlayedNote(){
        let trebleV = 1,
            bassV = 10,
            trebleScore = '', bassScore = '',
            trebleVoices = '', bassVoices = '',
            wrongs: string[] = []
        ;
        for(let pitch in this.playedNotes){
            let playedNote: PlayedNote = this.playedNotes[pitch];
            if(!playedNote.right) wrongs.push(playedNote.abc);
            if(playedNote.pitch>=60){
                trebleScore+=trebleV+' ';
                trebleVoices+='\r\n'+'V:'+trebleV+'\r\n'+playedNote.abc;
                trebleV++
            }else{
                bassScore+=bassV+' ';
                bassVoices+='\r\n'+'V:'+bassV+'\r\n'+playedNote.abc;
                bassV++
            }
        }
        let abcStr =  'X:1\n' +
            '%%score { ('
            +(trebleV==1 ? trebleV : trebleScore)+
            ') | ('
            +(bassV==10 ? bassV : bassScore)+
            ') }\n' +
            'L:1\n' +
            'V:1 treble\n' +
            'V:10 bass'+
            (trebleV==1 ? '\r\n'+'V:'+trebleV+'\r\n'+'x' :trebleVoices)+
            (bassV==10 ? '\r\n'+'V:'+bassV+'\r\n'+'x' :bassVoices)
        ;
        //console.log(abcStr);
        this._ABCJS.renderAbc(this._paperElemId, abcStr, this._abcOptions);//{ scale: 2.0, staffWidth: 180}
        if(wrongs.length>0){
            let paths = document.querySelectorAll('#'+this._paperElemId+' path');
            for (let k = 0; k < paths.length; k++){
                let dataName = (paths[k] as HTMLElement).getAttribute('data-name') || '';
                if(wrongs.indexOf(dataName) >= 0){
                    (paths[k] as HTMLElement).classList.add(this._highlightWrongClass);
                }
            }
        }
    }

    set abcOptions(value: IAbcOptions) {
        this._abcOptions = value;
    }

    get abcOptions(): IAbcOptions {
        return this._abcOptions;
    }
}
//////// played notes
function initElems(elems) {
    elems.changeInfo = utils.elem('changeInfo');
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



