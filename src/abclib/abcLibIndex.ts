let abcLibPaths = [
    "Beethoven_L.W.__Sonata_No._8_Pathetique_fragment__3"
    ,"Beethoven_L.W.__Für_Elise__1"
    ,"Beethoven_L.W.__An_die_Freude_fragment__3"
    ,"Bach_J.S.__Prelude_1_in_C_BWV_846__1"
    ,"Bach_J.S.__Cello_Suite_no_1_Prelude__2"
    ,"Bach_J.S.__BADINERIE_Nr.2_h-Moll_BWV1067__3"
    ,"Bach_J.S.__BADINERIE_easy_version__2"
    ,"Bach_J.S.__Air_in_D__2"
    ,"Boccherini_L.__El_célebre_minuetto__1"
    ,"Мусоргский_М.П.__Прогулка__3"
    ,"Мусоргский_М.П.__Быдло__3"
    ,"Бекман_Л.__В_лесу_родилась_елочка__1"
    ,"Vivaldi_A.__Four_Seasons_Winter_1_movement__2"
    ,"Vivaldi_A.__Four_Seasons_Autumn__1"
    ,"Schubert_F.__Waltz_in_B_minor__1"
    ,"Pachelbel_J.__Canon in D__2"
    ,"Mozart_W.A.__Symphony_40_1__3"
    ,"Mozart_W.A.__Rondo_alla_Turca__2"
    ,"Mozart_W.A.__Eine_kleine_Nachtmusik_fragment__3"
    ,"Marx_R.__Right_here_waiting_for_you__1"
    ,"Mangini_H.__Moon_River__1"
    ,"Joplin_S.__Maple_Leaf_Rag__2"
    ,"Joplin_S.__Entertainer__2"
    ,"Händel_J.__Sarabande__1"
    ,"Gibb_R.__Woman_in_Love__2"
    ,"English_Folk__Greensleaves__3"
    ,"Chopin_F.__Waltz_in_C_sharp_Minor__3"
    ,"Chopin_F.__Waltz_in_B_Minor__2"
    ,"Carli_P.__Pardonne-moi__2"
    ,"Beethoven_L.W.__Symphony_5_part_1_easy__2"
    ,"Beethoven_L.W.__Sonate_No._14_Moonlight_part_1__2"
];
interface AbcLibItem {
    // composer name
    cName:string
    // music name
    mName:string
    // file name
    fName:string
    lev:number
}
let abcLibIndex: AbcLibItem[] = [];

let abcLibUtils = {
    initAbcLibIndex: function(){
        abcLibIndex = [];
        abcLibPaths.forEach(path=>{
            let arr = path.split('__');
            abcLibIndex.push({fName:path,
                cName: arr.length>1 ? arr[0].replace(/_/g, ' ') : "???",
                mName: (arr.length>1 ? arr[1] : path).replace(/_/g, ' '),
                lev: arr.length>2 ? parseInt(arr[2]) : -1
            });
        })
    },
    initSelect: function (select: HTMLSelectElement, onchange: (ev: Event)=>void){
        abcLibUtils.initAbcLibIndex();
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
        abcLibUtils.initAbcLibIndex();
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


