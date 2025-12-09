//// обработчик входящих midi сообщений
// dependency: abcjs-helper.ts
interface IMidiHandler {
    initSteps(visualObj: IVisualObj):void
    initSelection(startNoteTime: number, endNoteTime: number):void
    noteOn(pitch: number, velocity: number): void
    noteOff(pitch: number): void
}

class AbcMidiHandler implements IMidiHandler{
    startIdx: number = 0;
    endIdx: number = 0;
    currIdx: number = 0;

    private _wrongNote= 0;
    private _rightNote= 0;
    public noteArr: TimeStep[] = [];
    private paperElemId: string;
    /** список голосов, по которым проверяется нота, если пустой - по любым */
    private _checkVoices: number[] = [];

    private _maxWrongNotes = 4;
    private _prizeRightNotes = 5;
    /** карта ошибок такта: номер такта: кол-во ошибок */
    private _measureWrongNote= {};
    private _onWrongNotes = (pitch:number)=>{};
    private _onRightNotes = (pitch:number, idx: number)=>{};
    private _onNoteOff = (pitch:number)=>{};
    /** При выполнении шага */
    private _onTimeStepDone = (stepIdx:number, step:TimeStep)=>{};
    /** При очистке выполнения шага */
    private _onTimeStepDoneReset = (stepIdx:number, step:TimeStep)=>{};
    private _onAllDoneNoteOff = ()=>{};
    /** Все ноты элемента выполнены */
    private _onAllElementNotesDone = (elem: Elem)=>{};
    /**
     * При установке на старт
     * @param allDone флаг выполнения всех нот
     */
    private _onSetToStart = (allDone?: boolean)=>{};


    private _allDone = -1;


    constructor(paperElemId: string) {
        this.paperElemId = paperElemId;
    }

    initSteps(visualObj: IVisualObj):void {
        let preObj = {};
        visualObj.makeVoicesArray().forEach(arr=>{
            arr.forEach(obj=>{
                let elem: Elem = obj.elem;
                if(elem.type=="note" && elem.abcelem.midiPitches.length>0){ // бывают ноты без midiPitches
                    let time = Array.isArray(elem.abcelem.currentTrackMilliseconds) ? elem.abcelem.currentTrackMilliseconds[0]:elem.abcelem.currentTrackMilliseconds;
                    preObj[time] = preObj[time] || {measureNumber: obj.measureNumber, elems:[]};
                    preObj[time].elems.push(elem);
                }
            })
        });
        let resArr: TimeStep[] = [];
        for(let i in preObj){
            resArr.push(new TimeStep(Number(i), preObj[i].elems, preObj[i].measureNumber));
        }
        resArr.sort((a,b)=>{
            return a.time-b.time;
        })
        this.noteArr = resArr;
        this.startIdx = 0;
        this.endIdx = this.noteArr.length-1;
        this._setToStartPrivate();
    }

    /**
     * Define startIdx and endIdx
     * @param startNoteTime if -1 from the START
     * @param endNoteTime if -1 till the END
     */
    initSelection(startNoteTime:number, endNoteTime:number){
        let ok = 0;
        for (let ind = 0; ind < this.noteArr.length; ind++ ) {
            let timeStep = this.noteArr[ind];
            if (startNoteTime > -1) {
                if (timeStep.time == startNoteTime) {
                    this.startIdx = ind;
                    ok += 1
                }
            } else {
                this.startIdx = 0;
                ok += 1; // от начала
            }
            if(ok == 1){// найден старт
                if (endNoteTime > -1) {
                    if (timeStep.time == endNoteTime) {
                        this.endIdx = ind;
                        ok += 2
                    }
                } else {
                    this.endIdx = this.noteArr.length - 1;
                    ok += 2;// до конца
                }
            }
            if (ok > 2) break;
        }
        if(ok<3) throw new Error('Cannot initSelection, error code: '+ok); // 1 - no end, 2 - no start
        this._setToStartPrivate();
        return {
            current: {index: this.currIdx, timeStep: this.noteArr[this.currIdx]},
            start: {index: this.startIdx, timeStep: this.noteArr[this.startIdx]},
            end: {index: this.endIdx, timeStep: this.noteArr[this.endIdx]},
        }
    }

