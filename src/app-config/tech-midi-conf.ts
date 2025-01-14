// конфигурация TechMidi
let techMidi: TechMidi = new TechMidi();
techMidi.onTechNoteOn = (pitch: number)=>{
    if(pitch==62){ elem('playButton').click() } // D
    else if(pitch==63){  } //D#
    else if(pitch==64){ elem('slowerButton').click() } //E
    else if(pitch==65){ elem('fasterButton').click() } //F
    else if(pitch==66){ elem('metronomeUse').click() } //F#
    else if(pitch==67){  } //G
    else if(pitch==68){ elem('metronomeOnlyUse').click() } //G#
    else if(pitch==69){  } //A
    else if(pitch==70){ elem('extraMeasure').click() } //A#
    else if(pitch==71){  } //B
}