interface AbcLibItem {
    // composer name
    cName:string
    // music name
    mName:string
    // file name
    fName:string
}
let abcLibIndex: AbcLibItem[] = [
    {cName:'-', mName:'Cooley\'s', fName:'Cooley\'s'},
    {cName:'Bach J.S.', mName:'BADINERIE aus der Orchestersuite Nr .2 h-Moll BWV1067', fName:'Bach_BADINERIE'},
    {cName:'Bach J.S.', mName:'BADINERIE easy version', fName:'Bach_BADINERIE_easy'},
    {cName:'Beethoven L.', mName:'Sonate No. 14, Moonlight 1', fName:'Beethoven_Moonlight_1'},
    {cName:'Mozart W.A.', mName:'Eine kleine Nachtmusik', fName:'Mozart_Eine_kleine_Nachtmusik_fragment'},
    {cName:'Mozart W.A.', mName:'Symphony No.40 in Gm, K550', fName:'Mozart_Symphony_40_1'},
    {cName:'Vivaldi A.', mName:'Autumn', fName:'Vivaldi_Autumn'},
    {cName:'Л.Бекман', mName:'В лесу родилась ёлочка', fName:'V_lesu_rodilas_yolochka'},
]

let abcLibUtils = {
    initSelect: function (select: HTMLSelectElement, onchange: (ev: Event)=>void){
        abcLibIndex.forEach(it=>{
            select.appendChild( abcLibUtils.newOption(it.cName+': '+it.mName, it.fName,  false, false, {'data-cName': it.cName}));
        })
        select.addEventListener('change', onchange);
    },
    newOption: function(text:string, value:any, defaultSelected:boolean, selected:boolean, attrs:any){
        let op = new Option(text, value, defaultSelected, selected);
        attrs = attrs || {};
        for(let k in attrs)
            op.setAttribute(k, attrs[k]);
        return op;
    }
}

