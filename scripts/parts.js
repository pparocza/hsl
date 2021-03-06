class Piece {
    
    constructor(){

    }

    initMasterChannel(){

        this.globalNow = 0;

        this.gain = audioCtx.createGain();
        this.gain.gain.value = 2;
    
        this.fadeFilter = new FilterFade(0);

        this.hp = new MyBiquad( 'highpass' , 30.225 , 0.581 );
        this.ls = new MyBiquad( 'lowshelf' , 695.22 , 1 );
        this.ls.biquad.gain.value = -2.67;
        this.ls2 = new MyBiquad( 'lowshelf' , 162.24 , 1 );
        this.ls2.biquad.gain.value = -3.13;
        this.f = new MyBiquad( 'peaking' , 279.5 , 1.586 );
        this.f.biquad.gain.value = -2.20;
        this.f2 = new MyBiquad( 'peaking' , 2557.9 , 1 );
        this.f2.biquad.gain.value = 1.38;
    
        this.masterGain = audioCtx.createGain();
        this.masterGain.connect( this.hp.input );
        this.hp.connect( this.ls );
        this.ls.connect( this.ls2 );
        this.ls2.connect( this.f );
        this.f.connect( this.gain );
        this.gain.connect( this.fadeFilter.input );
        this.fadeFilter.connect( audioCtx.destination );

    }

    initFXChannels(){

        // REVERB

            this.reverbSend = new MyGain( 1 );

            this.c = new MyConvolver();
            this.cB = new MyBuffer2( 2 , 2 , audioCtx.sampleRate );
            this.cB.noise().fill( 0 );
            this.cB.noise().fill( 1 );
            this.cB.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 4 ).multiply( 0 );
            this.cB.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 4 ).multiply( 1 );
            this.c.output.gain.value = 1;

            this.c.setBuffer( this.cB.buffer );

            this.reverbSend.connect( this.c );
            this.c.connect( this.masterGain );

    }

    load(){

        this.loadRampingConvolvers();

    }

    loadRampingConvolvers(){

        const fund = randomFloat( 225 , 325 ); // 300
        const iArray = [ 1 , M2 , P4 , P5 , M6 ];
        const iArray2 = [ 1 , M3 , P5 , 1/M2 , M6 ];
        this.globalRate = 0.125;

        this.rC1 = new RampingConvolver( this );
        this.rC2 = new RampingConvolver( this );
        this.rC3 = new RampingConvolver( this );
        this.rC4 = new RampingConvolver( this );
        this.rC5 = new RampingConvolver( this );

        this.rC1.load( 
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
            2 , 
            // fmCFreq , fmMFreq
            randomFloat( 1 , 5 ) , randomFloat( 1 , 5 ) ,  
            // oscillationRate
            this.globalRate , 
            // noiseRate
            0.25 , 
            // gain
            16 
        );

        this.rC2.load( 
            // fund
            fund , 
            // bufferLength
            1 , 
            // intervalArray
            iArray , 
            // octaveArray
            [ 1 , 0.5 , 2 , 0.25 , 4 ] ,
            // cFreq 
            12000 , 
            // bandwidth
            11750 , 
            // Q
            4 , 
            // fmCFreq , fmMFreq
            randomInt( 1 , 10 ) , randomInt( 1 , 10 ) ,  
            // oscillationRate
            this.globalRate , 
            // noiseRate
            0.25 , 
            // gain
            8 
        );

        this.rC3.load(
            // fund
            fund , 
            // bufferLength
            0.25 , 
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
            this.globalRate , 
            // noiseRate
            0.25 , 
            // gain
            5 
        );

        this.rC4.load(
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
            2 , 
            // fmCFreq , fmMFreq
            randomInt( 1 , 10 ) , randomInt( 1 , 10 ) ,  
            // oscillationRate
            this.globalRate * 0.5 , 
            // noiseRate
            0.25 , 
            // gain
            8 
        );

        this.rC5.load(
            // fund
            fund * 2 , 
            // bufferLength
            1, 
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
            this.globalRate, 
            // noiseRate
            0.25 , 
            // gain
            8 
        );

        this.rC1.output.connect( this.masterGain );
        this.rC2.output.connect( this.masterGain );
        this.rC3.output.connect( this.masterGain );
        this.rC4.output.connect( this.masterGain );
        this.rC5.output.connect( this.masterGain );

    }

    startRampingConvolvers(){

        this.phraseLength = 1 / this.globalRate;

        this.rC1.start( this.globalNow + this.phraseLength * 0  , this.globalNow + this.phraseLength * 8 );
        this.rC3.start( this.globalNow + this.phraseLength * 4  , this.globalNow + this.phraseLength * 8 );
        this.rC5.start( this.globalNow + this.phraseLength * 6  , this.globalNow + this.phraseLength * 8 );

        this.rC2.start( this.globalNow + this.phraseLength * 8  , this.globalNow + this.phraseLength * 16 );
        this.rC4.start( this.globalNow + this.phraseLength * 10 , this.globalNow + this.phraseLength * 16 );

        this.rC1.start( this.globalNow + this.phraseLength * 12 , this.globalNow + this.phraseLength * 16 );
        this.rC3.start( this.globalNow + this.phraseLength * 15  , this.globalNow + this.phraseLength * 16 );

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

}

class RampingConvolver extends Piece{

    constructor( piece ){

        super();

        this.output = new MyGain( 1 );

        this.output.connect( piece.masterGain );
        this.output.connect( piece.reverbSend );

    }

    load( fund , bufferLength , iArray , oArray , centerFrequency , bandwidth , Q , fmCFreq , fmMFreq , oscillationRate , noiseRate , gainVal ){

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

            this.nOG = new MyGain( bandwidth );

            this.nO.connect( this.nOG );
            this.nOG.connect( this.nF.biquad.frequency );
            this.noise.connect( this.nF );
            this.nF.connect( this.c );

        // DELAY

            this.d = new Effect();
            this.d.randomEcho();
            this.d.on();

        // WAVESHAPER

            this.s = new MyWaveShaper();
            this.s.makeSigmoid( 10 );

        // CONNECTIONS

        this.c.connect( this.output );

        this.c.connect( this.d );
        this.c.connect( this.s );

        this.c.connect( this.output );
        this.d.connect( this.output );
        // this.s.connect( this.output );

        this.c.output.gain.value = gainVal;

    }

    start( startTime , stopTime){

        this.noise.startAtTime( startTime );
        this.nO.startAtTime( startTime );

        this.noise.stopAtTime( stopTime );
        this.nO.stopAtTime( stopTime );

    }

}