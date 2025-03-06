// require Diff from diffLib
interface WordDiff {
    count: number,
    added: boolean,
    removed: boolean,
    value: string
}
enum DiffAction {
    added = 'a', removed = 'r'
}
interface MinDiff {
    // position
    p: number,
    // action
    a: DiffAction,
    // value
    v: string
}
const diffUtils = {
    isDiff: function(wordDiff: WordDiff[]): boolean {
        return wordDiff.some(it=>it.added || it.removed);
    },
    wordDiffToMin: function(wordDiff: WordDiff[]): MinDiff[] {
        let res: MinDiff[]  = [],
            currPos = 0;
        wordDiff.forEach(it=>{
            if(it.added){
                res.push({p: currPos, a: DiffAction.added, v: it.value });
                currPos+=it.count;
            } else
            if(it.removed){
                res.push({p: currPos, a: DiffAction.removed, v: it.value });
            } else {
                currPos+=it.count;
            }
        })
        return res;
    },
    redo: function (value: string, minDiff: MinDiff[]): string{
        minDiff.forEach(it=>{
            if(it.a==DiffAction.added){
                value = [value.slice(0, it.p), it.v, value.slice(it.p)].join('');
            }
            else
            if(it.a==DiffAction.removed){
                value = [value.slice(0, it.p), value.slice(it.p+it.v.length)].join('');
            }
        })
        return value;
    },
    undo: function (value: string, minDiff: MinDiff[]): string{
        minDiff.slice().reverse().forEach(it=>{
            if(it.a==DiffAction.added){
                value = [value.slice(0, it.p), value.slice(it.p+it.v.length)].join('');
            }
            else
            if(it.a==DiffAction.removed){
                value = [value.slice(0, it.p), it.v, value.slice(it.p)].join('');
            }
        })
        return value;
    }
};