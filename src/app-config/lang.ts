const languages = {
    ru:{
        titles:{
            noteOnViewLeft: "Влево",
            noteOnViewRight: "Вправо",
            noteOnViewSize: "Размер",
            noteOnViewClear: "Очистить",
            noteOnViewClose: "Закрыть",
            slowerButton: "Медленнее",
            tempoWarp: "Переключить темп половина/целый",
            fasterButton: "Быстрее",
            //: "Построить",
            buildEditorButton: "Редактировать",
            noteOnViewButton: "Ноты миди",
            settingButton: "Настройки",
            staffWidth: "Width: Ширина в px",
            staffWidthResize: "Resize Mode: Ширина на всю страницу",
            staffScale: "Scale: Масштаб, игнорируется если ширина на всю страницу",
            preferredMeasuresPerLine: "Measures per Line: Предпочтительное кол-во тактов в строке",
            metronomeUse: "Use Metronome: Использовать метроном",
            metronomeOnlyUse: "Only Metronome: Использовать только метроном",
            metronomeText: "Metronome Text: Строка метронома в формате %%MIDI drum",
            changeInfo: "Параметры не менялись или применены",
            autoScroll: "Auto Scroll: Автоматическая прокрутка",
            bindKeysScroll: "Scroll: привязать клавиши стрелок <Влево Вправо>",
            scrollTopThreshold: "Scroll Top: Верхняя граница скролла",
            scrollBotThreshold: "Scroll Bottom: Нижняя граница скролла",
            scrollThresholdLineButton: "Показать уровни скролла",
            toStartButton: "В начало...",
            measureBackButton: "В начало такта...",
            bindKeysMeasureBack: "Привязать клавишу стрелка Вверх",
            stepBackButton:"Шаг назад...",
            bindKeysStepBack: "Привязать клавишу стрелка Вниз",
            restartErrors: "Количество ошибок для рестарта такта",
            repeatErrors: "Количество ошибок для повтора такта",
            maxWrongNotes: "Максимум неверных нот",
            prizeNotes: "Призовые ноты, для сброса неверных нот",
            voicesCheckControlPanel: "Выбрать часть голосов для контроля",
            fixedDivTopHideButton: "Спрятать/показать панель",
            mouseWheelNote: "Перемещать колесом мыши выделенную ноту",
            //allowDragging: "Allow Dragging: Разрешить перетаскивание"
        },
        messages:{
            paramsChangedToApply: 'Параметры изменены, чтобы применить их  - нажмите "{0}"',
            paramsNotChanged: ()=>languages.ru.titles.changeInfo
        }
    },
    en:{
        titles:{
            noteOnViewLeft: "Left",
            noteOnViewRight: "Right",
            noteOnViewSize: "Size",
            noteOnViewClear: "Clear",
            noteOnViewClose: "Close",
            slowerButton: "Slower",
            tempoWarp: "Toggle tempo half/whole",
            fasterButton: "Faster",
            buildEditorButton: "Edit",
            noteOnViewButton: "Midi Notes",
            settingButton: "Settings",
            staffWidth: "Width: Width in px",
            staffWidthResize: "Resize Mode: Full page width",
            staffScale: "Scale: Scale, ignored if full page width",
            preferredMeasuresPerLine: "Measures per Line: Preferred number of measures per line",
            metronomeUse: "Use Metronome: Use metronome",
            metronomeOnlyUse: "Only Metronome: Use metronome only",
            metronomeText: "Metronome Text: Metronome string in %%MIDI drum format",
            changeInfo: "Parameters not changed or applied",
            autoScroll: "Auto Scroll: Automatic scrolling",
            bindKeysScroll: "Scroll: bind arrow keys <Left Right>",
            scrollTopThreshold: "Scroll Top: Upper scroll limit",
            scrollBotThreshold: "Scroll Bottom: Lower scroll limit",
            scrollThresholdLineButton: "Show scroll levels",
            toStartButton: "To the beginning...",
            measureBackButton: "To the measure beginning...",
            bindKeysMeasureBack: "Bind arrow key Up",
            stepBackButton:"Step back...",
            bindKeysStepBack: "Bind arrow key Down",
            restartErrors: "Quantity of errors to measure restart",
            repeatErrors: "Quantity of errors to measure repeat",
            maxWrongNotes: "Maximum of wrong notes",
            prizeNotes: "Prize notes, to reset wrong notes",
            voicesCheckControlPanel: "Select part of voices to check",
            fixedDivTopHideButton: "Hide/show panel",
            mouseWheelNote: "Move with mouse wheel selected note",
            //allowDragging: "Allow Dragging"
        },
        messages:{
            paramsChangedToApply: 'The parameters have been changed, to apply them - click "{0}"',
            paramsNotChanged: ()=>languages.en.titles.changeInfo
        }
    },
    ch:{
        titles:{
            noteOnViewLeft: "左",
            noteOnViewRight: "右",
            noteOnViewSize: "大小",
            noteOnViewClear: "清除",
            noteOnViewClose: "關閉",
            slowerButton:"慢一點",
            tempoWarp: "切換半/全節奏",
            fasterButton:"更快",
            buildEditorButton: "編輯",
            noteOnViewButton: "Midi 筆記",
            settingButton: "設定",
            staffWidth: "寬度:以 px 為單位的寬度",
            staffWidthResize: "調整大小模式:全頁寬度",
            staffScale: "Scale:縮放,如果寬度為整頁則忽略",
            preferredMeasuresPerLine: "每行的測量數:每行的首選測量數",
            metronomeUse: "使用節拍器:使用節拍器",
            metronomeOnlyUse: "僅節拍器:僅使用節拍器",
            metronomeText: "節拍器文字:%%MIDI 鼓格式的節拍器字串",
            changeInfo: "參數尚未更改或套用",
            autoScroll: "自動滾動",
            bindKeysScroll: "滚动：绑定方向键 <左 右>",
            scrollTopThreshold: "Scroll Top: 頂部滾動限制",
            scrollBotThreshold: "Scroll Bottom: 底部捲動邊框",
            scrollThresholdLineButton: "顯示滾動等級",
            toStartButton: "從頭開始",
            measureBackButton: "到测量开始...",
            bindKeysMeasureBack: "绑定向上箭头键",
            stepBackButton:"后退一步",
            bindKeysStepBack: "绑定向下箭头键",
            restartErrors: "衡量重启次数的错误数量",
            repeatErrors: "测量重复误差的数量",
            maxWrongNotes: "最大錯誤筆記數",
            prizeNotes: "獎品備註,用於重置無效備註",
            voicesCheckControlPanel: "選擇部分票進行控制",
            fixedDivTopHideButton:"隱藏/顯示面板",
            mouseWheelNote: "移動滑鼠滾輪選擇音符",
            //allowDragging: "允許拖曳"
        },
        messages:{
            paramsChangedToApply: '設定已更改，要應用它們 - 單擊 "{0}"',
            paramsNotChanged: ()=>languages.ch.titles.changeInfo
        }
    }
};

