(()=>{
    console.info('diffUtilsTest: Tests started...')
    console.time('diffUtilsTest');
    const wordDiff = new window['Diff']();
    let diff1: WordDiff[] = wordDiff.diff('93331118889', '00033390888111000');
    //console.log('diff1', diff1);
    let minDiff1 = diffUtils.wordDiffToMin(diff1);
    //console.log('minDiff1', minDiff1);

    let redo = diffUtils.redo('93331118889', minDiff1);
    console.assert(redo=='00033390888111000', redo+'==00033390888111000');

    let undo = diffUtils.undo('00033390888111000', minDiff1);
    console.assert(undo=='93331118889', undo+'==93331118889');

    let str1 = 'Съешь же ещё этих мягких французских булок, да выпей чаю\n',
        bigStr1= str1.repeat(50);
    let diff2: WordDiff[] = wordDiff.diff(
        bigStr1+str1                                                +bigStr1,
        bigStr1+str1.replace('мягких','жестких')+bigStr1
    );
    let minDiff2 = diffUtils.wordDiffToMin(diff2);
    //console.log(minDiff2);
    console.assert(minDiff2.length==2, minDiff2.length+'=='+2);
    console.assert(minDiff2[0].p==minDiff2[1].p, minDiff2[0].p+'=='+minDiff2[1].p);
    console.assert(minDiff2[0].a==DiffAction.removed, minDiff2[0].a+'=='+DiffAction.removed);
    console.assert(minDiff2[0].v=='мяг', minDiff2[0].v+'=='+'мяг');
    console.assert(minDiff2[1].a==DiffAction.added, minDiff2[1].a+'=='+DiffAction.added);
    console.assert(minDiff2[1].v=='жест', minDiff2[1].v+'=='+'жест');


    let bigStr11 = bigStr1+str1+bigStr1,
        bigStr22 = str1.repeat(30)+str1.replace('мягких','жестких')+bigStr1,
        diff3: WordDiff[] = wordDiff.diff(bigStr11, bigStr22);
    let minDiff3 = diffUtils.wordDiffToMin(diff3);
    console.log(minDiff3);
    console.assert(minDiff3.length==5, minDiff3.length+'=='+5);
    let redo2 = diffUtils.redo(bigStr11, minDiff3);
    console.assert(redo2==bigStr22);

    let undo2 = diffUtils.undo(bigStr22, minDiff3);
    console.assert(undo2==bigStr11);

    console.timeEnd('diffUtilsTest');
})();
