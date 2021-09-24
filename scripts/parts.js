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
        this.cB = new MyBuffer2( 2 , 2 , audioCtx.sampleRate );
        this.cB.noise().add( 0 );
        this.cB.noise().add( 1 );
        this.cB.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 8 ).multiply( 0 );
        this.cB.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 8 ).multiply( 1 );

        this.c.setBuffer( this.cB.buffer );

        this.cGain = new MyGain( 0.25 );

        this.cGain.connect( this.masterGain );

    }

    load(){

        this.loadNoiseDelayOsc();

    }

    start(){

        this.fadeFilter.start(1, 50);
		this.globalNow = audioCtx.currentTime;
        
        this.startNoiseDelayOsc();

    }

    stop() {

        this.fadeFilter.start(0, 20);
        startButton.innerHTML = "reset";

    }

    loadNoiseDelayOsc(){

        this.playbackRate = 0.42311725367219677; // randomFloat( 0.375 , 0.425 );
        this.fund = randomInt( 300 , 350 ) * 4;
        this.iArray = [ 1 , M3 , P5 , P4 , 2 , P5 * 2 , M6 ];
        this.nPhrases = 5;
        this.modGainVal = this.fund * 0.25; // * randomFloat( 0.999 , 1.001 );
        this.gainVal = 0.75;

        this.nDO1 = new NoiseDelayOsc( this );
        this.nDO1.load( this.playbackRate , this.fund ,  this.iArray , this.modGainVal , this.nPhrases , this.gainVal * 3 );

        this.nDO2 = new NoiseDelayOsc( this );
        this.nDO2.load( this.playbackRate , this.fund , this.iArray , this.modGainVal , this.nPhrases , this.gainVal * 3 );

        this.nDO3 = new NoiseDelayOsc( this );
        this.nDO3.load( this.playbackRate * 0.5 , this.fund , [ 1 , P5 ] , this.modGainVal , this.nPhrases , this.gainVal * 1 );

    }

    startNoiseDelayOsc(){

        console.log( `playbackRate: ${this.playbackRate} , fund: ${this.fund}`);

        this.nDO1.start();
        this.nDO2.start();
        this.nDO3.start();

        this.phraseLength = (1/this.playbackRate) * 2 ;

        const now = this.globalNow;

        for( let i = 0 ; i < 10 ; i++ ){

            this.nDO1.play( now + this.phraseLength * i , now + this.phraseLength * ( i + 1 ) , randomInt( 0 , this.nDO1.nA.length ) );
            this.nDO2.play( now + this.phraseLength * i , now + this.phraseLength * ( i + 1 ) , randomInt( 0 , this.nDO2.nA.length ) );
            this.nDO3.play( now + this.phraseLength * i , now + this.phraseLength * ( i + 1 ) , randomInt( 0 , this.nDO3.nA.length ) );

        }

    }

}

class NoiseDelayOsc {

    constructor( piece ){

        this.output = new MyGain( 0 );

        this.output.connect( piece.masterGain );

        this.output.connect( piece.cGain );

    }

