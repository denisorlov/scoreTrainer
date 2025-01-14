// конфигурация MidiDriver
function midiNoteOn(pitch: number, velocity: number){//console.log('midi data NoteOn', pitch, velocity);
    midiHandler.noteOn(pitch, velocity);
    techMidi.noteOn(pitch, velocity);
    noteView.addNote(pitch, true);
}
function midiNoteOff(pitch: number){//console.log('midi data NoteOff', pitch);
    midiHandler.noteOff(pitch);
    techMidi.noteOff(pitch);
    noteView.delNote(pitch);
}

const midiDriver = new MidiDriver();
midiDriver.requestMIDIAccessFailure = (event: Event)=>{
    console.log('requestMIDIAccessFailure', event);
};
midiDriver.midiOnMIDImessage = (event: { data: Array<any>; })=> {
    let data = event.data,
        cmd = data[0] >> 4,
        channel = data[0] & 0xf,
        type = data[0] & 0xf0,
        pitch = data[1],
        velocity = data[2];
    if(type==144 && velocity>0){
        midiNoteOn(pitch, velocity);
    }else
    if(type==128 || (type==144 && velocity==0)){
        midiNoteOff(pitch);
    }
}
midiDriver.onstatechange = (event: Event)=>{
    console.log('onstatechange', event);
};
midiDriver.initMIDIAccess();