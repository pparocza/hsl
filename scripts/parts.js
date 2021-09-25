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

        this.noisePanSection = new  NoisePanSection( this );
        this.noisePanSection.load();

    }

    start(){

        this.fadeFilter.start(1, 50);
		this.globalNow = audioCtx.currentTime;

        const rate = 12;
        const startArray = [ 0 , 10 , 20 ];
        shuffle( startArray );

        this.noisePanSection.start( this.globalNow + 0 , this.globalNow + 30 , rate );

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
        this.nP1.load( 0.25 );

        this.nP2 = new NoisePan( this.piece );
        this.nP2.load( 0.0625 );

        this.nP3 = new NoisePan( this.piece );
        this.nP3.load( 0.125 );

    }

    start( startTime , stopTime , rate ){

        let filterRange1 = [ 100 , 500 ];
        let filterRange2 = [ 1000 , 5000 ];
        let filterRange3 = [ 500 , 1000 ];

        this.nP1.start( startTime , stopTime , rate , filterRange1 );
        this.nP2.start( startTime , stopTime , rate , filterRange2 );
        this.nP3.start( startTime , stopTime , rate , filterRange3 );

    }

}

class NoisePan extends NoisePanSection {

    constructor( piece ){

        super();

        this.output = new MyGain( 1 );

        this.output.connect( piece.masterGain );

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

    start( startTime , stopTime , rate , filterRange ){

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