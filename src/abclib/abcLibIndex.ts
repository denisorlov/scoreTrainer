interface AbcLibItem {
    // composer name
    cName:string
    // music name
    mName:string
    // file name
    fName:string
    lev:number
}
let abcLibIndex: AbcLibItem[] = [
    {cName:'Richard Marx', mName:'Right here waiting for you', fName:'Marx_Right_here_waiting_for_you', lev:1},
    {cName:'Л.Бекман', mName:'В лесу родилась ёлочка', fName:'V_lesu_rodilas_yolochka', lev:1},
    {cName:'Bach J.S.', mName:'Prelude 1 in C', fName:'Bach_Prelude_C_BWV_846', lev:1},
    {cName:'Beethoven L.', mName:'Für Elise', fName:'Beethoven_Für_Elise', lev:1},
    {cName:'Vivaldi A.', mName:'Four Seasons Autumn', fName:'Vivaldi_Autumn', lev:1},

    {cName:'Bach J.S.', mName:'BADINERIE easy version', fName:'Bach_BADINERIE_easy', lev:2},
    {cName:'Bach J.S.', mName:'Cello Suite no 1 Prelude', fName:'Bach_Cello_Suite_no_1_Prelude', lev:2},
    {cName:'Beethoven L.', mName:'Sonate No. 14, Moonlight 1', fName:'Beethoven_Moonlight_1', lev:2},
    {cName:'Joplin S.', mName:'Entertainer', fName:'Joplin_Entertainer', lev:2},
    {cName:'Joplin S.', mName:'Maple Leaf Rag', fName:'Joplin_Maple_Leaf_Rag', lev:2},
    {cName:'Mozart W.A.', mName:'Rondo alla Turca', fName:'Mozart_Rondo_alla_Turca', lev:2},
    {cName:'Vivaldi A.', mName:'Four Seasons Winter', fName:'Vivaldi_Four_Seasons_Winter_First_movement', lev:2},

    {cName:'Mozart W.A.', mName:'Eine kleine Nachtmusik', fName:'Mozart_Eine_kleine_Nachtmusik_fragment', lev:2},
    {cName:'Mozart W.A.', mName:'Symphony No.40 in Gm, K550', fName:'Mozart_Symphony_40_1', lev:3},
    {cName:'Bach J.S.', mName:'BADINERIE aus der Orchestersuite Nr .2 h-Moll BWV1067', fName:'Bach_BADINERIE', lev:3},
    {cName:'Beethoven L.', mName:'Sonata No.8 Pathetique (fragment)', fName:'Beethoven_Sonata_No._8_Pathetique_fragment', lev:3},
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
    },
    initGroupSelect: function(select: HTMLSelectElement, onchange: (ev: Event)=>void, groupSelect?: HTMLSelectElement){
        // multy sorting
        let sorts = [
                function(a, b){return a.lev>b.lev ? 1: (a.lev<b.lev ? -1 : 0)},	// by level
                //function(a, b){return a.mName>b.mName ? 1 : (a.mName<b.mName ? -1 : 0)}, // by mName
                function(a, b){return a.cName>b.cName ? 1 : (a.cName<b.cName ? -1 : 0)}, // by cName
            ],
            sortFoo = function(){return 0};
        for(let i=sorts.length-1;i>-1;i--){
            // @ts-ignore
            sortFoo = (function (foo, _sortFoo) {
                return function(a,b){
                    // @ts-ignore
                    return foo(a,b) || _sortFoo(a,b);
                }
            }(sorts[i], sortFoo));
        }
        abcLibIndex.sort(sortFoo);

        let i, levgroup = -777,
            newOption = function(text, value, defaultSelected, selected, attrs?){
                let op = new Option(text, value, defaultSelected, selected);
                attrs = attrs || {};
                for(let k in attrs)
                    op.setAttribute(k, attrs[k]);
                return op;
            };

        for(i=0;i<abcLibIndex.length;i++){
            let it = abcLibIndex[i],
                opt = newOption(it.cName+': '+it.mName, it.fName,  false, false,
                    {'data-cName': it.cName, 'data-group': it.lev}); // +' ('+it.lev+')'
            // pseudo GROUP block
            if(levgroup!==it.lev){
                levgroup=it.lev; //&#127900;&#127901;
                let gr = newOption(
                    '🎜'.repeat(3)+' Level '+it.lev+': '+'🎝'.repeat(3),
                    '',  false, false,
                    {'disabled':'disabled', 'data-group': it.lev});
                select.appendChild(gr);
                if(groupSelect){
                    groupSelect.appendChild(newOption(it.lev, it.lev,  false, false));
                }
            }
            select.appendChild(opt);
        }
        //select.appendChild(newOption('выбрать...', -1,  false, false, {'disabled':'disabled'}));

        select.addEventListener('change', onchange);
        if(groupSelect){
            groupSelect.addEventListener('change', (ev)=>{
                abcLibUtils.filterByGroupValue(select, (ev.currentTarget as HTMLOptionElement).value);
            });
        }
    },
    filterByGroupValue: function(select: HTMLSelectElement, value){
        let options: NodeListOf<HTMLOptionElement> = document.querySelectorAll("#"+select.id+" option");
        options.forEach(function(op){
            op.style.display = 'inherit';
        });
        if(value!=='')
            options.forEach(function(op){
                op.style.display = op.getAttribute('data-group')==value? 'inherit' : 'none';
            })
    }
}


