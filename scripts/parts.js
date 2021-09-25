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

        this.filterTickSection = new FilterTickSection( this );
        this.filterTickSection.load();

        this.noisePanSection = new  NoisePanSection( this );
        this.noisePanSection.load();

        this.noiseTickSection = new  NoiseTickSection( this );
        this.noiseTickSection.load();

    }

    start(){

        this.fadeFilter.start(1, 50);
		this.globalNow = audioCtx.currentTime;

        const rate = 12;
        const startArray = [ 0 , 10 , 20 ];
        shuffle( startArray );
        console.log( startArray );

        this.filterTickSection.start( rate , this.globalNow + startArray[ 0 ] , this.globalNow + 30 );
        this.noisePanSection.start( rate , this.globalNow + startArray[ 1 ] , this.globalNow + 30 );
        this.noiseTickSection.start( rate , this.globalNow + startArray[ 2 ] , this.globalNow + 30 );

    }

    stop() {

        this.fadeFilter.start(0, 20);
        startButton.innerHTML = "reset";

    }

}

class FilterTickSection extends Piece {

    constructor( piece ){

        super();

        this.piece = piece;

    }

    load(){

        this.fT1 = new FilterTick( this.piece );
        this.fT1.load();

    }

    start( rate , startTime , stopTime ){

        this.fT1.start( rate , startTime , stopTime );

    }

}

class NoisePanSection extends Piece {

    constructor( piece ){

        super();

        this.piece = piece;

    }

    load(){

        this.nP1 = new NoisePan( this.piece );
        this.nP1.load( 0.0625 );

    }

    start( rate , startTime , stopTime ){

        this.nP1.start( rate , startTime , stopTime );

    }

}

class NoiseTickSection extends Piece {

    constructor( piece ){

        super();

        this.piece = piece;

    }

    load(){

        this.nT1 = new NoiseTick( this.piece );
        this.nT1.load( 0.5 );

    }

    start( rate , startTime , stopTime ){

        this.nT1.start( rate , startTime , stopTime );

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

    start( rate , startTime , stopTime ){

        this.noise.playbackRate = rate;
        this.noise.startAtTime( startTime );
        let time = 0;

        for( let i = 0 ; i < 1000 ; i++ ){

            time = startTime + ( i / rate );

            if( time < stopTime ){

                this.pan.setPositionAtTime( randomArrayValue( [ randomFloat( -1 , -0.6 ) , randomFloat( 0.6 , 1 ) ] ) , time );
                this.filter.biquad.frequency.setValueAtTime( randomFloat( 3000 , 8000 ) , time );
                this.noise.output.gain.setValueAtTime( randomArrayValue( [ 0 , 1 , 1 , 1 , 1 , 1 ] ) , time );

            }

        }

        this.noise.stopAtTime( stopTime );

    }

}

class FilterTick extends FilterTickSection {

    constructor( piece ){

        super();

        this.output = new MyGain( 1 );

        this.output.connect( piece.masterGain );

    }

    load(){

        this.tick = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.tick.sawtooth( 8 ).add( 0 );
        this.tick.loop = true;

        this.filter = new MyBiquad( 'bandpass' , 300 , 1 );

        this.pan = new MyPanner2( -1 );

        this.tick.connect( this.filter );
        this.filter.connect( this.pan );
        this.pan.connect( this.output );
    }

    start( rate , startTime , stopTime ){

        this.tick.playbackRate = rate;
        this.tick.startAtTime( startTime );
        let time = 0;

        for( let i = 0 ; i < 1000 ; i++ ){

            time = startTime + ( i / rate );

            if( time < stopTime ){

                this.filter.biquad.frequency.setValueAtTime( randomFloat( 100 , 5000 ) , time );
                this.pan.setPositionAtTime( randomArrayValue( [ randomFloat( -1 , -0.6 ) , randomFloat( 0.6 , 1 ) ] ) , time );
                this.tick.output.gain.setValueAtTime( randomArrayValue( [ 0 , 1 , 1 , 1 , 1 , 1 ] ) , time );

            }

        }

        this.tick.stopAtTime( stopTime );

    }

}

class NoiseTick extends NoiseTickSection {

    constructor( piece ){

        super();

        this.output = new MyGain( 1 );

        this.output.connect( piece.masterGain );

    }

    load( gainVal ){

        this.noise = new MyBuffer2( 1 , 1 , audioCtx.sampleRate );
        this.noise.noise().fill(0);
        this.noise.ramp( 0.01 , 0.02 , 0 , 1 , 0.1 , 0.1 ).multiply( 0 );
        this.noise.loop = true;

        this.filter = new MyBiquad( 'bandpass' , 0 , 1 );

        this.pan = new MyPanner2( -1 );

        this.noise.connect( this.filter );
        this.filter.connect( this.pan );
        this.pan.connect( this.output );

        this.output.gain.gain.value = gainVal;

    }

    start( rate , startTime , stopTime ){

        this.noise.playbackRate = rate;
        this.noise.startAtTime( startTime );
        let time = 0;

        for( let i = 0 ; i < 1000 ; i++ ){

            time = startTime + ( i / rate );

            if( time < stopTime ){

                this.pan.setPositionAtTime( randomArrayValue( [ randomFloat( -1 , -0.6 ) , randomFloat( 0.6 , 1 ) ] ) , time );
                this.filter.biquad.frequency.setValueAtTime( randomInt( 7000 , 10000 ) , time );
                this.noise.output.gain.setValueAtTime( randomArrayValue( [ 0 , 1 ] ) , time );

            }

        }

        this.noise.stopAtTime( stopTime );

    }

}