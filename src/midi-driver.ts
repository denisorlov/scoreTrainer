class MidiDriver {
    initMIDIAccess() {
        //@ts-ignore
        if (navigator.requestMIDIAccess) {
            console.log('navigator.requestMIDIAccess ok');
            //@ts-ignore
            navigator.requestMIDIAccess().then(this.requestMIDIAccessSuccess, window['_requestMIDIAccessFailure']);
        } else {
            console.log('navigator.requestMIDIAccess undefined');
        }
    }
    requestMIDIAccessSuccess(midi) {
        let inputs = midi.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
            input.value.onmidimessage = window['_midiOnMIDImessage'];
        }
        midi.onstatechange = window['_onstatechange'];
    }

    set requestMIDIAccessFailure(value: (event: Event) => void) {
        window['_requestMIDIAccessFailure'] = value;
    }

    set midiOnMIDImessage(value: (event: { data: Array<any> }) => void) {
        window['_midiOnMIDImessage'] = value;
    }

    set onstatechange(value: (event: Event) => void) {
        window['_onstatechange'] = value;
    }
}