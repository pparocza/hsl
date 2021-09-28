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

        // TONE CONVOLVER
        this.cGain = new MyGain( 1 );

        this.c = new MyConvolver();
        this.cB = new MyBuffer2( 2 , 2 , audioCtx.sampleRate );

        this.cB.sine( 432 , 1 ).fill( 0 );
        this.cB.sine( 432 * 0.5 , 1 ).fill( 1 );
        this.cB.ramp( 0 , 1 , 0.5 , 0.6 , 0.1 , 0.1 ).multiply( 0 );
        this.cB.ramp( 0 , 1 , 0.8 , 0.9 , 0.1 , 0.1 ).multiply( 1 );

        this.c.setBuffer( this.cB.buffer );

        this.cGain.connect( this.c );
        this.c.connect( this.masterGain );

        this.c.output.gain.value = 1;

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

        this.output.connect( piece.cGain );

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