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

        this.rC1 = new RampingConvolver( this );
        this.rC2 = new RampingConvolver( this );
        this.rC3 = new RampingConvolver( this );

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
            0.125 , 
            // noiseRate
            0.25 , 
            // gain
            3 
        );

        this.rC1.output.connect( this.masterGain );
        this.rC2.output.connect( this.masterGain );
        this.rC3.output.connect( this.masterGain );

    }

    startRampingConvolvers(){

        this.rC1.start( this.globalNow , this.globalNow + 80 );
        this.rC2.start( this.globalNow + 30 , this.globalNow + 80 );
        this.rC3.start( this.globalNow + 20 , this.globalNow + 80 );

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