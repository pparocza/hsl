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

        // RAMPING CONVOLVER

        this.cGain = new MyGain( 1 );
        this.rC1 = new RampingConvolver( 1 );
        this.rC2 = new RampingConvolver( -1 );

        this.cGain.connect( this.rC1.input );
        this.rC1.output.connect( this.masterGain );

        this.cGain.connect( this.rC2.input );
        this.rC2.output.connect( this.masterGain );

    }

    load(){

        this.noisePanSection = new  NoisePanSection( this );
        this.noisePanSection.load();

    }

    start(){

        this.fadeFilter.start(1, 50);
		this.globalNow = audioCtx.currentTime;

        this.noisePanSection.start();

    }

    stop() {

        this.fadeFilter.start(0, 20);
        startButton.innerHTML = "reset";

    }

}

class NoisePanSection extends Piece {

    constructor( piece ){

        super();

        this.piece = piece;

    }

    load(){

        this.nP1 = new NoisePan( this.piece );
        this.nP1.load( 0.125 );

        this.nP2 = new NoisePan( this.piece );
        this.nP2.load( 0.125 );

        this.nP3 = new NoisePan( this.piece );
        this.nP3.load( 0.125 );

    }

    start(){

        const rate = 12;

        const filterRangeArray = [
            [ 5000 , 8000 ] ,
            [ 200 , 500 ] ,
            [ 1000 , 3000 ]
        ]

        shuffle( filterRangeArray );

        this.nP1.start( rate , filterRangeArray[ 0 ] , 0  , piece.globalNow + 30 );
        this.nP2.start( rate , filterRangeArray[ 1 ] , 10 , piece.globalNow + 30 );
        this.nP3.start( rate , filterRangeArray[ 2 ] , 15 , piece.globalNow + 30 );

    }

}

class NoisePan extends NoisePanSection {

    constructor( piece ){

        super();

        this.output = new MyGain( 1 );

        this.output.connect( piece.masterGain );

        // this.output.connect( piece.cGain );

    }

    load( gainVal ){

        this.noise = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.noise.noise().fill(0);
        this.noise.ramp( 0.01 , 0.4 , 0 , 1 , 0.1 , 0.1 ).multiply( 0 );
        this.noise.loop = true;

        this.filter = new MyBiquad( 'bandpass' , 3000 , 1 );

        this.pan = new MyPanner2( -1 );

        this.noise.connect( this.filter );
        this.filter.connect( this.pan );
        this.pan.connect( this.output );

        this.output.gain.gain.value = gainVal;

    }

    start( rate , filterRange , startTime , stopTime ){

        this.noise.playbackRate = rate;
        this.noise.startAtTime( startTime );
        let time = 0;

        for( let i = 0 ; i < 1000 ; i++ ){

            time = startTime + ( i / rate );

            if( time < stopTime ){

                this.pan.setPositionAtTime( randomArrayValue( [ randomFloat( -1 , -0.6 ) , randomFloat( 0.6 , 1 ) ] ) , time );
                this.filter.biquad.frequency.setValueAtTime( randomFloat( filterRange[ 0 ] , filterRange[ 1 ] ) , time );
                this.noise.output.gain.setValueAtTime( randomArrayValue( [ 0 , 1 , 1 , 1 , 1 , 1 ] ) , time );

            }

        }

        this.noise.stopAtTime( stopTime );

    }

}

class RampingConvolver{

    constructor( panValue ){

        this.input = new MyGain( 1 );
        this.output = new MyGain( 1 );

        this.c = new MyConvolver();
        this.cB = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );
        this.cAB = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );

        const iArray = [ 1 , M2 , M3 , P4 , P5 , M6 , 2 ];
        const oArray = [ 1 , 0.5 , 0.25 ];
        const fund = 432 * 2;

        let interval = 0;
        let o = 0;
        let p = 0;

        for( let i = 0 ; i < 10 ; i++ ){

            interval = randomArrayValue( iArray );
            o = randomArrayValue( oArray );
            p = randomFloat( 0.1 , 0.9 );

            this.cAB.fm( fund * interval * o , fund * interval * o , 0.25 ).add( 0 );
            this.cAB.ramp( p , p + 0.1 , 0.5 , 0.5 , 0.1 , 0.1 ).multiply( 0 );

            this.cB.addBuffer( this.cAB.buffer );

        }

        this.cB.normalize( -1 , 1 );

        this.c.setBuffer( this.cB.buffer );

        this.cR = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.cR.sawtooth( 1 ).fill( 0 );
        this.cR.loop = true;
        this.cR.playbackRate = 0.25;

        this.cG = new MyGain( 0 );

        this.cIB = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.cIB.ramp( 0 , 1 , 0.01 , 0.015 , 0.1 , 8 ).fill( 0 );
        this.cIB.playbackRate = 0.5;
        this.cIB.loop = true;
    
        this.cIG = new MyGain( 0 );

        this.p = new MyPanner2( panValue );

        this.input.connect( this.cIG ); this.cIB.connect( this.cIG.gain.gain );
        this.cIG.connect( this.c );
        this.c.connect( this.cG ); this.cR.connect( this.cG.gain.gain );
        this.cG.connect( this.p );
        this.p.connect( this.output );

        this.c.output.gain.value = 14;

        this.cIB.start();
        this.cR.start();

    }

}