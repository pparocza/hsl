class Piece {
    
    constructor(){

    }

    initMasterChannel(){

        this.globalNow = 0;

        this.gain = audioCtx.createGain();
        this.gain.gain.value = 1;
    
        this.fadeFilter = new FilterFade(0);
    
        this.masterGain = audioCtx.createGain();
        this.masterGain.connect(this.gain);
        this.gain.connect(this.fadeFilter.input);
        this.fadeFilter.connect(audioCtx.destination);

    }

    initFXChannels(){

    }

    load(){

        this.loadRampingConvolvers();

    }

    loadRampingConvolvers(){

        const fund = 300;
        const iArray = [ 1 , M2 , M3 , P4 , P5 , M6 , 2 ]

        this.rC1 = new RampingConvolver( 
            // fund
            fund , 
            // bufferLength
            2 , 
            // intervalArray
            iArray , 
            // octaveArray
            [ 1 , 0.5 , 2 , 0.25 , 4 ] ,
            // cFreq 
            12000 , 
            // bandwidth
            11750 , 
            // Q
            5 , 
            // fmCFreq , fmMFreq
            randomInt( 1 , 10 ) , randomInt( 1 , 10 ) ,  
            // oscillationRate
            0.125 , 
            // noiseRate
            0.25 , 
            // gain
            8 
            );

        this.rC1.output.connect( this.masterGain );

    }

    startRampingConvolvers(){

        this.rC1.start( this.globalNow , this.globalNow + 100 );

    }

    start(){

        this.fadeFilter.start(1, 50);
		this.globalNow = audioCtx.currentTime;

        this.startRampingConvolvers();

    }

    stop() {

        this.fadeFilter.start(0, 20);
        startButton.innerHTML = "reset";

    }

    loadSynthSection(){

        this.synth1 = new Synth( this );
        this.synth1.load();

    }

    startSynthSection(){

        this.synth1.start();

        const fund = 300 * 0.5;

        this.synth1.play( this.globalNow + 0 , 0.5 , fund * M6 , 0.25 );
        this.synth1.play( this.globalNow + 2 , 0.5 , fund * M6 * P5 , 0.25 );
        this.synth1.play( this.globalNow + 5 , 0.5 , fund * M6 / M2 , 0.25 );

    }

}

class RampingConvolver{

    constructor( fund , bufferLength , iArray , oArray , centerFrequency , bandwidth , Q , fmCFreq , fmMFreq , oscillationRate , noiseRate , gainVal ){

        this.input = new MyGain( 1 );
        this.output = new MyGain( 1 );

        this.c = new MyConvolver();
        this.cB = new MyBuffer2(  1 , bufferLength , audioCtx.sampleRate );
        this.cAB = new MyBuffer2( 1 , bufferLength , audioCtx.sampleRate );

        let interval = 0;
        let o = 0;
        let p = 0;

        for( let i = 0 ; i < 20 ; i++ ){

            interval = randomArrayValue( iArray );
            o = randomArrayValue( oArray );
            p = randomFloat( 0.1 , 0.9 );

            this.cAB.fm( fund * interval * o , fund * interval * o , 0.5 ).add( 0 );
            this.cAB.constant( 1 / o ).multiply( 0 );
            this.cAB.ramp( p , p + 0.1 , 0.5 , 0.5 , 0.1 , 0.1 ).multiply( 0 );

            this.cB.addBuffer( this.cAB.buffer );

        }

        this.cB.normalize( -1 , 1 );

        this.c.setBuffer( this.cB.buffer );

        // NOISE

        this.noise = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.noise.noise().fill( 0 );
        this.noise.playbackRate = noiseRate;
        this.noise.loop = true;
        this.noise.output.gain.value = 0.1;

        this.nF = new MyBiquad( 'bandpass' , centerFrequency , Q );

        this.nO = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.nO.fm( fmCFreq , fmMFreq , 1 ).fill( 0 );
        this.nO.playbackRate = oscillationRate;
        this.nO.loop = true;

        bufferGraph( this.nO.buffer );

        this.nOG = new MyGain( bandwidth );

        this.nO.connect( this.nOG );
        this.nOG.connect( this.nF.biquad.frequency );
        this.noise.connect( this.nF );
        this.nF.connect( this.c );

        // DELAY

        this.d = new Effect();
        this.d.randomEcho();
        this.d.on();

        this.input.connect( this.c );
        this.c.connect( this.output );

        this.c.connect( this.d );
        this.d.connect( this.output );

        this.c.output.gain.value = gainVal;

    }

    start( startTime , stopTime){

        this.noise.startAtTime( startTime );
        this.nO.startAtTime( startTime );

        this.noise.stopAtTime( stopTime );
        this.nO.stopAtTime( stopTime );

    }

}

class Synth{

    constructor( piece ){

        this.output = new MyGain( 1 );
        this.output.connect( piece.masterGain );

    }

    load(){

        this.oscBuffer = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );

        for( let i = 0 ; i < 20 ; i++ ){

            this.oscBuffer.sine( 1 * randomFloat( 0.99 , 1.01 ) * randomArrayValue( [ 1 , 2 , 4 , 0.5 , 8 ] ) , randomFloat( 0.5 , 1 ) ).add( 0 );

        }

        this.oscBuffer.normalize( -1 , 1 );

        this.oscBuffer.playbackRate = 493.88;
        this.oscBuffer.loop = true;

        this.envBuffer = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.envBuffer.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 4 ).fill( 0 );
        this.envBuffer.playbackRate = 1;

        this.envGain = new MyGain( 0 );

        // DELAY

        this.delay = new Effect();
        this.delay.stereoDelay( 0.5 , 0.7 , 0.3 );
        this.delay.on();
        this.delay.output.gain.value = 0.5;

        // REVERB

        this.c = new MyConvolver();
        this.cB = new MyBuffer2( 2 , 2 , audioCtx.sampleRate );
        this.cB.noise().add( 0 );
        this.cB.noise().add( 1 );
        this.cB.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 4 ).multiply( 0 );
        this.cB.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 4 ).multiply( 1 );

        this.c.setBuffer( this.cB.buffer );

        this.c.output.gain.value = 3;

        // FILTER

        this.filter = new MyBiquad( 'lowpass' , 1000 , 1 );

        // CONNECTIONS

        this.oscBuffer.connect( this.envGain ); this.envBuffer.connect( this.envGain.gain.gain );
        this.envGain.connect( this.filter );

        this.filter.connect( this.delay );
        this.envGain.connect( this.c );

        this.filter.connect( this.output ); 
        this.delay.connect( this.output );
        this.c.connect( this.output );

    }

    start(){

        this.oscBuffer.start();

    }

    play( startTime , duration , frequency , gainVal ){

        const envelopeRate = 1 / duration;

        this.oscBuffer.bufferSource.playbackRate.setValueAtTime( frequency , startTime );
        this.envBuffer.output.gain.setValueAtTime( gainVal , startTime );

        this.envBuffer.startAtTime( startTime );
        this.envBuffer.bufferSource.playbackRate.setValueAtTime( envelopeRate , startTime );

    }

}