    noteOn(pitch: number, velocity: number){
        if(this.noteArr.length<1) return;
        let currTimeStep: TimeStep = this.getCurrentStep(), measure = this.getMeasure();
        if(!this._checkStep(currTimeStep, pitch)){
            let stop= false, _prevIdx = this.currIdx;
            while(_prevIdx>this.startIdx && !stop){ // это ноты предыдушего шага
                _prevIdx--;
                if(measure > this.getMeasure(_prevIdx)+1){// не далее текущего и пред-го такта
                    stop = true;
                }else
                if(this._checkStep(this.noteArr[_prevIdx], pitch)){
                    this._onRightNotes(pitch, _prevIdx);
                    return; // не считаем за ошибку, музыкант закрепяет пройденное или затакт
                }
            }
            if(this._wrongNote<this._maxWrongNotes)
                this._wrongNote++;
            this._addMeasureWrongNote();
            this._onWrongNotes(pitch);
            return;
        }else{
            this._rightNote++;
            if(this._rightNote>=this._prizeRightNotes){
                this._rightNote = 0;
                if(this._wrongNote>0) this._wrongNote--; // приз за старание
            }
            this._onRightNotes(pitch, this.currIdx); // тут может измениться текущий шаг
        }
        let currIdx = this.getCurrentIndex(); // запоминаем текущий индекс
        currTimeStep = this.getCurrentStep();// перечитываем текущий шаг, он мог быть сдвинут на _onRightNotes
        if(this.checkDone(currTimeStep.elems)){ // если шаг выполнен
            this._onTimeStepDone(this.currIdx, currTimeStep); // тут может измениться текущий индекс/шаг
            // если индекс/шаг не изменился, автоматически переходим к следующему...
            if(currIdx==this.currIdx){
                currIdx++;
                if(this._checkVoices.length>0 && currIdx<=this.endIdx){ // перемещение currIdx по отключенным голосам
                    let intersection = this.getStepVoices(currIdx).filter(value => this._checkVoices.includes(value)); // https://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript
                    while(currIdx<=this.endIdx && intersection.length<1){// пока нет голосов для проверки
                        currIdx++;
                        intersection = this.getStepVoices(currIdx).filter(value => this._checkVoices.includes(value));
                    };
                }
            }else
                currIdx=this.currIdx;
            if(currIdx>this.endIdx){
                this._allDone = pitch;// флаг все сделано
            }else
                this.currIdx=currIdx;
        }
    }

    noteOff(pitch: number): void {
        this._onNoteOff(pitch);
        if(this._allDone==pitch){
            this._onAllDoneNoteOff();
            this._allDone = -1;
        }
    }

    _setToStartPrivate(){
        this._wrongNote = 0;
        this._rightNote = 0;
        this.currIdx = this.startIdx;
        this._resetMeasureWrongNote();
        this.resetAllDone();
    }

    setToStart(allDone?: boolean){
        this._setToStartPrivate();
        this._onSetToStart(allDone);
    }

    getMeasureWrongNote(measure?: number):number{
        measure = measure!=undefined ? measure : this.getMeasure();
        return this._measureWrongNote[measure] = this._measureWrongNote[measure] ? this._measureWrongNote[measure] : 0;
    }
    _addMeasureWrongNote(measure?: number){
        measure = measure!=undefined ? measure : this.getMeasure();
        this._measureWrongNote[measure] = this.getMeasureWrongNote(measure)+1;
    }
    _resetMeasureWrongNote(){
        this._measureWrongNote = {};
    }

    /** Проверка ноты в рамках шага-времени  */
    _checkStep(timeStep: TimeStep, pitch: number){
        let ok = false;
        timeStep.elems.forEach(elem=>{
            if(this._checkVoices.length>0 && this._checkVoices.indexOf(elem.counters.voice)==-1) return;
            let tryPitch = this.tryMidiPitch(pitch, elem);
            if(tryPitch) {
                ok = true;
            }
        })
        return ok;
    }

    /** Проверка ноты в рамках одного элемента шага-времени  */
    tryMidiPitch(pitch: number, elem: Elem):boolean {
        let res: boolean = false;
        let allDone: boolean = true;
        elem.abcelem.midiPitches.forEach(mp=>{
            if(mp.pitch==pitch){
                mp._done=true
                res = true;
            }
            if(!mp._done) allDone = false;
        })
        if(allDone){
            this._onAllElementNotesDone(elem);
        }
        return res;
    }

    /** Проверка выполненых в рамках элементов шага-времени */
    checkDone(elems: Elem[]): boolean{
        let res: boolean = true;
        elems.forEach(elem=>{
            if(this._checkVoices.length>0 && this._checkVoices.indexOf(elem.counters.voice)==-1) return;
            elem.abcelem.midiPitches.forEach(mp=>{
                if(mp._done!=true) {
                    res = false;
                }
            })
        })
        return res;
    }
    /** Сброс всех выполненых */
    resetAllDone(): number{
        let cnt = 0;
        this.noteArr.forEach((timeStep, idx)=>{
            cnt+=this.resetStepDone(idx, timeStep);
        })
        return cnt;
    }

    /** Сброс выполненых в рамках шага-времени  */
    resetStepDone(idx: number, timeStep: TimeStep): number{
        let cnt = 0;
        timeStep.elems.forEach(elem=>{
            elem.abcelem.midiPitches.forEach(mp=>{
                if(mp._done) {
                    mp._done = false;
                    cnt++;
                }
            })
        })
        this._onTimeStepDoneReset(idx, timeStep);
        return cnt;
    }