const langUtils = {
    currentLanguage: 'ru',
    setCurrentLanguage: function(lang?: string){
        if(lang){
            if(lang in languages) langUtils.currentLanguage = lang;
            else throw new Error('Not found language "'+lang+'" in languages');
        }

        langUtils.setTitles();
    },
    mess: function (code: string, vars?:any[]){
        if(!languages[langUtils.currentLanguage].messages[code]){
            console.warn('Not found message for language "'+langUtils.currentLanguage+'" and code '+code);
            return  'NOT_FOUND_MESSAGE_SEE_CONSOLE_WARN';
        }

        let mess = languages[langUtils.currentLanguage].messages[code];
        mess = mess instanceof Function ? mess() : mess;
        if(vars)
            mess = mess.replace(/\{(\d)\}/g, (s, num) => num<vars.length ? vars[num]: 'NOT_FOUND_VAR_'+num);

        return mess;
    },
    initSelect: function (select: HTMLSelectElement){
        for(let k in languages){
            select.appendChild( new Option(k, k,  false, false));
        }
        select.addEventListener('change', (ev)=>{
            let value = (ev.target as HTMLSelectElement).value;
            langUtils.setCurrentLanguage(value);
            (ev.target as HTMLSelectElement).blur();//removing the focus of an select
        });
        select.dispatchEvent(new Event('change')); // init default
    },
    setTitles: function (){
        let lt = languages[langUtils.currentLanguage].titles;
        for(let k in lt){
            let elementById = document.getElementById(k);
            if(!elementById){
                console.warn("Not found element by id="+k+" for setting title");
                continue;
            }
            elementById.title = lt[k];
        }
    }
}