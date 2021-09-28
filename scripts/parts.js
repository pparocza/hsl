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
        
        // REVERB

            this.c = new MyConvolver();
            this.cB = new MyBuffer2( 2 , 3 , audioCtx.sampleRate );
            this.cB.noise().add( 0 );
            this.cB.noise().add( 1 );
            this.cB.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 4 ).multiply( 0 );
            this.cB.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 4 ).multiply( 1 );

            this.c.setBuffer( this.cB.buffer );

            this.cIn = new MyGain( 0 );
            this.cE = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );
            this.cEAB = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );

            let p = 0;

            for( let i = 0 ; i < 10 ; i++ ){

                p = randomFloat( 0.1 , 0.9 );

                this.cEAB.constant( 0 ).fill( 0 );

                this.cEAB.ramp( p , p + 0.025 , 0.5 , 0.5 , 0.1 , 0.1 ).add( 0 );
                this.cEAB.constant( randomFloat( 0.5 , 1 ) ).multiply( 0 );

                this.cE.addBuffer( this.cEAB.buffer );

            }

            this.cE.normalize( 0 , 1 );

            this.cE.playbackRate = 0.5;
            this.cE.loop = true;
            this.cE.start();

            this.c.output.gain.value = 6;

            this.cF = new MyBiquad( 'highpass' , 500 , 1 );

            this.cD = new Effect();
            this.cD.randomEcho();
            this.cD.on();

        // RAMPING CONVOLVER

            this.cGain = new MyGain( 1 );
            this.cOut = new MyGain( 1 );
            const fund = randomFloat( 225 , 300 );

            // startTime , fund , centerFrequency , bandwidth , oscillationRate , noiseRate , gain
            // this.rC1 = new RampingConvolver( fund , 2000 , 1000 , 0.25 , 0.25 , 8 );
            // this.rC2 = new RampingConvolver( fund , 5000 , 3000 , 0.25 , 1 , 2 );

            this.rC3A = new RampingConvolver( fund , 9000 ,  8500  , 0.25 , fund * randomFloat( 4 , 8 ) , 16 );
            this.rC3B = new RampingConvolver( fund , 5000 ,  4500  , 0.125 , fund * randomFloat( 4 , 8 ) , 16 );

            this.rC3C = new RampingConvolver( fund , 9000 ,  8500  , randomFloat( 0.1 , 0.3 ) , fund * randomFloat( 4 , 8 ) , 16 );
            this.rC3D = new RampingConvolver( fund , 5000 ,  4500  , randomFloat( 0.1 , 0.3 ) , fund * randomFloat( 4 , 8 ) , 16 );
            // this.rC3C = new RampingConvolver( this.globalNow + 20 , fund , 800 ,  700  , 0.125 , fund * randomFloat( 8 , 16 ) , 8 );

            // this.rC4 = new RampingConvolver( this.globalNow , fund , 5000 , 3500 , 0.1 , 0.25 , 4 );

        // CONNECTIONS

            // this.cGain.connect( this.rC1.input );
            // this.rC1.output.connect( this.masterGain );

            // this.cGain.connect( this.rC2.input );
            // this.rC2.output.connect( this.masterGain );

            this.cGain.connect( this.rC3A.input );
            this.rC3A.output.connect( this.cOut );
                
            this.cGain.connect( this.rC3B.input );
            this.rC3B.output.connect( this.cOut );

            this.cGain.connect( this.rC3C.input );
            this.rC3C.output.connect( this.cOut );
                
            this.cGain.connect( this.rC3D.input );
            this.rC3D.output.connect( this.cOut );

            // this.cGain.connect( this.rC3C.input );
            // this.rC3C.output.connect( this.cOut );

            // this.cGain.connect( this.rC4.input );
            // this.rC4.output.connect( this.masterGain );

            this.cOut.connect( this.cIn ); this.cE.connect( this.cIn.gain.gain );
            this.cIn.connect( this.c );
            this.c.connect( this.cF );

            this.cF.connect( this.cD );

            this.cF.connect( this.masterGain );
            this.cD.connect( this.masterGain );

            this.cOut.connect( this.masterGain );

            this.rC3A.start( this.globalNow , this.globalNow + 30 );
            this.rC3B.start( this.globalNow , this.globalNow + 30 );

            this.rC3C.start( this.globalNow + 25 , this.globalNow + 55 );
            this.rC3D.start( this.globalNow + 25 , this.globalNow + 55 );

            this.rC3A.start( this.globalNow + 53 , this.globalNow + 83 );
            this.rC3B.start( this.globalNow + 53 , this.globalNow + 83 );


    }

    load(){

        this.loadSynthSection();

    }

    start(){

        this.fadeFilter.start(1, 50);
		this.globalNow = audioCtx.currentTime;

        // this.startSynthSection();

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

    constructor( fund , centerFrequency , bandwidth , oscillationRate , noiseRate , gainVal ){

        this.input = new MyGain( 1 );
        this.output = new MyGain( 1 );

        this.c = new MyConvolver();
        this.cB = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );
        this.cAB = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );

        const iArray = [ 1 , M2 , M3 , P4 , P5 , M6 , 2 ];
        const oArray = [ 1 , 0.5 , 2];

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

        this.nF = new MyBiquad( 'bandpass' , centerFrequency , 2 );

        this.nO = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.nO.sine( 1 , 1 ).fill( 0 );
        this.nO.playbackRate = oscillationRate;
        this.nO.loop = true;

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

    start( startTime , stopTime ){

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