    load( playbackRate , fundArg , iArrayArg , modGainVal , nPhrases , gainVal ){

        // FILTERED NOISE

        const fund = fundArg;
        const iArray = iArrayArg ; // 1 , M3 , P5 , P4 , M6 , 2 , P5 * 2

        // [ 10 , 6 , 3 , 2 ]
        // [ 10 , 6 , 3 , 2 , 15 ]
        // [ 10 , 6 , 3 , 2 , 15 , 5 ]
        const nDArray = [ 10 , 6 , 3 , 2 , 15 , 5 ];

        this.nA = [];

        this.noise = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );
        this.aB = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );

        this.nG = new MyGain( modGainVal );

        for( let k = 0 ; k < nPhrases ; k++ ){

            this.nA.push( new MyBuffer2( 1 , 2 , audioCtx.sampleRate ) );

            for( let i = 0 ; i < nDArray.length ; i++ ){

                for( let j = 0 ; j < nDArray[i] ; j++ ){
    
                    this.aB.constant( 0 ).fill( 0 );
                    this.aB.sine( fund * randomArrayValue( iArray ) , 1 ).add( 0 );
                    this.aB.constant( randomFloat( 0.7 , 1 ) ).multiply( 0 );
                    this.aB.constant( randomInt( 0 , 2 ) ).multiply( 0 );
                    this.aB.ramp( ( j / nDArray[i] ) , ( ( j + 1 ) / nDArray[i] ) , 0.01 , 0.015 , 0.5 , randomFloat( 4 , 8 ) ).multiply( 0 );
        
                    this.nA[k].addBuffer( this.aB.buffer );
        
                }
    
            }

            this.nA[k].normalize( -1 , 1 );
            this.nA[k].playbackRate = playbackRate ;

            this.nA[k].connect( this.nG );

        }

        // FILTERS

        this.highpass = new MyBiquad( 'highpass' , 200 , 1 );
        this.lowshelf = new MyBiquad( 'lowshelf' , 500 , 1 );
        this.lowshelf.biquad.gain.value = -3;

        // FX

        this.c = new MyConvolver();
        this.cB = new MyBuffer2( 2 , randomFloat( 0.1 , 0.2 ) , audioCtx.sampleRate );
        this.cB.noise().fill( 0 );
        this.cB.noise().fill( 1 );
        this.cB.ramp( 0 , randomFloat( 0.5 , 1 ) , 0.01 , 0.015 , 0.1 , 5 ).multiply( 0 );
        this.cB.ramp( 0 , randomFloat( 0.5 , 1 ) , 0.01 , 0.015 , 0.1 , 5 ).multiply( 1 );

        this.c.setBuffer( this.cB.buffer );
        this.c.output.gain.value = 1;

        // OSC

        this.osc = new MyOsc( 'sine' , 0 );
        this.osc.start();

        // DRY GAIN

        this.dG = new MyGain ( 0.25 );

        // WAVESHAPER

        this.s = new MyWaveShaper();
        this.s.makeSigmoid( 2 );

        // DELAY

        this.d = new Effect();
        this.d.randomEcho();
        this.d.output.gain.value = 0.03125;
        this.d.on();

        // CONNECTIONS

        this.nG.connect( this.osc.frequencyInlet );

        this.osc.connect( this.highpass );
        this.highpass.connect( this.dG );
        this.dG.connect( this.s );
        this.s.connect( this.lowshelf );

        this.highpass.connect( this.c );
        this.c.connect( this.lowshelf );

        this.highpass.connect( this.d );
        this.d.connect( this.lowshelf );

        this.lowshelf.connect( this.output );

        this.output.gain.gain.value = gainVal;

    }

    lessOldload(){

        // FILTERED NOISE

        const fund = 432 * 4;
        const iArray = [ 1 , M3 , P5 , P4 , M6 , 2 , P5 * 2 ]; // 1 , M3 , P5 , P4 , M6 , 2 , P5 * 2

        // [ 10 , 6 , 3 , 2 ]
        // [ 10 , 6 , 3 , 2 , 15 ]
        // [ 10 , 6 , 3 , 2 , 15 , 5 ]
        const nDArray = [ 10 , 6 , 3 , 2 , 15 , 5 ];

        this.noise = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );
        this.aB = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );

        for( let i = 0 ; i < nDArray.length ; i++ ){

            for( let j = 0 ; j < nDArray[i] ; j++ ){

                this.aB.constant( 0 ).fill( 0 );
                this.aB.sine( fund * randomArrayValue( iArray ) , 1 ).add( 0 );
                this.aB.constant( randomFloat( 0.7 , 1 ) ).multiply( 0 );
                this.aB.constant( randomInt( 0 , 2 ) ).multiply( 0 );
                this.aB.ramp( ( j / nDArray[i] ) , ( ( j + 1 ) / nDArray[i] ) , 0.01 , 0.015 , 0.5 , randomFloat( 4 , 8 ) ).multiply( 0 );
    
                this.noise.addBuffer( this.aB.buffer );
    
            }

        }

        this.noise.normalize( -1 , 1 );

        this.noise.playbackRate = 0.4 ;
        this.noise.loop = true;

        bufferGraph( this.noise.buffer );

        this.noiseFilter = new MyBiquad( 'bandpass' , fund , 1 );

        // OSCILLATING DELAY

        this.oDArray = [];
        this.delayOut = new MyGain( 1 );

        for( let i = 0 ; i < iArray.length ; i++ ){

            this.oDArray[i] = new OscillatingDelay();
            this.oDArray[i].preset3( fund * iArray[i] , randomFloat( 0.1 , 0.2 ) );
            this.noise.connect( this.oDArray[i].input );
            this.oDArray[i].output.connect( this.delayOut );

        }

        // FUND FILTER

        this.fundFilter = new MyBiquad( 'notch' , fund , fund );
        this.highpass = new MyBiquad( 'highpass' , 200 , 1 );

        // FX

        this.c = new MyConvolver();
        this.cB = new MyBuffer2( 2 , randomFloat( 0.1 , 0.2 ) , audioCtx.sampleRate );
        this.cB.noise().fill( 0 );
        this.cB.noise().fill( 1 );
        this.cB.ramp( 0 , randomFloat( 0.5 , 1 ) , 0.01 , 0.015 , 0.1 , 5 ).multiply( 0 );
        this.cB.ramp( 0 , randomFloat( 0.5 , 1 ) , 0.01 , 0.015 , 0.1 , 5 ).multiply( 1 );

        this.c.setBuffer( this.cB.buffer );
        this.c.output.gain.value = 2;

        // OSC

        this.osc = new MyOsc( 'sine' , 0 );
        this.osc.start();

        this.nG = new MyGain( 432 * 1 );

        // DRY GAIN

        this.dG = new MyGain ( 0.25 );

        // WAVESHAPER

        this.s = new MyWaveShaper();
        this.s.makeSigmoid( 10 );

        // DELAY

        this.d = new Effect();
        this.d.randomEcho();
        this.d.output.gain.value = 0.03125;
        this.d.on();

        // CONNECTIONS

        // this.noise.connect( this.output );

        this.noise.connect( this.nG );
        this.nG.connect( this.osc.frequencyInlet );
        this.osc.connect( this.highpass );
        this.highpass.connect( this.dG );
        this.dG.connect( this.output );

        this.highpass.connect( this.c );
        this.c.connect( this.output );

        this.highpass.connect( this.d );
        this.d.connect( this.output );

    }

    oldLoad(){

        // FILTERED NOISE

        const fund = 432 * 0.5;

        this.noise = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.noise.noise().fill( 0 );
        this.noise.playbackRate = 0.25;
        this.noise.loop = true;

        this.noiseFilter = new MyBiquad( 'bandpass' , fund * 1 , 100 );

        // OSCILLATING DELAY

        this.oDArray = [];
        const iArray = [ 1 , M3 , P5 , P4 , M6 , 2 , P5 * 2 ];
        this.delayOut = new MyGain( 1 );

        for( let i = 0 ; i < iArray.length ; i++ ){

            this.oDArray[i] = new OscillatingDelay();
            this.oDArray[i].preset3( fund * iArray[i] , randomFloat( 0.1 , 0.2 ) );
            this.noiseFilter.connect( this.oDArray[i].input );
            this.oDArray[i].output.connect( this.delayOut );

        }

        // FUND FILTER

        this.fundFilter = new MyBiquad( 'notch' , fund , 10 );
        this.highpass = new MyBiquad( 'highpass' , 500 , 1 );

        // FX

        this.c = new MyConvolver();
        this.cB = new MyBuffer2( 2 , 0.25 , audioCtx.sampleRate );
        this.cB.noise().fill( 0 );
        this.cB.noise().fill( 1 );
        this.cB.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 4 ).multiply( 0 );
        this.cB.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 4 ).multiply( 1 );

        this.c.setBuffer( this.cB.buffer );

        // CONNECTIONS

        this.noise.connect( this.noiseFilter );

        this.delayOut.connect( this.fundFilter );
        this.fundFilter.connect( this.highpass );
        this.highpass.connect( this.output );

        this.highpass.connect( this.c );
        this.c.connect( this.output );

    }

    play( startTime , stopTime , nAIdx ){

        this.nA[nAIdx].startAtTime( startTime );
        this.nA[nAIdx].stopAtTime( stopTime );

}

    start(){

        if(this.oDArray){

            for(let i = 0 ; i < this.oDArray.length ; i++ ){

                this.oDArray[i].start();
    
            }

        }

    }

}

