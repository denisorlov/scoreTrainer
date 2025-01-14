/** Управление при помощи клавиш */
class TechMidi {
    note58: boolean = false;
    note59: boolean = false;
    note60: boolean = false;
    note61: boolean = false;

    set onTechNoteOn(value: (pitch: number) => void) {
        window['_techMidi_onTechNoteOn'] = value;
    }
    noteOn(pitch: number, velocity: number): void {
        if(pitch==58) this.note58 = true;
        else if(pitch==59) this.note59 = true;
        else if(pitch==60) this.note60 = true;
        else if(pitch==61) this.note61 = true;
        let active = this.isActive();
        if(active) console.log('Tech keys are active!');
        if(active && (pitch<58 || pitch>61)) {
            window['_techMidi_onTechNoteOn'](pitch);
        }
    }
    noteOff(pitch: number): void {
        if(pitch==58) this.note58 = false;
        if(pitch==59) this.note59 = false;
        if(pitch==60) this.note60 = false;
        if(pitch==61) this.note61 = false;
    }
    isActive(): boolean {
        return this.note58 && this.note59 && this.note60 && this.note61;
    }
}