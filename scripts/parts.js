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
        this.rC1 = new RampingConvolver( this.globalNow );
        this.rC2 = new RampingConvolver( this.globalNow + 10 );
        this.rC3 = new RampingConvolver( this.globalNow + 20 );
        this.rC4 = new RampingConvolver( this.globalNow );


        this.cGain.connect( this.rC1.input );
        this.rC1.output.connect( this.masterGain );

        this.cGain.connect( this.rC2.input );
        this.rC2.output.connect( this.masterGain );

        this.cGain.connect( this.rC2.input );
        this.rC3.output.connect( this.masterGain );
/*
        this.cGain.connect( this.rC2.input );
        this.rC4.output.connect( this.masterGain );
*/
    }

    load(){


    }

    start(){

        this.fadeFilter.start(1, 50);
		this.globalNow = audioCtx.currentTime;

    }

    stop() {

        this.fadeFilter.start(0, 20);
        startButton.innerHTML = "reset";

    }

}

class RampingConvolver{

    constructor( startTime ){

        this.input = new MyGain( 1 );
        this.output = new MyGain( 1 );

        this.c = new MyConvolver();
        this.cB = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );
        this.cAB = new MyBuffer2( 1 , 2 , audioCtx.sampleRate );

        const iArray = [ 1 , M2 , M3 , P4 , P5 , M6 , 2 ];
        const oArray = [ 1 , 0.5 , 2 ];
        const fund = 432 * 1;

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
        this.noise.playbackRate = 0.25;
        this.noise.loop = true;
        this.noise.output.gain.value = 0.1;
        this.noise.startAtTime( startTime );

        this.noise.connect( this.c );

        // DELAY

        this.d = new Effect();
        this.d.randomEcho();
        this.d.on();

        this.input.connect( this.c );
        this.c.connect( this.output );

        this.c.connect( this.d );
        this.d.connect( this.output );

        this.c.output.gain.value = 1;

    }

}