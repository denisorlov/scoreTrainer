const utils = {
    elem: function (id:string){
        let elementById = document.getElementById(id);
        if(elementById==null) throw new Error('Not found HTMLElement by id: '+id);
        return  elementById;
    },
    elemType: function (id:string, type: any): typeof type {
        return  this.elem(id) as typeof type;
    },
    addListener: function(type: string, selector: string, foo: EventListenerOrEventListenerObject):void {
        document.querySelector(selector)!.addEventListener(type, foo);
    },

    toggle: function(selector){
        let i, elems = document.querySelectorAll(selector);
        for(i=0;i<elems.length;i++){
            elems[i].style.display = elems[i].style.display=='none' ? '' : 'none';
        }
    },

    roundNumber: function (x) {
        return parseFloat(x.toFixed(2));
    },
    sprintf: function(template, ...args) {
        return template.replace(/%f/g, () => args.shift());
    },

    setDraggable: function (el: HTMLElement){
        let rect = el.getBoundingClientRect();
        el.style.position = 'fixed';
        el.style.top = rect.top +'px';
        el.style.left = rect.left +'px';

        el.draggable = true;
        el.ondragstart = function (e) {
            el.style.cursor = 'move';
            el['_dragStartY'] = e.clientY;
            el['_dragStartX'] = e.clientX
        };
        el.ondragend = function (e) {
            el.style.top = parseInt(el.style.top) + (e.clientY - window.screenY - el['_dragStartY']) + 'px';
            el.style.left = parseInt(el.style.left) + (e.clientX - window.screenX - el['_dragStartX']) + 'px';
        };
    },

    // https://stackoverflow.com/questions/21012580/is-it-possible-to-write-data-to-file-using-only-javascript
    textFileHref: '',
    makeSaveTextFileHref: function (text: string, contentType?: string) {
        let data = new Blob([text], {type: contentType || 'text/plain'});

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if (utils.textFileHref !== '') {
            window.URL.revokeObjectURL(utils.textFileHref);
        }

        utils.textFileHref = window.URL.createObjectURL(data);

        return utils.textFileHref;
    },
    initSaveTextFile: function (text: string, contentType?: string, defaultFileName?: string) {
        let link = document.createElement('a');
        link.setAttribute('download', defaultFileName || 'saved.txt');
        link.href = utils.makeSaveTextFileHref(text, contentType);
        document.body.appendChild(link);

        // wait for the link to be added to the document
        window.requestAnimationFrame(function () {
            link.dispatchEvent(new MouseEvent('click'));
            document.body.removeChild(link);
        });
    },

    /**
     * https://stackoverflow.com/a/55111246/2223787
     * @param textarea
     */
    scrollToSelected: function (textarea: HTMLTextAreaElement) {
        let selectionEnd = textarea.selectionEnd,
            selectionStart = textarea.selectionStart;
        // First scroll selection region to view
        const fullText = textarea.value;
        textarea.value = fullText.substring(0, selectionEnd);
        // For some unknown reason, you must store the scollHeight to a variable
        // before setting the textarea value. Otherwise it won't work for long strings
        const scrollHeight = textarea.scrollHeight
        textarea.value = fullText;
        let scrollTop = scrollHeight;
        const textareaHeight = textarea.clientHeight;
        if (scrollTop > textareaHeight){
            // scroll selection to center of textarea
            scrollTop -= textareaHeight / 2;
        } else{
            scrollTop = 0;
        }
        textarea.scrollTop = scrollTop;

        // Continue to set selection range
        textarea.setSelectionRange(selectionStart, selectionEnd);
    },

    insertAtCursor: function (textarea: HTMLTextAreaElement, value): number {
        if (textarea.selectionStart || textarea.selectionStart == 0) {
            let startPos = textarea.selectionStart,
                endPos = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, startPos)
                + value
                + textarea.value.substring(endPos, textarea.value.length);
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = startPos + value.length;
            return textarea.selectionStart;
        } else {
            textarea.value += value;
            textarea.focus();
            textarea.selectionStart = textarea.value.length;
            return textarea.selectionStart;
        }
    },

    HashNavigator: class HashNavigator<T> implements IHashNavigator<T> {
        private _index=-1;
        private _array: T[] =[];
        /** обрезать при пуше */
        private _pushSlice:boolean;

        constructor(pushSlice: boolean) {
            this._pushSlice = pushSlice;
        }

        push(newEl: T){
            this.pushTo(this._index+1, newEl);
            return this._index++;
        }
        pushTo(idx: number, newEl: T){
            this._array.splice(idx,0,newEl);
            if(this._pushSlice )
                this._array = this._array.slice(0, idx+1); // не вставляем промежуточные, обрезаем
        };


        move(oldIdx: number, newIdx: number){
            let el = this._array[oldIdx];
            this.remove(oldIdx);
            this.pushTo(newIdx, el);
        };
        setTo(el: T){
            this._index = this._array.indexOf(el);
        };
        hasNext(){
            return this._index<this._array.length-1;
        };
        hasPrevious(){
            return this._index>0;
        };
        next():T|null{
            if(!this.hasNext()) return null;
            return this._array[++this._index];
        };
        previous(){
            if(!this.hasPrevious()) return null;
            return this._array[--this._index];
        };
        // без перехода указателя
        getNext(){
            return this.hasNext() ? this._array[this._index+1] : null;
        };
        // без перехода указателя
        getPrevious(){
            return this.hasPrevious() ? this._array[this._index-1] : null;
        };
        current(){
            if(this._index<0) return null;
            return this._array[this._index];
        };

        get index(): number {
            return this._index;
        }

        get array(): T[] {
            return this._array;
        }
        resetArray(){ this._array=[]; this._index=-1; };
        remove(idx: number){ this._array.splice(idx, 1); this._index = Math.min(this._array.length-1, this._index);};
        moveTop(idx: number){this.move(idx, 0);};
        moveBtm(idx: number){this.move(idx, this._array.length-1);};
    }
}

interface IHashNavigator<T> {
    readonly index: number;
    readonly array: T[];

    push(newEl: T): number;
    pushTo(idx: number, newEl: T): void;
    move(oldIdx: number, newIdx: number): void;
    setTo(el: T): void;
    hasNext(): boolean;
    hasPrevious(): boolean;
    next():T|null;
    previous():T|null;
    getNext():T|null;
    getPrevious():T|null;
    current():T|null;
    resetArray(): void;
    remove(idx: number): void;
    moveTop(idx: number): void;
    moveBtm(idx: number): void;
}