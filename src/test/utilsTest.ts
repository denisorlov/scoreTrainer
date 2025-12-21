(()=>{
    let testName = 'utilsTest';
    console.info(testName+': Tests started...')
    console.time(testName);

    let hn: IHashNavigator<number> = new utils.HashNavigator(true);
    hn.push(0);hn.push(1);hn.push(2);hn.push(3);hn.push(4);hn.push(5);
    console.assert(hn.index==5, 'hn.index==5');
    console.assert(hn.array.length==6, 'hn.array.length==6');

    hn.previous();hn.previous();
    console.assert(hn.index==3, 'hn.index==3');

    hn.push(44);
    console.assert(hn.index==4, 'hn.index==4');
    console.assert(hn.array.length==5, 'hn.array.length==5');

    console.timeEnd(testName);
})();

function drawNoteTest(){
    let drawTestAbcStr = `X:1
T:Title
C:Composer
M:5/4
L:1/4
K:G
%%score { (1) | (4) }
V:1 clef=treble nm="Piano"
V:4 clef=bass
V:1
c''   C B,3 f2|f f3|]
V:4
[C,,,E,,,G,,,B,,,D,,F,,A,,c,,e,,G,]3CB,2G,,|z2G,,G,,|]`;
    elemType('abcTextArea', HTMLTextAreaElement).value = drawTestAbcStr;
    elemType('abcTextArea', HTMLTextAreaElement).dispatchEvent(new Event('change'));

    let engraverController = ABCJS.engraverController,
        drawNotesInRange = function (elem: Elem, start: number, end: number, step: number
        ): void {
            let nprev = 500;
            for (let n = start; step > 0 ? n < end : n > end; n += step) {
                if (alteredNotes.includes(n)) continue;
                if (Math.abs(nprev - n) < 3) continue;
                nprev = n;
                AbcJsUtils.drawNote(engraverController.renderer, elem, n, HighlightWrongCls);
            }
        },

        drawNotes = function(elem: Elem, top: number, low:number){
            let pitch = elem.abcelem.midiPitches[0].pitch;
            // Сверху вниз (шаг -1)
            drawNotesInRange(elem, top, pitch, -1,);

            // Снизу вверх (шаг +1)
            drawNotesInRange(elem, low, pitch - 1, +1);
        };

    drawNotes(midiHandler.noteArr[1].elems[0], 95, 26);
    drawNotes(midiHandler.noteArr[2].elems[0], 96, 24);
    drawNotes(midiHandler.noteArr[3].elems[0], 95, 26);
    drawNotes(midiHandler.noteArr[4].elems[0], 96, 24);
    drawNotes(midiHandler.noteArr[5].elems[0], 95, 26);
    drawNotes(midiHandler.noteArr[6].elems[0], 95, 26);

    AbcJsUtils.drawNote(engraverController.renderer, midiHandler.noteArr[7].elems[0], 53, HighlightWrongCls);
    AbcJsUtils.drawNote(engraverController.renderer, midiHandler.noteArr[8].elems[0], 48, HighlightWrongCls);
    AbcJsUtils.drawNote(engraverController.renderer, midiHandler.noteArr[9].elems[0], 67, HighlightWrongCls);
    AbcJsUtils.drawNote(engraverController.renderer, midiHandler.noteArr[10].elems[0], 73, HighlightWrongCls);
}