class OscillatingDelay {

    constructor(){

        this.input = new MyGain( 1 );
        this.output = new MyGain( 1 );

    }

    preset1( oscRate , loopRate ){

        this.delay = new MyDelay( 0 , 0 );
        
        this.delayOsc = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );

        this.delayOsc.sine( 1 , 1 ).fill( 0 );
        this.delayOsc.sine( 2 , 1 ).fill( 0 );

        this.delayOsc.normalize( -1 , 1 );

        this.delayOsc.constant( 0.5 ).multiply( 0 );
        this.delayOsc.constant( 0.5 ).add( 0 );

        this.delayOsc.constant( 0.001 ).multiply();

        this.delayOsc.playbackRate = oscRate;
        this.delayOsc.loop = true;

        // DELAY ENVELOPE

        this.delayEnvelope = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.delayEnvelope.ramp( 0 , 1 , 0.5 , 0.5 , 1 , 1 ).fill( 0 );
        this.delayEnvelope.playbackRate = loopRate;
        this.delayEnvelope.loop = true;
        
        this.delayEnvelopeGain = new MyGain( 0 );

        this.outputEnvelopeGain = new MyGain( 0 );

                                          this.delayOsc.connect( this.delayEnvelopeGain ); this.delayEnvelope.connect( this.delayEnvelopeGain.gain.gain );
        this.input.connect( this.delay ); this.delayEnvelopeGain.connect( this.delay.delay.delayTime );
        this.delay.connect( this.outputEnvelopeGain ); this.delayEnvelope.connect( this.outputEnvelopeGain.gain.gain );
        this.outputEnvelopeGain.connect( this.output );

    }

    preset2( oscRate , loopRate ){

        this.delay = new MyDelay( 0 , 0 );
        
        this.delayOsc = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.delayOsc.sine( 1 , 1 ).fill( 0 );
        this.delayOsc.constant( 0.5 ).multiply( 0 );
        this.delayOsc.constant( 0.5 ).add( 0 );

        this.delayOsc.constant( 0.001 ).multiply();

        this.delayOsc.playbackRate = oscRate;
        this.delayOsc.loop = true;

        // DELAY ENVELOPE

        this.delayEnvelope = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.delayEnvelope.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 4 ).fill( 0 );
        this.delayEnvelope.playbackRate = loopRate;
        this.delayEnvelope.loop = true;
        
        this.delayEnvelopeGain = new MyGain( 0 );

        this.outputEnvelopeGain = new MyGain( 0 );

                                          this.delayOsc.connect( this.delayEnvelopeGain ); this.delayEnvelope.connect( this.delayEnvelopeGain.gain.gain );
        this.input.connect( this.delay ); this.delayEnvelopeGain.connect( this.delay.delay.delayTime );
        this.delay.connect( this.outputEnvelopeGain ); this.delayEnvelope.connect( this.outputEnvelopeGain.gain.gain );
        this.outputEnvelopeGain.connect( this.output );

    }

    preset3( oscRate , loopRate ){

        this.delay = new MyDelay( 0 , 0 );
        
        this.delayOsc = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );

        this.delayOsc.sine( 1 , 1 ).fill( 0 );

        this.delayOsc.normalize( -1 , 1 );

        this.delayOsc.constant( 0.5 ).multiply( 0 );
        this.delayOsc.constant( 0.5 ).add( 0 );

        this.delayOsc.constant( 0.00125 ).multiply( 0 );
        this.delayOsc.constant( 0 ).add( 0 );

        this.delayOsc.playbackRate = oscRate;
        this.delayOsc.loop = true;

        // DELAY ENVELOPE

        this.delayEnvelope = new MyBuffer2( 1 , randomFloat( 1 , 2 ) , audioCtx.sampleRate );
        this.delayEnvelope.noise().fill( 0 );
        this.delayEnvelope.playbackRate = randomFloat( 0.00001 , 0.0001 );
        this.delayEnvelope.loop = true;
        
        this.delayEnvelopeGain = new MyGain( 0 );

        this.outputEnvelopeGain = new MyGain( 0 );

                                          this.delayOsc.connect( this.delayEnvelopeGain ); this.delayEnvelope.connect( this.delayEnvelopeGain.gain.gain );
        this.input.connect( this.delay ); this.delayEnvelopeGain.connect( this.delay.delay.delayTime );
        this.delay.connect( this.outputEnvelopeGain ); this.delayEnvelope.connect( this.outputEnvelopeGain.gain.gain );
        this.outputEnvelopeGain.connect( this.output );

    }

    preset4( oscRate , loopRate ){

        this.delay = new MyDelay( 0 , 0 );
        
        this.delayOsc = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );

        this.delayOsc.sine( 1 , 1 ).fill( 0 );

        this.delayOsc.normalize( -1 , 1 );

        this.delayOsc.constant( 0.5 ).multiply( 0 );
        this.delayOsc.constant( 0.5 ).add( 0 );

        this.delayOsc.constant( 0.0025 ).multiply( 0 );
        this.delayOsc.constant( 0.5 ).add( 0 );

        this.delayOsc.playbackRate = oscRate;
        this.delayOsc.loop = true;

        // DELAY ENVELOPE

        this.delayEnvelope = new MyBuffer2( 1 , randomFloat( 1 , 2 ) , audioCtx.sampleRate );
        this.delayEnvelope.noise().fill( 0 );
        this.delayEnvelope.playbackRate = randomFloat( 0.00001 , 0.0001 );
        this.delayEnvelope.loop = true;
        
        this.delayEnvelopeGain = new MyGain( 0 );

        this.outputEnvelopeGain = new MyGain( 0 );

                                          this.delayOsc.connect( this.delayEnvelopeGain ); this.delayEnvelope.connect( this.delayEnvelopeGain.gain.gain );
        this.input.connect( this.delay ); this.delayEnvelopeGain.connect( this.delay.delay.delayTime );
        this.delay.connect( this.outputEnvelopeGain ); this.delayEnvelope.connect( this.outputEnvelopeGain.gain.gain );
        this.outputEnvelopeGain.connect( this.output );

    }

    start(){

        this.delayOsc.start();
        this.delayEnvelope.start();

    }

}