    /** Сбросить пройденный шаг, перейти на шаг назад, возвращает текущий шаг */
    resetStepBack(){
        // сбрасываем текущий шаг
        this.resetStepDone(this.currIdx, this.getStep(this.currIdx));
        // если можно двигаться назад в рамках начала выделения(startIdx)
        if(this.currIdx>this.startIdx){
            this.currIdx--;
            this.resetStepDone(this.currIdx, this.getStep(this.currIdx));
        }
        if(this.isMeasureStart()){ // если начало такта
            this._resetMeasureWrongNote(); // сброс ошибок такта
        }
        return this.currIdx;
    }

    /** Сбросить пройденный такт, возвращает текущий такт */
    resetMeasureDone(keepMeasure?:boolean){
        let currMeasure = this.getMeasure();
        // сбрасываем текущий шаг
        this.resetStepDone(this.currIdx, this.getStep(this.currIdx));
        if(this.isMeasureStart()){ // если начало такта
            this._resetMeasureWrongNote(); // сброс ошибок такта
            if(keepMeasure)
                return currMeasure; // удерживать текущий такт
        }
        // если текущий шаг первый шаг такта - сбрасываем шаг в конце пред-го такта, переходим в предю такт
        if(this.currIdx>this.startIdx && this.getStep(this.currIdx-1).measureNumber==currMeasure-1){
            this.currIdx--;
            this.resetStepDone(this.currIdx, this.getStep(this.currIdx));
            currMeasure--;
        }
        // сбрасываем текущий шаг, пока можно двигаться назад в рамках начала выделения(startIdx) и такта...
        while(this.currIdx>this.startIdx && this.getStep(this.currIdx-1).measureNumber==currMeasure){
            this.currIdx--;
            this.resetStepDone(this.currIdx, this.getStep(this.currIdx));
        }
        this._resetMeasureWrongNote(); // сброс ошибок такта
        return currMeasure;
    }

    getCurrentIndex(){
        return this.currIdx;
    }
    getNextIndex(){
        return this.currIdx==this.endIdx ? this.startIdx : this.currIdx+1;
    }

    getStep(index: number): TimeStep {
        return this.noteArr[index];
    }

    getCurrentStep(){
        return this.getStep(this.currIdx);
    }

    getMeasure(index?: number){
        return this.getStep(index!=undefined? index : this.currIdx).measureNumber;
    }

    isMeasureStart(){
        return this.currIdx==this.startIdx || this.getMeasure()>this.getMeasure(this.currIdx-1);
    }

    isMeasureEnd(){
        return this.currIdx==this.endIdx  || this.getMeasure()<this.getMeasure(this.currIdx+1);
    }

    getStepVoices(index: number): number[] {
        let res: number[] = [];
        this.noteArr[index].elems.forEach(elem=>{
            res.push(elem.counters.voice);
        })
        return res;
    }

    /**
     * Границы шага, для рассчета скроллинга
     * @param index
     */
    getStepTopBottom(index: number) {
        let step = this.noteArr[index];
        let top = Number.MAX_VALUE, bottom = 0;
        step.elems.forEach(elem=>{
            elem.elemset.forEach(element=>{
                let bcRect = element.getBoundingClientRect();
                top = Math.min(top, bcRect.top);
                bottom = Math.max(bottom, bcRect.bottom);
            })
        })
        return {top: top, bottom: bottom};
    }

    getEndStep(){
        return this.noteArr[this.noteArr.length-1];
    }

    set prizeRightNotes(value: number) {
        this._prizeRightNotes = value;
    }

    set maxWrongNotes(value: number) {
        this._maxWrongNotes = value;
    }
    get maxWrongNotes(): number {
        return this._maxWrongNotes;
    }

    get wrongNote(): number {
        return this._wrongNote;
    }

    set onWrongNotes(foo: (pitch: number) => any) {
        this._onWrongNotes = foo;
    }

    set onRightNotes(foo: (pitch: number, idx: number) => void) {
        this._onRightNotes = foo;
    }

    set onNoteOff(value: (pitch: number) => void) {
        this._onNoteOff = value;
    }

    set onTimeStepDone(value: (stepIdx:number, step:TimeStep) => void) {
        this._onTimeStepDone = value;
    }

    set onTimeStepDoneReset(value: (stepIdx: number, step: TimeStep) => void) {
        this._onTimeStepDoneReset = value;
    }

    set onAllDoneNoteOff(value: () => void) {
        this._onAllDoneNoteOff = value;
    }

    set onAllElementNotesDone(value: (elem: Elem) => void) {
        this._onAllElementNotesDone = value;
    }

    set onSetToStart(value: (allDone?: boolean) => void) {
        this._onSetToStart = value;
    }

    set checkVoices(value: number[]) {
        this._checkVoices = value;
    }
}
class TimeStep {
    constructor(public time:number, public elems:Elem[], public measureNumber:number) {}
}