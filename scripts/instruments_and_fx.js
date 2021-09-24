// template for an instrument or effect object
function InstrumentConstructorTemplate(){

	this.output = audioCtx.createGain();

}

InstrumentConstructorTemplate.prototype = {

	output: this.output,

	connect: function(audioNode){
		if (audioNode.hasOwnProperty('input') == 1){
			this.output.connect(audioNode.input);
		}
		else {
			this.output.connect(audioNode);
		}
	},

}

//--------------------------------------------------------------

// EFFECT

//--------------------------------------------------------------

// object within which to design signal-processing chains, which are
// stored as methods
function Effect(){

	this.input = audioCtx.createGain();
	this.filterFade = new FilterFade(0);
	this.output = audioCtx.createGain();
	this.startArray = [];

	this.input.connect(this.filterFade.input);

}

Effect.prototype = {

	input: this.input,
	output: this.output,
	filterFade: this.filterFade,
	startArray: this.startArray,

	// effect preset template
	effectMethod: function(){
		this.startArray = [];
	},

	// preset 1
	thru: function(){

		this.filterFade.connect(this.output);

	},

	// preset 2
	stereoDelay: function(delayL, delayR, fb){

		this.delayL = delayL;
		this.delayR = delayR;
		this.fb = fb;

		this.dly = new MyStereoDelay(this.delayL, this.delayR, this.fb, 1);

		this.filterFade.connect(this.dly);
		this.dly.connect(this.output);

	},

	// preset 3
	noiseAM: function(min, max, rate, lpFreq){

		this.min = min;
		this.max = max;
		this.rate = rate;
		this.lpFreq = lpFreq;

		this.l = new LFO(this.min, this.max, this.rate);
		this.l.buffer.makeUnipolarNoise();
		this.lp = new MyBiquad("lowpass", this.lpFreq, 1);
		this.g = new MyGain(0);

		this.filterFade.connect(this.g); this.l.connect(this.g.gain.gain);
		this.g.connect(this.output);

		this.startArray = [this.l];

	},

	// preset 4
	fmShaper: function(cFreq, mFreq, bW, mGain){

		this.cFreq = cFreq;
		this.mFreq = mFreq;
		this.bW = bW;
		this.mGain = mGain;

		this.w = new MyWaveShaper();
		this.w.makeFm(this.cFreq, this.mFreq, this.bW);
		this.wG = new MyGain(this.mGain);

		this.f = new MyBiquad("highpass", 10, 1);

		this.filterFade.connect(this.wG);
		this.wG.connect(this.w);
		this.w.connect(this.f);
		this.f.connect(this.output);

	},

	// preset 5
	amShaper: function(cFreq, mFreq, mGain){

		this.cFreq = cFreq;
		this.mFreq = mFreq;
		this.mGain = mGain;

		this.w = new MyWaveShaper();
		this.w.makeAm(this.cFreq, this.mFreq, 1);
		this.wG = new MyGain(this.mGain);

		this.filterFade.connect(this.wG);
		this.wG.connect(this.w);
		this.w.connect(this.output);

	},

	// presett 6
	randomShortDelay: function(){

		this.dly = new MyStereoDelay(randomFloat(0.01, 0.035), randomFloat(0.01, 0.035), randomFloat(0, 0.1), 1);

		this.filterFade.connect(this.dly);
		this.dly.connect(this.output);

	},

	// preset 7
	randomEcho: function(){

		this.dly = new MyStereoDelay(randomFloat(0.35, 0.6), randomFloat(0.35, 0.6), randomFloat(0, 0.2), 1);

		this.filterFade.connect(this.dly);
		this.dly.connect(this.output);

	},

	// preset 8
	randomSampleDelay: function(){

		this.s = 1/audioCtx.sampleRate;

		this.dly = new MyStereoDelay(randomInt(this.s, this.s*100), randomInt(this.s, this.s*100), randomFloat(0.3, 0.4), 1);

		this.filterFade.connect(this.dly);
		this.dly.connect(this.output);

	},

	// preset 9
	filter: function(type, freq, Q){

		this.type = type;
		this.freq = freq;
		this.Q = Q;

		this.f = new MyBiquad(this.type, this.freq, this.Q);
		this.filterFade.connect(this.f);

		this.f.connect(this.output);

	},

	// filterFade to switchVal
	switch: function(switchVal){

		this.switchVal = switchVal;

		this.filterFade.start(this.switchVal, 30);

	},

	// filterFade to switchVal at specified time (in seconds)
	switchAtTime: function(switchVal, time){

		this.switchVal = switchVal;
		this.time = time;

		this.filterFade.startAtTime(this.switchVal, 20, this.time);


	},

	// specify a sequence of values to filterFade to
	switchSequence: function(valueSequence, timeSequence){

		this.valueSequence = valueSequence;
		this.timeSequence = timeSequence;
		this.v;
		this.j=0;

		for(var i=0; i<timeSequence.length; i++){
			this.v = this.valueSequence[this.j%this.valueSequence.length];
			this.filterFade.startAtTime(this.v, 20, this.timeSequence[i]);
			this.j++;
		}

	},

	// turn the effect on immdiately
	on: function(){

		this.filterFade.start(1, 30);

	},

	// turn the effect off immediately
	off: function(){

		this.filterFade.start(0, 20);

	},

	// turn the effect on at the specified time (in seconds)
	onAtTime: function(time){

		this.time = time;

		this.filterFade.startAtTime(1, 20, this.time);

	},

	// turn the effect off at the specified time (in seconds)
	offAtTime: function(time){

		this.time = time;

		this.filterFade.startAtTime(0, 20, this.time);

	},

	// start the effect immediately
	start: function(){

		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].start();
		}

	},

	// stop the effect immediately
	stop: function(){

		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].stop();
		}

	},

	// start the effect at the specified time (in seconds)
	startAtTime: function(time){

		this.time = time;

			for(var i=0; i<startArray.length; i++){
				this.startArray[i].startAtTime(this.time);
			}

	},

	// stop the effect at the specified time (in seconds)
	stopAtTime: function(time){

		this.time = time;

			for(var i=0; i<startArray.length; i++){
				this.startArray[i].stopAtTime(this.time);
			}

	},

	// connect the output node of this object to the input of another
	connect: function(audioNode){
		if (audioNode.hasOwnProperty('input') == 1){
			this.output.connect(audioNode.input);
		}
		else {
			this.output.connect(audioNode);
		}
	},

}

//--------------------------------------------------------------

// INSTRUMENT

//--------------------------------------------------------------

// object within which to design signal-generating chains, which are
// stored as methods
function Instrument(){

	this.input = audioCtx.createGain();
	this.output = audioCtx.createGain();
	this.startArray = [];

}

Instrument.prototype = {

	input: this.input,
	output: this.output,
	startArray: this.startArray,

	// instrument preset template
	instrumentMethod: function(){
		this.startArray = [];
	},

	// preset 1
	bPS: function(rate, tArray, gainVal){

		this.rate = rate;
		this.tArray = tArray;
		this.gainVal = gainVal;

		this.output.gain.value = gainVal;

		// BREAKPOINT ENVELOPE ARRAY

			this.sL = this.tArray.length*2;

			this.tS = new Sequence();
			this.tS.loop(this.sL, this.tArray);
			this.tS.palindrome();
			this.tS.bipolar();
			this.tS.join([0]);

			this.dS = new Sequence();
			this.dS = this.dS.duplicates(this.tS.sequence.length, 1/this.tS.sequence.length,);

			this.eArray = this.tS.lace(this.dS);

		// BREAKPOINT EXPONENT ARRAY

			this.expArray1 = new Sequence();
			this.expArray1.randomInts(this.eArray.length/2, 14, 54);
			this.expArray2 = new Sequence();
			this.expArray2.randomFloats(this.eArray.length/2, 0.1, 0.991);

			this.expArray = this.expArray1.lace(this.expArray2.sequence);

		// BREAKPOINT

			this.bP = new BreakPoint(this.eArray, this.expArray);
			this.bP.loop = true;
			this.bP.playbackRate = this.rate;

		// SHAPER

			this.s = new MyWaveShaper();
			this.s.makeFm(107, 20, 1);
			this.sG = new MyGain(0.1);

		// FILTERS

			this.f1 = new MyBiquad("highshelf", 3000, 1);
			this.f1.biquad.gain.value = -8;
			this.f2 = new MyBiquad("lowpass", 3000, 1);
			this.f3 = new MyBiquad("highpass", 5, 1);

		// SHAPER

			this.w = new MyWaveShaper();
			this.w.makeSigmoid(5);
			this.wD = new MyStereoDelay(randomFloat(0.001, 0.01), randomFloat(0.001, 0.01), 0.1, 1);
			this.wD.output.gain.value = 0.2;

		// CONNECTIONS
			/*
			this.bP.connect(this.sG);

			this.sG.connect(this.s);
			this.s.connect(this.f1);
			this.f1.connect(this.f2);
			this.f2.connect(this.f3);

			this.f2.connect(this.w);
			this.w.connect(this.wD);
			this.wD.connect(this.f3);

			this.f3.connect(this.output);
			*/

			this.bP.connect(this.output);

		// STARTS

			this.startArray = [this.bP];

	},

	// preset 2
	lTone: function(fund){

		this.fund = fund;

		this.d2O = new LFO(0, 1, this.fund);
		this.d2O.buffer.makeUnipolarSine();
		this.d2OF = new MyBiquad("lowpass", 20000, 1);
		this.d2OF.output.gain.value = 0.5;
		this.d2OW = new Effect();
		this.d2OW.fmShaper(this.fund, this.fund*2, 1, 0.0006);
		this.d2OW.on();

		this.p = new MyPanner2(randomFloat(-0.25, 0.25));
		this.p.output.gain.value = 1;

		this.t = new Effect();
		this.t.thru();
		this.t.on();

		this.dR = new Effect();
		this.dR.randomShortDelay();
		this.dR.output.gain.value = 0.3;
		this.dR.on();

		this.dE = new Effect();
		this.dE.randomEcho();
		this.dE.output.gain.value = 0.3;
		this.dE.on();

		this.d2O.connect(this.d2OF);
		this.d2OF.connect(this.d2OW);
		this.d2OW.connect(this.p);
		this.p.connect(this.t);

		this.t.connect(this.dR);
		this.dR.connect(this.dE);

		this.t.connect(this.output);
		this.dR.connect(this.output);
		this.dE.connect(this.output);

		this.d2O.start();

	},

	// start instrument immediately
	start: function(){
		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].start();
		}
	},

	// stop instrument immediately
	stop: function(){
		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].stop();
		}
	},

	// start instrument at specified time (in seconds)
	startAtTime: function(time){

		this.time = time;

		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].startAtTime(this.time);
		}

	},

	// stop instrument at specified time (in seconds)
	stopAtTime: function(time){

		this.time = time;

		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].stopAtTime(this.time);
		}

	},

	// connect the output node of this object to the input of another
	connect: function(audioNode){
		if (audioNode.hasOwnProperty('input') == 1){
			this.output.connect(audioNode.input);
		}
		else {
			this.output.connect(audioNode);
		}
	},

}

//--------------------------------------------------------------

// PRESETS (3)
//  - objects for storing commonly used configurations of certain nodes

//--------------------------------------------------------------

// collection of commonly used configurations of MyBuffer
function BufferPreset(){

	this.output = audioCtx.createGain();

	this.playbackRateInlet = new MyGain(1);

}

BufferPreset.prototype = {

	output: this.output,
	myBuffer: this.myBuffer,
	buffer: this.buffer,
	playbackRate: this.playbackRate,
	loop: this.loop,

	playbackRateInlet: this.playbackRateInlet,

	// preset template
	presetTemplate: function(){

		this.myBuffer = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.buffer = this.myBuffer.buffer;

	},

	// preset 1
	harmonicSeries: function(nHarmonics){

		this.nHarmonics = nHarmonics;

		this.myBuffer = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.buffer = this.myBuffer.buffer;
		this.myBuffer.makeConstant(0);

		for(var i=0; i<this.nHarmonics; i++){
			this.myBuffer.addSine(i+1, 1/(i+1));
		}

		this.myBuffer.normalize(-1, 1);

	},

	// preset 2
	additiveSynth: function(hArray, gArray){

		this.hArray = hArray;
		this.gArray = gArray;

		this.myBuffer = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.buffer = this.myBuffer.buffer;
		this.myBuffer.makeConstant(0);

		for(var i=0; i<this.hArray.length; i++){
			this.myBuffer.addSine(this.hArray[i], this.gArray[i]);
		}

		this.myBuffer.normalize(-1, 1);

	},

	// start buffer immediately
	start: function(){
		this.bufferSource = audioCtx.createBufferSource();
		this.bufferSource.loop = this.loop;
		this.bufferSource.playbackRate.value = this.playbackRate;
		this.bufferSource.buffer = this.buffer;
		this.playbackRateInlet.connect(this.bufferSource.playbackRate);
		this.bufferSource.connect(this.output);
		this.bufferSource.start();
	},

	// stop buffer immediately
	stop: function(){
		this.bufferSource.stop();
	},

	// start buffer at specified time (in seconds)
	startAtTime: function(time){

		this.time = time;

		this.bufferSource = audioCtx.createBufferSource();
		this.bufferSource.loop = this.loop;
		this.bufferSource.playbackRate.value = this.playbackRate;
		this.bufferSource.buffer = this.buffer;
		this.playbackRateInlet.connect(this.bufferSource.playbackRate);
		this.bufferSource.connect(this.output);
		this.bufferSource.start(this.time);

	},

	// stop buffer at specified time (in  seconds)
	stopAtTime: function(time){

		this.time = time;

		this.bufferSource.stop(this.time);

	},

	// connect the output node of this object to the input of another
	connect: function(audioNode){
		if (audioNode.hasOwnProperty('input') == 1){
			this.output.connect(audioNode.input);
		}
		else {
			this.output.connect(audioNode);
		}
	},

}

//--------------------------------------------------------------

// collection of commonly used configurations of MyConvolver
function ConvolverPreset(){

	this.input = audioCtx.createGain();
	this.output = audioCtx.createGain();

}

ConvolverPreset.prototype = {

	input: this.input,
	output: this.output,
	convolver: this.convolver,

	// preset 1
	noiseReverb: function(length, decayExp){

		this.length = length;
		this.decayExp = decayExp;

		this.convolver = new MyConvolver(2, this.length, audioCtx.sampleRate);
		this.convolver.makeNoise();
		this.convolver.applyDecay(this.decayExp);

		this.input.connect(this.convolver.input);
		this.convolver.connect(this.output);

		this.buffer = this.convolver.buffer;

	},

	// preset 2
	preset2: function(){

		this.convolver = new MyConvolver(1, 0.25, audioCtx.sampleRate);
		this.convolver.makeAm(432, 432*2, 1);

		this.input.connect(this.convolver.input);
		this.convolver.connect(this.output);

		this.buffer = this.convolver.buffer;

	},

	// connect the output node of this object to the input of another
	connect: function(audioNode){
		if (audioNode.hasOwnProperty('input') == 1){
			this.output.connect(audioNode.input);
		}
		else {
			this.output.connect(audioNode);
		}
	},

}

//--------------------------------------------------------------

// collection of commonly used Envelopes
function EnvelopePreset(){

	this.output = audioCtx.createGain();
	this.envelopeBuffer = new EnvelopeBuffer();

}

EnvelopePreset.prototype = {

	output: this.output,
	envelopeBuffer: this.envelopeBuffer,
	loop: this.loop,

	// preset 1
	evenRamp: function(length){

		this.length = length;

		this.envelopeBuffer.makeExpEnvelope(
			[1, this.length*0.5, 0, this.length*0.5],
			[1, 1],
		);

		this.buffer = this.envelopeBuffer.buffer;

	},

	// preset 2
	customRamp: function(length, peakPoint, upExp, downExp){

		this.length = length;
		this.peakPoint = peakPoint;
		this.upExp = upExp;
		this.downExp = downExp;

		this.envelopeBuffer.makeExpEnvelope(
			[1, this.length*this.peakPoint, 0, this.length*(1-this.peakPoint)],
			[this.upExp, this.downExp]
		);

		this.buffer = this.envelopeBuffer.buffer;

	},

	// start envelope immediately
	start: function(){
		this.bufferSource = audioCtx.createBufferSource();
		this.bufferSource.buffer = this.buffer.buffer;
		this.bufferSource.loop = this.loop;
		this.bufferSource.connect(this.output);
		this.bufferSource.start();
	},

	// stop envelope immediately
	stop: function(){
		this.bufferSource.stop();
	},

	// start envelope at specified time (in seconds)
	startAtTime: function(time){

		this.time = time;

		this.bufferSource = audioCtx.createBufferSource();
		this.bufferSource.buffer = this.buffer;
		this.bufferSource.loop = this.loop;
		this.bufferSource.connect(this.output);
		this.bufferSource.start(this.time);

	},

	// stop envelope at specified time (in seconds)
	stopAtTime: function(time){

		this.time = time;

		this.bufferSource.stop(this.time);

	},

	// connect the output node of this object to the input of another
	connect: function(audioNode){
		if (audioNode.hasOwnProperty('input') == 1){
			this.output.connect(audioNode.input);
		}
		else {
			this.output.connect(audioNode);
		}
	},

	// create an envelope with exponential curves applied to each line segment
	makeExpEnvelope: function(eArray, expArray){

		this.eArray,
		this.expArray,

		this.envelopeBuffer.makeExpEnvelope(this.eArray, this.expArray);

		this.buffer = this.envelopeBuffer.buffer;

	},

	// create an envelope
	makeEnvelope: function(eArray){

		this.eArray = eArray;

		this.envelopeBuffer.makeEnvelope(this.eArray);

		this.buffer = this.envelopeBuffer.buffer;

	},

}

//--------------------------------------------------------------

// collection of commonly used percussion sounds
function PercussionPresets(){

	this.input = audioCtx.createGain();
	this.output = audioCtx.createGain();
	this.startArray = [];

}

PercussionPresets.prototype = {

	input: this.input,
	output: this.output,
	startArray: this.startArray,

	// preset 1
	perc1: function(){

		this.duration = 1;

		this.fund = 432;
		this.rate = 1.5;
		this.cFA = [1];
		this.mFA = [2];
		this.gVA = [1];
		this.mGA = [1];
		this.pPA = [0.0001];
		this.uEA = [256];
		this.dEA = [128];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 1");

	},

	// preset 2
	perc2: function(){

		this.duration = 1;

		this.fund = 432;
		this.rate = 1.5;
		this.cFA = [1, 1,   3,     2];
		this.mFA = [2, 3,   1,     2];
		this.gVA = [1, 0.5, 0.2, 0.3];
		this.mGA = [1, 1, 1, 1];
		this.pPA = [0.0001, 0.0001, 0.0001, 0.0001];
		this.uEA = [256, 256, 256, 256];
		this.dEA = [128, 128, 128, 128];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 2");

	},

	// preset 3
	perc3: function(){

		this.duration = 1;

		this.fund = 432*2;
		this.rate = 8;
		this.cFA = [5,  1 , 5];
		this.mFA = [2,  32, 10];
		this.gVA = [13, 20, 15];
		this.mGA = [1, 1, 1];
		this.pPA = [0.0001, 0.0001, 0.0003];
		this.uEA = [0.01, 0.01, 0.02];
		this.dEA = [128,  64  , 56];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 3")

	},

	// preset 4
	perc4: function(){

		this.duration = 1;

		this.fund = 432*2;
		this.rate = 4;
		this.cFA = [5,  1 , 5];
		this.mFA = [2,  32, 10];
		this.gVA = [13, 20, 15];
		this.mGA = [1, 1, 1];
		this.pPA = [0.0001, 0.0001, 0.0003];
		this.uEA = [0.01, 0.01, 0.02];
		this.dEA = [128,  64  , 56];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 4")

	},

	// preset 5
	perc5: function(){

		this.duration = 1;

		this.fund = 432*2;
		this.rate = 1;
		this.cFA = [5];
		this.mFA = [2];
		this.gVA = [13];
		this.mGA = [1];
		this.pPA = [0.0001];
		this.uEA = [0.01];
		this.dEA = [128];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 5")

	},

	// preset 6
	perc6: function(){

		this.duration = 4;

		this.fund = 432*0.25;
		this.rate = 0.25;
		this.cFA = [5];
		this.mFA = [2];
		this.gVA = [13];
		this.mGA = [1];
		this.pPA = [0.0001];
		this.uEA = [0.01];
		this.dEA = [128];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 6")

	},

	// preset 7
	perc7: function(){

	this.duration = 1;

	this.fund = 432*0.25;
	this.rate = 3;
	this.cFA = [5];
	this.mFA = [2];
	this.gVA = [13]
	this.mGA = [1];
	this.pPA = [0.0001];
	this.uEA = [0.01];
	this.dEA = [128];

	this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
	this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
	this.b1.playbackRate = this.rate;

	for(var i=0; i<this.cFA.length; i++){
		this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
		this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
		this.b2.multiply(this.mGA[i]);

		this.b1.addBuffer(this.b2.buffer);
	}

	this.b1.normalize(-1, 1);

	this.b1.connect(this.output);

	this.startArray = [this.b1];

	console.log("percussion preset 7")

},

	// preset 8
	perc8: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 3;
		this.cFA = [5];
		this.mFA = [200];
		this.gVA = [20];
		this.mGA = [1];
		this.pPA = [0.0001];
		this.uEA = [0.01];
		this.dEA = [128];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 8")

},

	// preset 9 (metal click)
	perc9: function(){

		this.duration = 1;

		this.fund = 432*1;
		this.rate = 2;
		this.cFA = [100];
		this.mFA = [100];
		this.gVA = [2100];
		this.mGA = [1];
		this.pPA = [0.001];
		this.uEA = [0.1];
		this.dEA = [16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 9");

	},

	// preset 10
	perc10: function(){

		this.duration = 1;

		this.fund = 432*0.125;
		this.rate = 2;
		this.cFA = [100];
		this.mFA = [100];
		this.gVA = [2100];
		this.mGA = [1];
		this.pPA = [0.001];
		this.uEA = [0.1];
		this.dEA = [16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 10");

	},

	// preset 11 (snare)
	perc11: function(){

		this.duration = 1;

		this.fund = 432*0.03125;
		this.rate = 1.25;
		this.cFA = [100];
		this.mFA = [100];
		this.gVA = [2100];
		this.mGA = [1];
		this.pPA = [0.001];
		this.uEA = [0.1];
		this.dEA = [16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 11");

	},

	// preset 12 (cyber hat)
	perc12: function(){

		this.duration = 1;

		this.fund = 432*32;
		this.rate = 16;
		this.cFA = [0.1, 0.3, 0.7 , 1.1 , 0.6 ];
		this.mFA = [0.2, 0.2, 0.05, 0.07, 0.77];
		this.gVA = [100, 150, 120,  1   , 20 ];
		this.mGA = [1, 1, 1, 1, 1];
		this.pPA = [0.1, 0.1, 0.2, 0.5, 0.8];
		this.uEA = [0.1, 0.1, 0.2, 1, 3];
		this.dEA = [8, 4, 3, 1, 0.4];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 12");

	},

	// preset 13 ("i" pulse)
	perc13: function(){

		this.duration = 1;

		this.fund = 16;
		this.rate = 32;
		this.cFA = [1, 9.10714286, 10.3571429];
		this.mFA = [1, 9.10714286, 10.3571429];
		this.gVA = [10, 10, 10];
		this.mGA = [1, 0.5, 0.125];
		this.pPA = [0.1, 0.1, 0.1];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 16, 16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 13");

	},

	// preset 14 (metal "i")
	perc14: function(){

		this.duration = 1;

		this.fund = 280;
		this.rate = 16;
		this.cFA = [1, 9.10714286, 10.3571429];
		this.mFA = [1, 9.10714286, 10.3571429];
		this.gVA = [1, 1, 1];
		this.mGA = [1, 0.025, 0.05];
		this.pPA = [0.1, 0.1, 0.1];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 16, 16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 14");

	},

	// preset 15 ("i" blip)
	perc15: function(){

		this.duration = 1;

		this.fund = 70;
		this.rate = 16;
		this.cFA = [1, 9.10714286, 10.3571429];
		this.mFA = [1, 9.10714286, 10.3571429];
		this.gVA = [1, 1, 1];
		this.mGA = [1, 0.025, 0.05];
		this.pPA = [0.1, 0.1, 0.1];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 8, 4];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 15");

	},

	// preset 16 (rich bowl)
	perc16: function(){

		this.duration = 4;

		this.fund = 250;
		this.rate = 0.25;
		this.cFA = [1, 3.218181818181818, 4.527272727272727];
		this.mFA = [1, 3.218181818181818, 4.527272727272727];
		this.gVA = [1, 1, 1];
		this.mGA = [1, 1, 1];
		this.pPA = [0.01, 0.01, 0.01];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 16, 16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 16")

	},

	// preset 17 (rich bowl 2)
	perc17: function(){

		this.duration = 4;

		this.fund = 250;
		this.rate = 0.25;
		this.cFA = [1, 3.218181818181818, 4.527272727272727];
		this.mFA = [10.3571429, 1, 9.10714286];
		this.gVA = [1, 1, 1];
		this.mGA = [1, 1, 1];
		this.pPA = [0.01, 0.01, 0.01];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 16, 16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("percssion preset 17")

	},

	// preset 18
	perc18: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 50;
		this.cA = [1, 4.75, 6.375];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				this.b2.addSine(j+parseInt(this.fund*this.cA[i]), randomFloat(0.5, 1));

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 19
	perc19: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 50;
		this.cA = [1, 3.218181818181818, 4.527272727272727];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				this.b2.addSine(j+parseInt(this.fund*this.cA[i]), randomFloat(0.5, 1));

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 20
	perc20: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 50;
		this.cA = [1, 3.218181818181818, 4.527272727272727, 1, 9.10714286, 10.3571429];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				this.b2.addSine(j+parseInt(this.fund*this.cA[i]), randomFloat(0.5, 1));

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 21
	perc21: function(){

		this.fund = 432*0.25;
		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 50;
		this.cA = [1, 1.859375, 3.734375];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				if(j<parseInt(this.bw*0.5)){
					this.b2.addSine(j+(this.fund-parseInt(this.bw*0.5)), randomFloat(1, 1)*(j/(parseInt(this.bw*0.5))));
				};

				if(j>=parseInt(this.bw*0.5)){
					this.b2.addSine(j+this.fund, randomFloat(1, 1)*(this.bw-j)/parseInt(this.bw*0.5));
				};

				this.b2.addSine(j+parseInt(this.fund*this.cA[i]), randomFloat(0.5, 1));

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 22
	perc22: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 50;
		this.cA = [1, 1.859375, 3.734375];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				if(j<parseInt(this.bw*0.5)){
					this.b2.addSine(j+(this.fund-parseInt(this.bw*0.5)), randomFloat(0.25, 1)*(j/(parseInt(this.bw*0.5))));
				};

				if(j>=parseInt(this.bw*0.5)){
					this.b2.addSine(j+this.fund, randomFloat(0.25, 1)*(this.bw-j)/parseInt(this.bw*0.5));
				};

				this.b2.addSine(j+parseInt(this.fund*this.cA[i]), randomFloat(0.5, 1));

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset23
	perc23: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 50;
		this.cA = [1, 1.859375, 3.734375];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				if(j<parseInt(this.bw*0.5)){
					this.b2.addSine(j+(this.fund-parseInt(this.bw*0.5)), randomFloat(0.25, 1)*(j/(parseInt(this.bw*0.5))));
				};

				if(j>=parseInt(this.bw*0.5)){
					this.b2.addSine(j+this.fund, randomFloat(0.25, 1)*(this.bw-j)/parseInt(this.bw*0.5));
				};

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset24 (whisper shake)
	perc24: function(){

		this.duration = 1;

		this.rate = 16;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.cF = 100;
		this.bW = 100;
		this.hB = parseInt(this.bW*0.5);

		for(var i=0; i<this.bW; i++){

			this.b1.addSine(i+(this.cF-this.hB), randomFloat(0.25, 1));

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.connect(this.output);


		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 25 (block)
	perc25: function(){

		this.duration = 1;

		this.rate = 8;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.cF = 100;
		this.bW = 100;
		this.hB = parseInt(this.bW*0.5);

		for(var i=0; i<this.bW; i++){

			this.b1.addSine(i+(this.cF-this.hB), randomFloat(0.25, 1));

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.1, 0.2, 0.1, 16);

		this.b1.connect(this.output);


		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 26 (hi tuned tom)
	perc26: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.cF = 400;
		this.bW = 200;
		this.hB = parseInt(this.bW*0.5);

		for(var i=0; i<this.bW; i++){

			this.b1.addSine(i+(this.cF-this.hB), 1);

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.1, 0.2, 0.1, 16);

		this.b1.connect(this.output);


		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 27 (muted layer)
	perc27: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.cF = 200;
		this.bW = 200;
		this.hB = parseInt(this.bW*0.5);

		for(var i=0; i<this.bW; i++){

			this.b1.addSine(i+(this.cF-this.hB), 1);

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.1, 0.3, 0.1, 8);

		this.b1.connect(this.output);


		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 28 (reso click)
	perc28: function(){

		this.duration = 1;

		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.cF = 3000;
		this.bW = 500;
		this.hB = parseInt(this.bW*0.5);

		for(var i=0; i<this.bW; i++){

			this.b1.addSine(i+(this.cF-this.hB), randomFloat(0.25, 1));

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.1, 0.3, 0.1, 8);

		this.b1.connect(this.output);


		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 29 (formant click);
	perc29: function(){

		this.duration = 1;

		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.cFA = [3000, 2000];
		this.bW = 500;
		this.hB = parseInt(this.bW*0.5);

		for(var i=0; i<this.cFA.length; i++){

				for(var j=0; j<this.bW; j++){

					this.b1.addSine(j+(this.cFA[i]-this.hB), randomFloat(0.25, 1));

				}

			}

			this.b1.normalize(-1, 1);

			this.b1.applyRamp(0, 1, 0.1, 0.3, 0.1, 8);

			this.b1.connect(this.output);


			this.startArray = [this.b1];

			bufferGraph(this.b1.buffer);

		},

	// perc 30 (sticks)
	perc30: function(){

		this.duration = 1;

		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 1000;
		this.iA = [3, 2];
		this.bWA = [100, 100];

		for(var i=0; i<this.iA.length; i++){

			for(var j=0; j<this.bWA[i]; j++){

				this.b1.addSine(j+((this.fund*this.iA[i])-(this.bWA[i]*0.5)), randomFloat(0.25, 1));

			}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.1, 0.3, 0.1, 8);

		this.b1.connect(this.output);


		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 31
	perc31: function(){

		this.duration = 1;

		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 200;
		this.iA = [2, 3, 4, 1];
		this.bWA = [50, 20, 30, 70];

		for(var i=0; i<this.iA.length; i++){

				for(var j=0; j<this.bWA[i]; j++){

					this.b1.addSine(j+((this.fund*this.iA[i])-(this.bWA[i]*0.5)), randomFloat(0.25, 1));

				}

			}

			this.b1.normalize(-1, 1);

			this.b1.applyRamp(0, 1, 0.1, 0.3, 0.1, 8);

			this.b1.connect(this.output);


			this.startArray = [this.b1];

			bufferGraph(this.b1.buffer);

		},

	// preset 32
	perc32: function(){

		this.duration = 1;

		this.rate = 4;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 100;
		this.iA = [1, 9.10714286, 10.3571429];
		this.bWA = [100, 100, 100];

		for(var i=0; i<this.iA.length; i++){

			for(var j=0; j<this.bWA[i]; j++){

				this.b1.addSine(j+((this.fund*this.iA[i])-(this.bWA[i]*0.5)), randomFloat(0.25, 1));

			}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.1, 0.3, 0.1, 8);

		this.b1.connect(this.output);


		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 33
	perc33: function(){

		this.duration = 1;

		this.rate = 4;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 25;
		this.iA = [1, 9.10714286, 10.3571429, 4.75, 6.375, 3.218181818181818, 4.527272727272727];
		this.bWA = [20, 20, 20, 20, 20, 20, 20];

		for(var i=0; i<this.iA.length; i++){

				for(var j=0; j<this.bWA[i]; j++){

					this.b1.addSine(j+((this.fund*this.iA[i])-(this.bWA[i]*0.5)), randomFloat(0.25, 1));

				}

			}

			this.b1.normalize(-1, 1);

			this.b1.applyRamp(0, 1, 0.1, 0.3, 0.1, 8);

			this.b1.connect(this.output);


			this.startArray = [this.b1];

			bufferGraph(this.b1.buffer);

		},

	// preset 34 (reso tom)
	perc34: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 100;
		this.sL = 3;

		this.iS = new Sequence();
		this.iA = [1, 2.405797101449275, 3.608695652173913];
		this.bWS = new Sequence();

		this.iS.urnSelect(this.sL, this.iA);
		this.bWS.randomInts(this.sL, 100, 100);

		this.iS = this.iS.sequence;
		this.bWS = this.bWS.sequence;

		for(var i=0; i<this.iS.length; i++){

			for(var j=0; j<this.bWS[i]; j++){

				this.b1.addSine(j+((this.fund*this.iS[i])-(this.bWS[i]*0.5)), randomFloat(0.5, 1));

			}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 8);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 35 (knife tom)
	perc35: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 40;

		this.iA = [1, 2, 3, 4];
		this.bwA = [6, 8, 10, 20];
		this.gA = [1, 1, 1, 1];

		for(var i=0; i<this.iA.length; i++){

			for(var j=0; j<parseInt(this.bwA[i]); j++){

				this.f = j+((this.fund*this.iA[i])-(parseInt(this.bwA[i]*0.5)));
				this.b1.addSine(this.f, 1);
				this.b1.addSine(this.f*randomFloat(0.99, 1.01), 1);

			}

		}

		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 36 (formant block)
	perc36: function(){

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 100;

		this.iA = [1, 1.859375, 3.734375, 9.10714286, 10.3571429, 4.75, 6.375, 3.218181818181818, 4.527272727272727, 2.405797101449275, 3.608695652173913];
		this.bwA = [25, 25, 25, 25, 25];
		this.gA = [1, 1, 1, 1, 1];

		for(var i=0; i<this.iA.length; i++){

			this.rBW = randomInt(25, 45);

			for(var j=0; j<this.rBW; j++){

				this.f = j+((this.fund*this.iA[i])-(parseInt(this.rBW*0.5)));
				this.b1.addSine(this.f, 1);
				this.b1.addSine(this.f*randomFloat(0.99, 1.01), 1);

			}

		}

		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 37 (fm shape kick)
	perc37: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.01, 0.0125, 0.9, 30);
		this.bPE.playbackRate = 1;

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(107, 20, 1);
		this.s1G = new MyGain(0.1);

		// CONNECTIONS

		this.bPE.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 38 (fm shape kick 2)
	perc38: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.01, 0.0125, 0.9, 30);
		this.bPE.playbackRate = 1;

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(207, 20, 1);
		this.s1G = new MyGain(0.1);

		// CONNECTIONS

		this.bPE.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 39 (fm shape wop)
	perc39: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.01, 0.0125, 0.9, 30);
		this.bPE.playbackRate = 1;

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(207, 20, 1);
		this.s1G = new MyGain(0.2);

		// CONNECTIONS

		this.bPE.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 40 (fm shape recoil)
	perc40: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.1, 0.15, 0.5, 20);
		this.bPE.playbackRate = 1;

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(200, 10, 1);
		this.s1G = new MyGain(0.2);

		this.f = new MyBiquad("lowpass", 2000, 1);

		// CONNECTIONS

		this.bPE.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.f);
		this.f.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 41 (fm shape recoil 2)
	perc41: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.1, 0.15, 0.25, 20);
		this.bPE.playbackRate = 1;

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(200, 10, 1);
		this.s1G = new MyGain(0.2);

		this.f = new MyBiquad("lowpass", 2000, 1);

		// CONNECTIONS

		this.bPE.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.f);
		this.f.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 42 (fm shape schwa rebound)
	perc42: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.1, 0.15, 0.5, 20);
		this.bPE.playbackRate = 1;

		this.f = new MyBiquad("lowpass", 100, 1);

		this.sh = new SchwaBox("i");

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(200, 10, 1);
		this.s1G = new MyGain(0.2);

		bufferGraph(this.bPE.buffer);

		// CONNECTIONS

		this.bPE.connect(this.f);
		this.f.connect(this.sh);
		this.sh.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 43 (fm shape schwa &)
	perc43: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.1, 0.15, 0.5, 20);
		this.bPE.playbackRate = 1;

		this.f = new MyBiquad("lowpass", 100, 1);

		this.sh = new SchwaBox("&");

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(200, 10, 1);
		this.s1G = new MyGain(0.2);

		bufferGraph(this.bPE.buffer);

		// CONNECTIONS

		this.bPE.connect(this.f);
		this.f.connect(this.sh);
		this.sh.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 44 (fm shape schwa A)
	perc44: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.1, 0.15, 0.5, 20);
		this.bPE.playbackRate = 1;

		this.f = new MyBiquad("lowpass", 100, 1);

		this.sh = new SchwaBox("A");

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(200, 10, 1);
		this.s1G = new MyGain(0.2);

		bufferGraph(this.bPE.buffer);

		// CONNECTIONS

		this.bPE.connect(this.f);
		this.f.connect(this.sh);
		this.sh.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 45 (reso shape tom)
	perc45: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.01, 0.0125, 0.9, 30);
		this.bPE.playbackRate = 1;

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(207, 20, 1);
		this.s1G = new MyGain(0.1);

		this.pi = new SemiOpenPipe(20);

		this.dLTA = [
			0.02417677268385887,
			// 0.016971250995993614,
			// 0.02754555083811283,
			// 0.021444011479616165,
			// 0.01062596496194601,
			// 0.010865089483559132,
			// 0.022276800125837326,
			// 0.01442224346101284,
			// 0.017260313034057617
		]

		this.dRTA = [
			0.025461271405220032,
			// 0.013664914295077324,
			// 0.028265981003642082,
			// 0.02390819415450096,
			// 0.011327671818435192,
			// 0.01406327448785305,
			// 0.022542670369148254,
			// 0.012952608056366444,
			// 0.017557572573423386
		]

		this.dIdx = randomInt(0, this.dLTA.length);

		this.d = new MyStereoDelay(this.dLTA[this.dIdx], this.dRTA[this.dIdx], randomFloat(0, 0.1), 1);

		this.p = new MyPanner2(0);

		this.w = new MyWaveShaper();
		this.w.makeSigmoid(5);

		this.g = new MyGain(4);

		// CONNECTIONS

		this.bPE.connect(this.s1G);
		this.s1G.connect(this.s1);
		this.s1.connect(this.pi);
		this.pi.connect(this.d);
		this.d.connect(this.w);
		this.w.connect(this.p);
		this.p.connect(this.g);
		this.g.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 46 (reso shape kick)
	perc46: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.01, 0.0125, 0.5, 30);
		this.bPE.playbackRate = 1;

		this.pi = new SemiOpenPipe(100*0.5);
		this.pi.output.gain.value = 20;

		this.w = new Effect();
		this.w.fmShaper(10, 20, 10, 0.00125);
		this.w.on();

		this.f = new MyBiquad("lowpass", 20000, 1);

		this.d = new MyStereoDelay(0.02417677268385887, 0.025461271405220032, randomFloat(0, 0.1), 1);

		this.p = new MyPanner2(0);

		bufferGraph(this.bPE.buffer);

		this.bPE.connect(this.w);
		this.w.connect(this.d);
		this.d.connect(this.p);
		this.p.connect(this.f);
		this.f.connect(this.pi);
		this.pi.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 47 (noise pop)
	perc47: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.01, 0.0125, 0.5, 10);
		this.bPE.playbackRate = 10;

		this.nB = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.nB.makeNoise();
		this.nB.multiply(0.005);

		this.bPE.addBuffer(this.nB.buffer);

		this.d = new MyStereoDelay(0.02417677268385887, 0.025461271405220032, randomFloat(0, 0.1), 1);

		this.p = new MyPanner2(0);

		bufferGraph(this.bPE.buffer);

		this.bPE.connect(this.d);
		this.d.connect(this.p);
		this.p.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 48
	perc48: function(){

		this.duration = 1;

		this.fund = 432*2;
		this.rate = 5;
		this.cFA = [5,  1 , 5];
		this.mFA = [2,  32, 10];
		this.gVA = [13, 20, 15];
		this.mGA = [1, 1, 1];
		this.pPA = [0.0001, 0.0001, 0.0003];
		this.uEA = [0.01, 0.01, 0.02];
		this.dEA = [128,  64  , 56];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.d = new MyStereoDelay(0.02417677268385887, 0.025461271405220032, randomFloat(0, 0.1), 1);
		this.p = new MyPanner2(0);

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.001, 0.0015, 0.1, 1);

		this.b1.connect(this.d);
		this.d.connect(this.p);
		this.p.connect(this.output);

		bufferGraph(this.b1.buffer);

		this.startArray = [this.b1];

		console.log("percussion preset 3")

	},

	// preset 49 ("i" pulse reso)
	perc49: function(){

		this.duration = 1;

		this.fund = 16;
		this.rate = 32;
		this.cFA = [1, 9.10714286, 10.3571429];
		this.mFA = [1, 9.10714286, 10.3571429];
		this.gVA = [10, 10, 10];
		this.mGA = [1, 0.5, 0.125];
		this.pPA = [0.1, 0.1, 0.1];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 16, 16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.d = new MyStereoDelay(0.02417677268385887, 0.025461271405220032, randomFloat(0, 0.1), 1);

		this.b1.connect(this.d);
		this.d.connect(this.output);

		this.startArray = [this.b1];

		console.log("percussion preset 13");

	},

	// preset50 (whisper shake reso)
	perc50: function(){

		this.duration = 1;

		this.rate = 16;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.cF = 100;
		this.bW = 100;
		this.hB = parseInt(this.bW*0.5);

		for(var i=0; i<this.bW; i++){

			this.b1.addSine(i+(this.cF-this.hB), randomFloat(0.25, 1));

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.d = new MyStereoDelay(0.02417677268385887, 0.025461271405220032, randomFloat(0, 0.1), 1);

		this.b1.connect(this.d);
		this.d.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 51 (blip)
	perc51: function(){

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.makeRamp(0, 1, 0.15, 0.15, 0.1, 100);
		this.b1.playbackRate = 1;

		this.f = new MyBiquad("bandpass", randomInt(432, 432*8), 10);
		this.f.output.gain.value = 8;

		this.b1.connect(this.f);
		this.f.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 52 (shape blip)
	perc52: function(){

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.makeRamp(0, 1, 0.2, 0.2, 0.7, 0.0001);
		this.b1.playbackRate = 1;

		this.f = new MyBiquad("bandpass", randomInt(432, 432*8), 10);
		this.f2 = new MyBiquad("highpass", 10, 1);

		this.w = new Effect();
		this.w.fmShaper(432, 432*4, 1, 0.01);
		this.w.on();
		this.w.output.gain.value = 0.2;

		this.d = new Effect();
		this.d.randomShortDelay();
		this.d.on();

		this.b1.connect(this.f);
		this.f.connect(this.d);
		this.d.connect(this.w);
		this.w.connect(this.f2);
		this.f2.connect(this.output);

		this.startArray = [this.b1];

	},

	// preset 53 (lfo formants 1)
	perc53: function(){

		this.fund = 432;

		this.formants = new PlaceLFOFormants();

		this.cFSeqVals = [1   , 1   , 1 ,   1   ];
		this.mFSeqVals = [M3*2, P5*2, M6*2, M2*2];
		this.mISeqVals = [M3*4, P5*4, M6*4, M2*2];
		this.gSeq = [1, 1, 1, 1, 2, 1.5];

		this.cFSeq = new Sequence();
		this.mFSeq = new Sequence();
		this.mISeq = new Sequence();
		this.mlRateSeq = new Sequence();
		this.lRateSeq = new Sequence();
		// this.gSeq = new Sequence();

		this.sL = this.cFSeqVals.length;

		this.cFSeq.multiples(this.sL, this.fund, this.cFSeqVals);
		this.mFSeq.multiples(this.sL, this.fund, this.mFSeqVals);
		this.mISeq.multiples(this.sL, this.fund, this.mISeqVals);
		this.mlRateSeq.randomFloats(this.sL, 5, 20);
		this.lRateSeq.randomFloats(this.sL, 0.00001, 0.0005);
		// this.gSeq.duplicates(this.sL, 1/this.sL);

		this.cFSeq = this.cFSeq.sequence;
		this.mFSeq = this.mFSeq.sequence;
		this.mISeq = this.mISeq.sequence;
		this.mlRateSeq = this.mlRateSeq.sequence;
		this.lRateSeq = this.lRateSeq.sequence;
		// this.gSeq = this.gSeq.sequence;

		for(var i=0; i<this.sL; i++){
			this.formants.fmForm(this.cFSeq[i], this.mFSeq[i], this.mISeq[i], this.mlRateSeq[i], this.lRateSeq[i], this.gSeq[i]);
			this.formants.lArray[0].buffer.makeUnipolarNoise();
			this.formants.mlArray[0].buffer.makeInverseSawtooth(9);
		}

		this.f = new MyBiquad("notch", this.fund, 5);

		this.eG = new MyGain(0);
		this.eB = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.eB.makeRamp(0, 1, 0.1, 0.9, 0.1, 0.1);
		this.eB.playbackRate = 1;

		this.formants.connect(this.f);
		this.f.connect(this.eG); this.eB.connect(this.eG.gain.gain);
		this.eG.connect(this.output);

		this.formants.start();

		this.startArray = [this.eB];

		this.formants.output.gain.value = 0.25;

	},

	// preset 54 (lfo formants 2)
	perc54: function(){

		this.fund = 432*2;

		this.formants = new PlaceLFOFormants();

		this.cFSeqVals = [1   , 1   , 1 ,   1   ];
		this.mFSeqVals = [M3*2, P5*2, M6*2, M2*2];
		this.mISeqVals = [M3*4, P5*4, M6*4, M2*2];
		this.gSeq = [1, 1, 1, 1, 2, 1.5];

		this.cFSeq = new Sequence();
		this.mFSeq = new Sequence();
		this.mISeq = new Sequence();
		this.mlRateSeq = new Sequence();
		this.lRateSeq = new Sequence();
		// this.gSeq = new Sequence();

		this.sL = this.cFSeqVals.length;

		this.cFSeq.multiples(this.sL, this.fund, this.cFSeqVals);
		this.mFSeq.multiples(this.sL, this.fund, this.mFSeqVals);
		this.mISeq.multiples(this.sL, this.fund, this.mISeqVals);
		this.mlRateSeq.randomFloats(this.sL, 5, 20);
		this.lRateSeq.randomFloats(this.sL, 0.00001, 0.0005);
		// this.gSeq.duplicates(this.sL, 1/this.sL);

		this.cFSeq = this.cFSeq.sequence;
		this.mFSeq = this.mFSeq.sequence;
		this.mISeq = this.mISeq.sequence;
		this.mlRateSeq = this.mlRateSeq.sequence;
		this.lRateSeq = this.lRateSeq.sequence;
		// this.gSeq = this.gSeq.sequence;

		for(var i=0; i<this.sL; i++){
			this.formants.fmForm(this.cFSeq[i], this.mFSeq[i], this.mISeq[i], this.mlRateSeq[i], this.lRateSeq[i], this.gSeq[i]);
			this.formants.lArray[0].buffer.makeUnipolarNoise();
			this.formants.mlArray[0].buffer.makeInverseSawtooth(9);
		}

		this.f = new MyBiquad("notch", this.fund, 5);

		this.eG = new MyGain(0);
		this.eB = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.eB.makeRamp(0, 1, 0.1, 0.9, 0.1, 0.1);
		this.eB.playbackRate = 1;

		this.formants.connect(this.f);
		this.f.connect(this.eG); this.eB.connect(this.eG.gain.gain);
		this.eG.connect(this.output);

		this.formants.start();

		this.startArray = [this.eB];

		this.formants.output.gain.value = 0.25;

	},

	// preset 55 (lfo formants 3)
	perc55: function(){

		this.fund = 432*4;

		this.formants = new PlaceLFOFormants();

		this.cFSeqVals = [1   , 1   , 1 ,   1   ];
		this.mFSeqVals = [M3*2, P5*2, M6*2, M2*2];
		this.mISeqVals = [M3*4, P5*4, M6*4, M2*2];
		this.gSeq = [1, 1, 1, 1, 2, 1.5];

		this.cFSeq = new Sequence();
		this.mFSeq = new Sequence();
		this.mISeq = new Sequence();
		this.mlRateSeq = new Sequence();
		this.lRateSeq = new Sequence();
		// this.gSeq = new Sequence();

		this.sL = this.cFSeqVals.length;

		this.cFSeq.multiples(this.sL, this.fund, this.cFSeqVals);
		this.mFSeq.multiples(this.sL, this.fund, this.mFSeqVals);
		this.mISeq.multiples(this.sL, this.fund, this.mISeqVals);
		this.mlRateSeq.randomFloats(this.sL, 5, 20);
		this.lRateSeq.randomFloats(this.sL, 0.00001, 0.0005);
		// this.gSeq.duplicates(this.sL, 1/this.sL);

		this.cFSeq = this.cFSeq.sequence;
		this.mFSeq = this.mFSeq.sequence;
		this.mISeq = this.mISeq.sequence;
		this.mlRateSeq = this.mlRateSeq.sequence;
		this.lRateSeq = this.lRateSeq.sequence;
		// this.gSeq = this.gSeq.sequence;

		for(var i=0; i<this.sL; i++){
			this.formants.fmForm(this.cFSeq[i], this.mFSeq[i], this.mISeq[i], this.mlRateSeq[i], this.lRateSeq[i], this.gSeq[i]);
			this.formants.lArray[0].buffer.makeUnipolarNoise();
			this.formants.mlArray[0].buffer.makeInverseSawtooth(9);
		}

		this.f = new MyBiquad("notch", this.fund, 5);

		this.eG = new MyGain(0);
		this.eB = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.eB.makeRamp(0, 1, 0.1, 0.9, 0.1, 0.1);
		this.eB.playbackRate = 1;

		this.formants.connect(this.f);
		this.f.connect(this.eG); this.eB.connect(this.eG.gain.gain);
		this.eG.connect(this.output);

		this.formants.start();

		this.formants.output.gain.value = 0.25;

		this.startArray = [this.eB];

	},

	// preset 56 (lfo formants 4)
	perc56: function(){

		this.fund = 432*1;

		this.formants = new PlaceLFOFormants();

		this.cFSeqVals = [1   , 1   , 1 ,   1   ];
		this.mFSeqVals = [M3*2, P5*2, M6*2, M2*2];
		this.mISeqVals = [M3*4, P5*4, M6*4, M2*2];
		this.gSeq = [1, 1, 1, 1, 2, 1.5];

		this.cFSeq = new Sequence();
		this.mFSeq = new Sequence();
		this.mISeq = new Sequence();
		this.mlRateSeq = new Sequence();
		this.lRateSeq = new Sequence();
		// this.gSeq = new Sequence();

		this.sL = this.cFSeqVals.length;

		this.cFSeq.multiples(this.sL, this.fund, this.cFSeqVals);
		this.mFSeq.multiples(this.sL, this.fund, this.mFSeqVals);
		this.mISeq.multiples(this.sL, this.fund, this.mISeqVals);
		this.mlRateSeq.randomFloats(this.sL, 1, 5);
		this.lRateSeq.randomFloats(this.sL, 0.00001, 0.0005);
		// this.gSeq.duplicates(this.sL, 1/this.sL);

		this.cFSeq = this.cFSeq.sequence;
		this.mFSeq = this.mFSeq.sequence;
		this.mISeq = this.mISeq.sequence;
		this.mlRateSeq = this.mlRateSeq.sequence;
		this.lRateSeq = this.lRateSeq.sequence;
		// this.gSeq = this.gSeq.sequence;

		for(var i=0; i<this.sL; i++){
			this.formants.fmForm(this.cFSeq[i], this.mFSeq[i], this.mISeq[i], this.mlRateSeq[i], this.lRateSeq[i], this.gSeq[i]);
			this.formants.lArray[0].buffer.makeUnipolarNoise();
			this.formants.mlArray[0].buffer.makeInverseSawtooth(9);
		}

		this.f = new MyBiquad("notch", this.fund, 5);

		this.eG = new MyGain(0);
		this.eB = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.eB.makeRamp(0, 1, 0.1, 0.9, 0.1, 0.1);
		this.eB.playbackRate = 1;

		this.formants.connect(this.f);
		this.f.connect(this.eG); this.eB.connect(this.eG.gain.gain);
		this.eG.connect(this.output);

		this.formants.start();

		this.formants.output.gain.value = 0.25;

		this.startArray = [this.eB];

	},

	// preset 57 (fm kick layer)
	perc57: function(){

		this.fund = 100;

		this.cF = this.fund*1;
		this.mF = this.fund*M3*2;
		this.mI = this.fund*M3*4;

		this.cO = new MyOsc("sine", this.cF);
		this.mO = new MyOsc("sine", this.mF);
		this.mG = new MyGain(this.mI);

		this.mE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mE.makeInverseSawtooth(9);
		this.mE.playbackRate = 1;
		this.mEG = new MyGain(0);

		this.mO.connect(this.mEG); this.mE.connect(this.mEG.gain.gain);
		this.mEG.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, 5);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();
		this.mO.start();

		this.startArray = [this.mE];

	},

	// preset 58 (fm cowbell 1)
	perc58: function(){

		this.fund = 432;

		this.cF = 1*this.fund;
		this.mF = M3*2*this.fund;
		this.mI = M3*4*this.fund;

		this.sTE = 9;
		this.pBR = 1;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI)

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 59 (fm cowbell 2)
	perc59: function(){

		this.fund = 432;

		this.cF = 1*this.fund;
		this.mF = M6*2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 9;
		this.pBR = 1;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI)

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 60 (fm milk carton)
	perc60: function(){

		this.fund = 432*0.125;

		this.cF = 1*this.fund;
		this.mF = M6*2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 9;
		this.pBR = 1;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI)

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 61 (fm milk carton reso)
	perc61: function(){

		this.fund = 432*0.125;

		this.cF = 1*this.fund;
		this.mF = M6*2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 9;
		this.pBR = 1;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI)

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.d = new Effect();
		this.d.randomShortDelay();
		this.d.on();

		this.p = new MyPanner2(0);

		this.w = new Effect();
		this.w.fmShaper(this.fund, this.fund*2, 1, 0.001);
		this.w.on();

		this.cO.connect(this.f);
		this.f.connect(this.d);
		this.d.connect(this.p);
		this.p.connect(this.w);
		this.w.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 62 (fm perc 1)
	perc62: function(){

		this.fund = 432*0.125;

		this.cF = 1*this.fund;
		this.mF = M6*2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 9;
		this.pBR = 5;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI)

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 63 (fm block)
	perc63: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = M6*2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 9;
		this.pBR = 20;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI)

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 64 (fm block reso)
	perc64: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = M6*2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 9;
		this.pBR = 20;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI)

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.d = new Effect();
		this.d.randomShortDelay();
		this.d.on();

		this.p = new MyPanner2(0);

		this.w = new Effect();
		this.w.fmShaper(this.fund, this.fund*2, 1, 0.00025);
		this.w.on();

		this.cO.connect(this.f);
		this.f.connect(this.w);
		this.w.connect(this.d);
		this.d.connect(this.p);
		this.p.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 65 (fm thump)
	perc65: function(){

		this.fund = 432*0.125;

		this.cF = 1*this.fund;
		this.mF = M6*2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 9;
		this.pBR = 20;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI)

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 66 (fm perc 2)
	perc66: function(){

		this.fund = 432*2;

		this.cF = 1*this.fund;
		this.mF = 1.1*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 4;
		this.pBR = 20;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 67 (fm bottle)
	perc67: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = 11.2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 4;
		this.pBR = 20;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 68 (fm bottle 2)
	perc68: function(){

		this.fund = 432*0.5;

		this.cF = 1*this.fund;
		this.mF = 11.2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 4;
		this.pBR = 20;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 69 (fm bottle 3)
	perc69: function(){

		this.fund = 432*0.25;

		this.cF = 1*this.fund;
		this.mF = 11.2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 4;
		this.pBR = 20;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 70 (fm bottle 4)
	perc70: function(){

		this.fund = 432*0.125;

		this.cF = 1*this.fund;
		this.mF = 11.2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 4;
		this.pBR = 20;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 71 (fm bottle pluck)
	perc71: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = 11.2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 20;
		this.pBR = 100;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 72 (fm perc 3)
	perc72: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = 2*this.fund;
		this.mI = 1*this.fund;

		this.sTE = 5;
		this.pBR = 5;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.makeFm(4.75/this.pBR, 6.375/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.f.output.gain.value = 0.25;

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 73 (fm schwa bottle pluck)
	perc73: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = 11.2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 20;
		this.pBR = 100;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);
		this.s = new SchwaBox("ae");

		this.cO.connect(this.f);
		this.f.connect(this.s);
		this.s.connect(this.output);

		this.s.output.gain.value = 0.01;

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 74 (fm pipe bottle pluck)
	perc74: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = 11.2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 20;
		this.pBR = 100;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);
		this.p = new SemiOpenPipe(200);

		this.cO.connect(this.f);
		this.f.connect(this.p);
		this.p.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 75 (fm pipe bottle pluck 2)
	perc75: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = 1.2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = 5;
		this.pBR = 10;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);
		this.p = new SemiOpenPipe(100);

		this.cO.connect(this.f);
		this.f.connect(this.p);
		this.p.connect(this.output);

		this.p.output.gain.value = 2;

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 76 (fm pipe bottle pluck 2)
	perc76: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = randomFloat(1.2, 1.25)*this.fund; 1.2324435476987805
		this.mI = randomArrayValue([1, m2, M2, m3, M3, P4, d5, P5, m6, M6, m7, M7])*4*this.fund;

		this.sTE = randomFloat(5, 10);
		this.pBR = 10;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.addSine(this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*randomFloat(0.03125, 0.0625));
		this.p = new SemiOpenPipe(100*randomFloat(0.99, 1.01));

		this.d = new Effect();
		this.d.stereoDelay(randomFloat(0.02, 0.03), randomFloat(0.02, 0.03), randomFloat(0, 0.1), 1);
		this.d.on();

		this.pan = new MyPanner2(0);

		this.cO.connect(this.f);
		this.f.connect(this.p);
		this.p.connect(this.d);
		this.d.connect(this.pan);
		this.pan.connect(this.output);

		this.p.output.gain.value = 2;

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 77 (fm synth perc)
	perc77: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = randomArrayValue([1, M2, M3, P4, P5, M6, M7])*2*this.fund;
		this.mI = P4*4*this.fund;

		this.sTE = randomFloat(8, 12);
		this.pBR = randomFloat(15, 25);

		this.cO = new MyOsc("sine", this.cF);
		this.mO = new MyOsc("sine", this.mF);
		this.mG = new MyGain(this.mI);
		this.mE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mE.makeInverseSawtooth(9);
		this.mE.playbackRate = this.pBR;
		this.mEG = new MyGain(0);

		this.mO.connect(this.mEG); this.mE.connect(this.mEG.gain.gain);
		this.mEG.connect(this.mG);
		this.mG.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*randomFloat(0.03125, 0.0625));

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();
		this.mO.start();

		this.startArray = [this.mE];

	},

	// start instrument immediately
	start: function(){
		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].start();
		}
	},

	// stop instrument immediately
	stop: function(){
		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].stop();
		}
	},

	// start instrument at specified time (in seconds)
	startAtTime: function(time){

		this.time = time;

		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].startAtTime(this.time);
		}

	},

	// stop instrument at specified time (in seconds)
	stopAtTime: function(time){

		this.time = time;

		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].stopAtTime(this.time);
		}

	},

	// connect the output node of this object to the input of another
	connect: function(audioNode){
		if (audioNode.hasOwnProperty('input') == 1){
			this.output.connect(audioNode.input);
		}
		else {
			this.output.connect(audioNode);
		}
	},

}

//--------------------------------------------------------------

// collection of commonly used pitched sounds
function PitchedPresets(){

	this.input = audioCtx.createGain();
	this.output = audioCtx.createGain();
	this.startArray = [];

}

PitchedPresets.prototype = {

	input: this.input,
	output: this.output,
	startArray: this.startArray,

	// instrument preset template
	instrumentMethod: function(){
		this.startArray = [];
	},

	// preset 1
	pitch1: function(){

		this.duration = 2;

		this.fund = 432;
		this.rate = 0.5;
		this.cFA = [1];
		this.mFA = [2];
		this.gVA = [1];
		this.mGA = [1];
		this.pPA = [0.0001];
		this.uEA = [0.1];
		this.dEA = [8];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("pitched preset 1");

	},

	// preset 2
	pitch2: function(){

		this.duration = 2;

		this.fund = 432;
		this.rate = 0.5;
		this.cFA = [1, 1, 5];
		this.mFA = [2, 3, 7];
		this.gVA = [1, 1, 0.5];
		this.mGA = [0.5, 1, 0.5];
		this.pPA = [0.0001, 0.001, 0.0002];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [8, 16, 32];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("pitched preset 2");

	},

	// preset 3
	pitch3: function(){

		this.duration = 2;

		this.fund = 432*0.25;
		this.rate = 0.5;
		this.cFA = [1, 1, 5];
		this.mFA = [2, 3, 7];
		this.gVA = [1, 1, 0.5];
		this.mGA = [0.5, 1, 0.5];
		this.pPA = [0.5, 0.6, 0.7];
		this.uEA = [1, 2, 4];
		this.dEA = [1.1, 2.1, 1.7];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("pitched preset 3");

	},

	// preset 4 (bell key)
	pitch4: function(){

		this.duration = 1;

		this.fund = 432*1;
		this.rate = 1.25;
		this.cFA = [100, 1];
		this.mFA = [100, 3];
		this.gVA = [2100, 0.5];
		this.mGA = [0.25, 1];
		this.pPA = [0.001, 0.002];
		this.uEA = [0.1, 0.3];
		this.dEA = [16, 8];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("pitched preset 4");

	},

	// preset 5
	pitch5: function(){

		this.duration = 1;

		this.fund = 432*1;
		this.rate = 1;
		this.cFA = [0.1];
		this.mFA = [0.5];
		this.gVA = [1];
		this.mGA = [1];
		this.pPA = [0.1];
		this.uEA = [0.1];
		this.dEA = [8];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("pitched preset 5");

	},

	// preset 6 (bass)
	pitch6: function(){

		this.duration = 1;

		this.fund = 432*1;
		this.rate = 1;
		this.cFA = [0.1];
		this.mFA = [0.2];
		this.gVA = [1];
		this.mGA = [1];
		this.pPA = [0.1];
		this.uEA = [0.1];
		this.dEA = [8];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("pitched preset 6");

	},

	// preset 7 (pad)
	pitch7: function(){

		this.duration = 8;

		this.fund = 500/M2;
		this.rate = 0.125;
		this.cFA = [1, 3, 5, 4];
		this.mFA = [1, 3, 5, 4];
		this.gVA = [0.3, 0.3, 0.3, 0.3];
		this.mGA = [1, 1, 1, 1];
		this.pPA = [0.5, 0.5, 0.5, 0.5];
		this.uEA = [1, 1, 1, 1];
		this.dEA = [1, 1, 1, 1];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.f = new MyBiquad("lowpass", 5000, 1);

		this.b1.connect(this.f);
		this.f.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

		console.log("pitched preset 7");

	},

	// preset 8 ("i" bell)
	pitch8: function(){

		this.duration = 1;

		this.fund = 500;
		this.rate = 2;
		this.cFA = [1, 9.10714286, 10.3571429];
		this.mFA = [1, 9.10714286, 10.3571429];
		this.gVA = [1, 1, 1];
		this.mGA = [1, 0.025, 0.05];
		this.pPA = [0.01, 0.01, 0.01];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 8, 4];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("pitched preset 8");

	},

	// preset 9 (short key)
	pitch9: function(){

		this.duration = 1;

		this.fund = 500;
		this.rate = 2;
		this.cFA = [1, 4.75, 6.375];
		this.mFA = [1, 9.10714286, 10.3571429];
		this.gVA = [1, 1, 1];
		this.mGA = [1, 0.025, 0.05];
		this.pPA = [0.01, 0.01, 0.01];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 16, 16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("pitched preset 9");

	},

	// preset 10 ("I" bell)
	pitch10: function(){

		this.duration = 1;

		this.fund = 500;
		this.rate = 1;
		this.cFA = [1, 4.75, 6.375];
		this.mFA = [1, 4.75, 6.375];
		this.gVA = [0.25, 0.25, 0.25];
		this.mGA = [1, 1, 1];
		this.pPA = [0.01, 0.01, 0.01];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 16, 16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("pitched preset 10")

	},

	// preset 11 (rich bowl)
	pitch11: function(){

		this.duration = 4;

		this.fund = 250;
		this.rate = 0.25;
		this.cFA = [1, 3.218181818181818, 4.527272727272727];
		this.mFA = [10.3571429, 1, 9.10714286];
		this.gVA = [1, 1, 1];
		this.mGA = [1, 1, 1];
		this.pPA = [0.01, 0.01, 0.01];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 16, 16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("pitched preset 11")

	},

	// preset 12 (fm horn)
	pitch12: function(){

		this.duration = 1;

		this.fund = 432*m2*P4;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = 1;

		this.b2.makeFm(this.fund, this.fund, 1*0.25);
		this.b2.applyRamp(0, 1, 0.1, 0.1, 4, 8);

		this.b1.addBuffer(this.b2.buffer);

		this.b1.connect(this.output);

		bufferGraph(this.b1.buffer);

		this.startArray = [this.b1];

		console.log("pitched preset 12");

	},

	// preset13 (cloud bowl)
	pitch13: function(){

		this.duration = 1;

		this.fund = 432*m2*P4*0.5;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = 1;

		this.b2.addSine(this.fund*4, 1);
		this.b2.applyRamp(0, 1, 0.01, 0.01, 0.1, 8);
		this.b2.multiply(0.125);

		// this.b1.addBuffer(this.b2.buffer);

		this.b2.addSine(this.fund*8, 1);
		this.b2.applyRamp(0, 1, 0.01, 0.01, 0.1, 8);
		this.b2.multiply(0);

		this.b1.addBuffer(this.b2.buffer);

		this.b2.makeFm(this.fund, this.fund, 1*0.25);
		this.b2.applyRamp(0, 1, 0.01, 0.01, 4, 8);

		this.b1.addBuffer(this.b2.buffer);

		this.b2.makeAm(this.fund*1, 10, 1);
		this.b2.applyRamp(0, 1, 0.01, 0.01, 0.1, 16);
		this.b2.multiply(0.125);

		this.b1.addBuffer(this.b2.buffer);

		this.b1.connect(this.output);

		bufferGraph(this.b1.buffer);

		this.startArray = [this.b1];

		console.log("pitched preset 13");

	},

	// preset14 (wave sequence pad)
	pitch14: function(){

		this.duration = 8;

		this.fund = 432*m2*P4*4;
		this.iArray = [1/m2, 1, 1/P4, 1/m6];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = 0.125;
		this.rP;

		for(var i=0; i<this.iArray.length; i++){

			this.rP = randomFloat(0.3, 0.8);

			this.b2.addSine(this.fund*this.iArray[i]*randomArrayValue([1, 2, 4]), 1);
			this.b2.applyRamp(0, 1, this.rP, this.rP, randomFloat(0.5, 4), randomFloat(0.5, 4));
			this.b2.multiply(randomFloat(0.03125, 0.0625));

			this.b1.addBuffer(this.b2.buffer);

			this.b2.makeFm(this.fund*this.iArray[i], this.fund*this.iArray[i]*randomArrayValue([0.5, 0.25]), 1*randomFloat(0.25, 0.5));
			this.b2.applyRamp(0, 1, this.rP, this.rP, randomFloat(0.5, 4), randomFloat(0.5, 4));
			this.b2.multiply(randomFloat(0.25, 0.35));

			this.b1.addBuffer(this.b2.buffer);

			this.b2.makeAm(this.fund*this.iArray[i], randomInt(5, 20), 1);
			this.b2.applyRamp(0, 1, this.rP, this.rP, randomFloat(0.5, 4), randomFloat(0.5, 4));
			this.b2.multiply(randomFloat(0.5, 1));

			this.b1.addBuffer(this.b2.buffer);

		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		bufferGraph(this.b1.buffer);

		this.startArray = [this.b1];

		console.log("pitched preset 14");

	},

	// preset15 (wave sequence pad 2)
	pitch15: function(fund, iArray){

		this.duration = 8;

		this.fund = 432*m2*P4*4;
		this.iArray = [1/m2, 1, 1/P4, 1/m6];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);

		this.b1.playbackRate = 0.125;

		this.rP;

		for(var i=0; i<this.iArray.length; i++){

			this.rP = randomFloat(0.3, 0.8);

			this.b2.makeFm(this.fund*this.iArray[i]*0.5, this.fund*this.iArray[i]*0.25, 0.5);
			this.b2.applyRamp(0, 1, this.rP, this.rP, randomFloat(0.5, 4), randomFloat(0.5, 4));
			this.b2.multiply(randomFloat(0.25, 0.35));

			this.b1.addBuffer(this.b2.buffer);

			this.b2.makeFm(this.fund*this.iArray[i]*1, this.fund*this.iArray[i]*1, 0.2);
			this.b2.applyRamp(0, 1, this.rP, this.rP, randomFloat(0.5, 4), randomFloat(0.5, 4));
			this.b2.multiply(randomFloat(0.0625, 0.125));

			this.b1.addBuffer(this.b2.buffer);

			this.b2.makeFm(this.fund*this.iArray[i]*1, this.fund*this.iArray[i]*0.5, 0.2);
			this.b2.applyRamp(0, 1, this.rP, this.rP, randomFloat(0.5, 4), randomFloat(0.5, 4));
			this.b2.multiply(randomFloat(0.0625, 0.125));

			this.b1.addBuffer(this.b2.buffer);

			this.b2.makeAm(this.fund*this.iArray[i], randomInt(5, 20), 1);
			this.b2.applyRamp(0, 1, this.rP, this.rP, randomFloat(0.5, 4), randomFloat(0.5, 4));
			this.b2.multiply(randomFloat(0.5, 1));

			this.b1.addBuffer(this.b2.buffer);

		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		bufferGraph(this.b1.buffer);

		this.startArray = [this.b1];

		console.log("pitched preset 14");

	},

	// preset16 (wave sequence pad 3)
	pitch16: function(fund, iArray){

		this.duration = 8;

		this.fund = 432*m2*P4*4;
		this.iArray = [1, M3, P5, 2];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);

		this.b1.playbackRate = 0.125;

		this.rP;

		for(var i=0; i<this.iArray.length; i++){

			this.rP = randomFloat(0.3, 0.8);

			this.b2.makeFm(this.fund*this.iArray[i]*0.5, this.fund*this.iArray[i]*0.25, 0.5);
			this.b2.applyRamp(0, 1, this.rP, this.rP, randomFloat(0.5, 4), randomFloat(0.5, 4));
			this.b2.multiply(randomFloat(0.25, 0.35));

			this.b1.addBuffer(this.b2.buffer);

			this.b2.makeFm(this.fund*this.iArray[i]*1, this.fund*this.iArray[i]*1, 0.2);
			this.b2.applyRamp(0, 1, this.rP, this.rP, randomFloat(0.5, 4), randomFloat(0.5, 4));
			this.b2.multiply(randomFloat(0.0625, 0.125));

			this.b1.addBuffer(this.b2.buffer);

			this.b2.makeFm(this.fund*this.iArray[i]*1, this.fund*this.iArray[i]*0.5, 0.2);
			this.b2.applyRamp(0, 1, this.rP, this.rP, randomFloat(0.5, 4), randomFloat(0.5, 4));
			this.b2.multiply(randomFloat(0.0625, 0.125));

			this.b1.addBuffer(this.b2.buffer);

			this.b2.makeAm(this.fund*this.iArray[i], randomInt(5, 20), 1);
			this.b2.applyRamp(0, 1, this.rP, this.rP, randomFloat(0.5, 4), randomFloat(0.5, 4));
			this.b2.multiply(randomFloat(0.5, 1));

			this.b1.addBuffer(this.b2.buffer);

		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		bufferGraph(this.b1.buffer);

		this.startArray = [this.b1];

		console.log("pitched preset 16");

	},

	// preset17 (steel drum)
	pitch17: function(){

		this.duration = 1;

		this.fund = 432;
		this.rate = 1;
		this.cArray = [1, 2, 4, P5*2];
		this.mArray = [10, 5, 3, 4];
		this.hGArray = [1, 0.5, 0.25, 0.15];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cArray.length; i++){

			this.b2.makeAm(this.fund*this.cArray[i], this.mArray[i], 1);
			this.b2.applyRamp(0, 1, 0.01, 0.01, 0.001, 3);
			this.b2.multiply(this.hGArray[i]);

			this.b1.addBuffer(this.b2.buffer);

		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

		console.log("pitched preset 17");

	},

	// preset18 (fm chord key)
	pitch18: function(){

		this.duration = 1;

		this.fund = 432*0.125;
		this.rate = 1;
		this.cArray = [1, 2, 4, 3, P5, M3];
		this.mArray = [1, 2, 4, 3, P5, M3];
		this.hGArray = [1, 0.5, 0.25, 0.15, 0.2, 0.3];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cArray.length; i++){

			this.b2.makeFm(this.fund*this.cArray[i], this.fund*this.mArray[i], 0.3);
			this.b2.applyRamp(0, 1, 0.01, 0.01, 0.001, 3);
			this.b2.multiply(this.hGArray[i]);

			this.b1.addBuffer(this.b2.buffer);

		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

		console.log("pitched preset 18");

	},

	// preset 19 (noise tone)
	pitch19: function(){

		this.duration = 1;

		this.fund = 432*0.0625;
		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);

		this.b1.playbackRate = this.rate;

		//

		this.cF = 500;
		this.bW = 500;
		this.lF = parseInt(this.cF-(this.bW*0.5));
		this.hF = parseInt(this.cF+(this.bW*0.5));

		for(var i=0; i<this.bW; i++){

			if(i<parseInt(this.bW*0.5)){
				this.b1.addSine(i+this.lF, Math.pow(i/(this.bW*0.5)*randomFloat(0.5, 1), 16));
			}

			else if(i>=parseInt(this.bW*0.5)){
				this.b1.addSine((i-(this.bW*0.5))+this.cF, Math.pow(((this.bW*0.5)-i)/(this.bW*0.5)*randomFloat(0.5, 1), 16));
			}


		}

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 20 (am chord)
	pitch20: function(){

		this.duration = 1;

		this.fund = 432;
		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);

		this.b1.playbackRate = this.rate;

		this.iArray = [1, M3, P5, 2];

		for(var i=0; i<this.iArray.length; i++){
			this.b1.addSine(this.fund*this.iArray[i], 1);
		}

		for(var i=0; i<this.iArray.length; i++){
			this.b2.addSine(this.fund*this.iArray[i]*randomFloat(0.99, 1.01), 1);
		}

		this.b1.subtractBuffer(this.b2.buffer);

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 21 (mallet horn)
	pitch21: function(){

		this.duration = 2;

		this.fund = 432*0.5;
		this.rate = 0.5;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b3 = new MyBuffer(1, 1, audioCtx.sampleRate);

		this.b1.playbackRate = this.rate;

		this.iArray = [1, M3, P5, 2];

		for(var i=0; i<this.iArray.length; i++){
			this.b3.makeFm(this.fund*this.iArray[i], this.fund*this.iArray[i], 1);
			this.b1.addBuffer(this.b3.buffer);
		}

		for(var i=0; i<this.iArray.length; i++){
			this.b2.makeAm(this.fund*this.iArray[i]*randomFloat(0.99, 1.01), this.fund*this.iArray[i]*randomFloat(0.99, 1.01), randomFloat(0.25, 0.5));
			this.b2.applyRamp(randomFloat(0, 0.35), randomFloat(0.6, 1), randomFloat(0.35, 0.5), randomFloat(0.5, 0.75), randomFloat(0.5, 3), randomFloat(0.5, 3));
			this.b1.subtractBuffer(this.b2.buffer);
		}

		this.f1 = new MyBiquad("lowpass", 3000, 1);

		this.b1.applyRamp(0, 1, 0.01, 0.02, 3, 8);

		this.b1.normalize(-1, 1);

		this.b1.connect(this.f1);
		this.f1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 22 (fm horn swell)
	pitch22: function(){

		this.duration = 2;

		this.fund = 432*0.5;
		this.rate = 0.5;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b3 = new MyBuffer(1, 1, audioCtx.sampleRate);

		this.b1.playbackRate = this.rate;

		this.iArray = [1, M3, P5, 2];

		for(var i=0; i<this.iArray.length; i++){
			this.b3.makeFm(this.fund*this.iArray[i], this.fund*this.iArray[i], 1);
			this.b1.addBuffer(this.b3.buffer);
		}

		for(var i=0; i<this.iArray.length; i++){
			this.b2.makeAm(this.fund*this.iArray[i]*randomFloat(0.99, 1.01), this.fund*this.iArray[i]*randomFloat(0.99, 1.01), randomFloat(0.25, 0.5));
			this.b2.applyRamp(randomFloat(0, 0.35), randomFloat(0.6, 1), randomFloat(0.35, 0.5), randomFloat(0.5, 0.75), randomFloat(0.5, 3), randomFloat(0.5, 3));
			this.b1.subtractBuffer(this.b2.buffer);
		}

		this.f1 = new MyBiquad("lowpass", 3000, 1);

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.normalize(-1, 1);

		this.b1.connect(this.f1);
		this.f1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 23
	pitch23: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 40;

		this.intA = [1, 1.5];
		this.nHA =  [1, 4];

		for(var i=0; i<this.intA.length; i++){

				for(var j=0; j<this.nHA[i]+1; j++){

					this.b1.addSine(this.fund*(this.intA[i]*j), 1/j);

				}

			}

			this.b1.normalize(-1, 1);

			this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 8);

			this.b1.connect(this.output);

			this.startArray = [this.b1];

			bufferGraph(this.b1.buffer);

		},

	// preset 24
	pitch24: function(){

		this.duration = 1;

		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 100;

		this.intA = [1, 1.7, 3];
		this.nHA =  [1, 10, 11];
		this.gA = [1, 1, 0.5];

		for(var i=0; i<this.intA.length; i++){

			for(var j=0; j<this.nHA[i]+1; j++){

				this.b1.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);

			}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 8);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 25
	pitch25: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 100;

		this.intA = [1, 1.7];
		this.nHA =  [3, 5];
		this.gA =   [1, 1];

		for(var i=0; i<this.intA.length; i++){

				for(var j=0; j<this.nHA[i]+1; j++){

					this.b1.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);
					this.b1.addSine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);

				}

			}

			this.b1.normalize(-1, 1);

			this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 8);

			this.b1.connect(this.output);

			this.startArray = [this.b1];

			bufferGraph(this.b1.buffer);

		},

	// preset 26 (warm pad)
	pitch26: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 100;

		this.intA = [1, 1.7];
		this.nHA =  [3, 5];
		this.gA =   [1, 1];

		for(var i=0; i<this.intA.length; i++){

			for(var j=0; j<this.nHA[i]+1; j++){

				this.b1.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);
				this.b1.addSine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);

			}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 27 (warm pad 2)
	pitch27: function(){

		this.duration = 4;

		this.rate = 0.25;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 400;

		this.intA = [1, 1.5];
		this.nHA =  [3, 5];
		this.gA =   [1, 1];

		for(var i=0; i<this.intA.length; i++){

				for(var j=0; j<this.nHA[i]+1; j++){

					this.b1.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);
					this.b1.addSine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);

				}

			}

			this.b1.normalize(-1, 1);

			this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

			this.b1.connect(this.output);

			this.startArray = [this.b1];

			bufferGraph(this.b1.buffer);

		},

	// preset 28 (nice pad)
	pitch28: function(){

		this.duration = 4;

		this.rate = 0.25;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 400/m2/P5;

		this.intA = [1, 2.405797, 3.608695652173913];
		this.nHA =  [3, 5, 3];
		this.gA =   [1, 1, 1];

		for(var i=0; i<this.intA.length; i++){

				for(var j=0; j<this.nHA[i]+1; j++){

					this.b1.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);
					this.b1.addSine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);

				}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 29 (heaven pad)
	pitch29: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 400/m2/P5;

		this.intA = [1, 2.405797, 3.608695652173913];
		this.nHA =  [3, 5, 3];
		this.gA =   [1, 1, 1];

		for(var i=0; i<this.intA.length; i++){

				for(var j=0; j<this.nHA[i]+1; j++){

					this.b1.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);
					this.b1.addSine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);

				}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 30 (sequence shape mallet)
	pitch30: function(){

	this.fund = 400/m2/P5;

	this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
	this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
	this.b1.playbackRate = 1;

	this.b2.addSine(this.fund*4, 1);
	this.b2.applyRamp(0, 1, 0.01, 0.01, 0.1, 8);
	this.b2.multiply(0.125);

	this.b2.addSine(this.fund*8, 1);
	this.b2.applyRamp(0, 1, 0.01, 0.01, 0.1, 8);
	this.b2.multiply(0);

	this.b1.addBuffer(this.b2.buffer);

	this.b2.makeFm(this.fund, this.fund, 1*0.25);
	this.b2.applyRamp(0, 1, 0.01, 0.01, 4, 8);

	this.b1.addBuffer(this.b2.buffer);

	this.b2.makeAm(this.fund*1, randomInt(5, 20), 1);
	this.b2.applyRamp(0, 1, 0.01, 0.01, 0.1, 16);
	this.b2.multiply(0.125);

	this.b1.addBuffer(this.b2.buffer);

	this.w = new Effect();
	this.w.fmShaper(this.fund*1, this.fund*0.5, 1, 0.001);
	this.w.on();
	this.w.output.gain.value = 0.8;

	//

	this.b1.normalize(-1, 1);

	this.b1.connect(this.w);
	this.w.connect(this.output);

	this.startArray = [this.b1];

},

	// preset 31 (sequence shape horn)
	pitch31: function(){

		this.fund = 400/m2/P5;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = 1;

		this.b2.addSine(this.fund*4, 1);
		this.b2.applyRamp(0, 1, 0.075, 0.075, 3, 8);
		this.b2.multiply(0.125);

		this.b2.addSine(this.fund*8, 1);
		this.b2.applyRamp(0, 1, 0.075, 0.075, 4, 8);
		this.b2.multiply(0);

		this.b1.addBuffer(this.b2.buffer);

		this.b2.makeFm(this.fund, this.fund, 1*0.25);
		this.b2.applyRamp(0, 1, 0.075, 0.075, 4, 8);

		this.b1.addBuffer(this.b2.buffer);

		this.b2.makeAm(this.fund*1, randomInt(5, 20), 1);
		this.b2.applyRamp(0, 1, 0.075, 0.075, 2, 16);
		this.b2.multiply(0.125);

		this.b1.addBuffer(this.b2.buffer);

		this.w = new Effect();
		this.w.fmShaper(this.fund*1, this.fund*0.25, 1, 0.00175);
		this.w.on();
		this.w.output.gain.value = 0.5;

		//

		this.b1.normalize(-1, 1);

		this.b1.connect(this.w);
		this.w.connect(this.output);

		this.startArray = [this.b1];

	},

	// preset 32 (ominous low)
	pitch32: function(){

		this.duration = 4;

		this.rate = 0.25;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 400/P4*0.5;

		this.intA = [1];
		this.nHA =  [10];
		this.gA =   [1];

		for(var i=0; i<this.intA.length; i++){

				for(var j=0; j<this.nHA[i]+1; j++){

					this.b1.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);
					this.b1.applySine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);

				}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 33 (struck pluck)
	pitch33: function(){

		this.duration = 4;

		this.rate = 0.25;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 400/P4*2;

		this.intA = [1, 3];
		this.nHA =  [20, 10];
		this.gA =   [1, 0.5];

		for(var i=0; i<this.intA.length; i++){

				for(var j=0; j<this.nHA[i]+1; j++){

					this.b2.makeConstant(0);

					this.b2.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);
					this.b2.addSine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);

					this.b1.addBuffer(this.b2.buffer);

				}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.01, 0.01, 0.1, 8);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 34 (rich and bright)
	pitch34: function(){

		this.rate = 0.25;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 400/P4*1;

		this.intA = [1, 3, 5];
		this.nHA =  [20, 10, 20];
		this.gA =   [1, 0.5, 0.25];

		for(var i=0; i<this.intA.length; i++){

				for(var j=0; j<this.nHA[i]+1; j++){

					this.b2.makeConstant(0);

					this.b2.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);
					this.b2.addSine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);

					this.b1.addBuffer(this.b2.buffer);

				}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.01, 0.01, 0.1, 8);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 35 (beautiful rich)
	pitch35: function(){

		this.rate = 0.125;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 400/P4*0.5;

		this.intA = [1, 3, 5];
		this.nHA =  [4, 4, 4];
		this.gA =   [1, 0.5, 0.25];

		for(var i=0; i<this.intA.length; i++){

				for(var j=0; j<this.nHA[i]+1; j++){

					this.b2.makeConstant(0);

					this.b2.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);
					this.b2.addSine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);
					this.b2.applySine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);

					this.b1.addBuffer(this.b2.buffer);

				}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 36 (wobble heaven key)
	pitch36: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 0.5*400/m2/P5;

		this.intA = [1, 2.405797, 3.608695652173913];
		this.nHA =  [3, 5, 3];
		this.gA =   [1, 1, 1];

		for(var i=0; i<this.intA.length; i++){

				for(var j=0; j<this.nHA[i]+1; j++){

					this.b1.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);
					this.b1.addSine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);

				}

			}

			this.b1.normalize(-1, 1);
			// this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

			this.b2.addSine(5, 1);
			this.b2.applyRamp(0, 1, 0.01, 0.02, 0.1, 6);

			this.b1.multiplyBuffer(this.b2.buffer);

			this.b1.connect(this.output);

			this.startArray = [this.b1];

			bufferGraph(this.b1.buffer);

		},

	// preset 37 (shaky noise key)
	pitch37: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1.1, audioCtx.sampleRate);
		this.b3 = new MyBuffer(1, 1.1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 400/m2/P5;

		this.intA = [1, 2.405797, 3.608695652173913];
		this.nHA =  [3, 5, 3];
		this.gA =   [1, 1, 1];

		for(var i=0; i<this.intA.length; i++){

			for(var j=0; j<this.nHA[i]+1; j++){

				this.b1.addSine(this.fund*(this.intA[i]*j), this.gA[i]/j);
				this.b1.addSine(this.fund*(this.intA[i]*j)*randomFloat(0.99, 1.01), this.gA[i]/j);

			}

		}

		this.b1.normalize(-1, 1);

		for(var i=0; i<3; i++){

			this.b2.makeConstant(0);
			this.b2.addSine((this.fund*randomInt(1, 5))/randomFloat(20, 35), 1);
			this.b2.applyRamp(0, 1, randomFloat(0.01, 0.5), randomFloat(0.5, 0.7), randomFloat(0.1, 2), randomFloat(1, 6));

			this.b3.addBuffer(this.b2.buffer);

		}

		this.b1.multiplyBuffer(this.b3.buffer);

		this.b3.makeNoise();
		this.b3.multiply(0.01);

		this.b1.addBuffer(this.b3.buffer);

		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 6);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 38 (rich dot)
	pitch38: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 400;

		this.iA = [1, 2, 3, 4];
		this.bwA = [6, 8, 10, 20];
		this.gA = [1, 1, 1, 1];

		for(var i=0; i<this.iA.length; i++){

			for(var j=0; j<parseInt(this.bwA[i]); j++){

				this.f = j+((this.fund*this.iA[i])-(parseInt(this.bwA[i]*0.5)));
				this.b1.addSine(this.f, this.gA[i]);

			}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 6);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 39 (formant organ)
	pitch39: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 100;

		this.iA = [1, 2, 3, 4];
		this.bwA = [6, 8, 10, 20];
		this.gA = [1, 1, 1, 1];

		for(var i=0; i<this.iA.length; i++){

			for(var j=0; j<parseInt(this.bwA[i]); j++){

				this.f = j+((this.fund*this.iA[i])-(parseInt(this.bwA[i]*0.5)));
				this.b1.addSine(this.f, randomFloat(0.25, 1));
				this.b1.addSine(this.f*randomFloat(0.99, 1.01), randomFloat(0.25, 1));

			}

		}

		this.b1.applyRamp(0, 1, 0.5, 0.5, 2, 2);

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 40 (formant dot)
	pitch40: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 200;

		this.iA = [1, 2, 3, 4];
		this.bwA = [6, 8, 10, 20];
		this.gA = [1, 1, 1, 1];

		for(var i=0; i<this.iA.length; i++){

			for(var j=0; j<parseInt(this.bwA[i]); j++){

				this.f = j+((this.fund*this.iA[i])-(parseInt(this.bwA[i]*0.5)));
				this.b1.addSine(this.f, randomFloat(0.25, 1));
				this.b1.addSine(this.f*randomFloat(0.99, 1.01), randomFloat(0.25, 1));

			}

		}

		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 41 (distorted dot)
	pitch41: function(){

		this.duration = 1;

		this.fund = 432*0.25;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = 4;

		this.f = new MyBiquad("notch", this.fund, 5);
		this.f2 = new MyBiquad("lowpass", 800, 1);

		this.w = new MyWaveShaper();
		this.w.makeSigmoid(20);

		this.w2 = new Effect();
		this.w2.fmShaper(this.fund*0.25, this.fund*0.5, 1, 0.0005);
		this.w2.on();

		this.d = new Effect();
		this.d.randomEcho();
		this.d.on();
		this.d.output.gain.value = 0.3;

		this.d2 = new Effect();
		this.d2.randomShortDelay();
		this.d2.on();
		this.d2.output.gain.value = 0.4;

		this.cFA = [1,    1,   , 6.375];
		this.mFA = [4.75, 6.375, 1];
		this.mGA = [0.25, 0.25,  0.5];

		for(var i=0; i<this.cFA.length; i++){

			this.b2.makeFm(this.cFA[i]*this.fund, this.mFA[i]*this.fund, this.mGA[i]);
			this.b2.applyRamp(0, 1, 0.01, 0.02, 0.1, 10);

			this.b1.addBuffer(this.b2.buffer);

		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.f);
		this.f.connect(this.f2);
		this.f2.connect(this.w);
		this.w.connect(this.w2);

		this.w2.connect(this.d);
		this.w2.connect(this.d2);

		this.w2.connect(this.output);
		this.d.connect(this.output);
		this.d2.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 42 (detune key)
	pitch42: function(){

		this.duration = 1;

		this.fund = 300.9734898397411;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
	  this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = 1;

	  this.b1.connect(this.output);

	  this.nH = 10;

	  for(var i=0; i<this.nH; i++){

	    this.b2.addSine(this.fund*randomFloat(0.98, 1.02), 1);

	    this.b1.addBuffer(this.b2.buffer);

	  }

	  this.b1.normalize(-1, 1);

	  this.b1.applyRamp(0, 1, 0.1, 0.15, 0.1, 8);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 43 (detune fm)
	pitch43: function(){

		this.duration = 1;

		this.fund = 300.9734898397411*1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = 1;

		this.b1.connect(this.output);

		this.nH = 10;

		for(var i=0; i<this.nH; i++){

			this.b2.makeFm(this.fund*randomFloat(0.98, 1.02), this.fund*randomFloat(0.98, 1.02), randomFloat(0.5, 2));

			this.b1.addBuffer(this.b2.buffer);

		}

		this.b1.normalize(-1, 1);

  	this.b1.applyRamp(0, 1, 0.1, 0.12, 4, 8);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 44 (detune fm pad)
	pitch44: function(){

		this.duration = 4;

		this.fund = 300.9734898397411*1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = 0.25;

		this.b1.connect(this.output);

		this.cArray = [1, 2, 2*P5, 4];
		this.nH = 10;

		for(var i=0; i<this.cArray.length; i++){

	    for(var j=0; j<this.nH; j++){

	      this.b2.makeConstant(0);
	      this.b2.makeFm(this.fund*this.cArray[i]*randomFloat(0.98, 1.02), this.fund*this.cArray[i]*randomFloat(0.98, 1.02), randomFloat(0.1, 0.5));
	      this.b2.applySine(0.5*randomArrayValue([1, 2, 4]));

	      this.b1.addBuffer(this.b2.buffer);

	    }

	  }

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.5, 0.5, 2, 8);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset45 (sine formants)
	pitch45: function(){

		this.fund = 300.9734898397411*1;

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.iA = [1, 2, 3];
		// this.bwA = [6, 8, 10, 20];
		this.gA = [1, 1, 1, 1];
		this.rBW;

		for(var i=0; i<this.iA.length; i++){

			this.rBW = 20;

			for(var j=0; j<this.rBW; j++){

				this.f = j+((this.fund*this.iA[i])-(this.rBW*0.5));

				this.b1.addSine(this.f, randomFloat(0.1, 1));
				this.b1.addSine(this.f*randomFloat(0.99, 1.01), 1);

			}

		}

		this.b1.applyRamp(0, 1, 0.5, 0.5, 2, 0.5);
		this.b1.applyRamp(0, 1, 0.5, 0.5, 2, 0.5);

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

	},

	// preset46 (sine formant key)
	pitch46: function(){

		this.fund = 300.9734898397411*1;

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.iA = [1, 2, 3];
		// this.bwA = [6, 8, 10, 20];
		this.gA = [1, 1, 1, 1];
		this.rBW;

		for(var i=0; i<this.iA.length; i++){

			this.rBW = 20;

			for(var j=0; j<this.rBW; j++){

				this.f = j+((this.fund*this.iA[i])-(this.rBW*0.5));

				this.b1.addSine(this.f, randomFloat(0.1, 1));
				this.b1.addSine(this.f*randomFloat(0.99, 1.01), 1);

			}

		}

		// this.b1.applyRamp(0, 1, 0.5, 0.5, 2, 0.5);
		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

	},

	// preset47 (splice pad)
	pitch47: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b3 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = 200;
		this.b1.loop = true;

		this.b1.makeConstant(0);

		this.fund = 300;
		this.nSA = [100, 100, 100];
		this.fA = [1, 4.75, 6.375];

		for(var j=0; j<this.fA.length; j++){

			this.b3.makeConstant(0);

			for(var i=0; i<this.nSA[j]; i++){

				this.b2.makeConstant(0);
				this.b2.addSine(this.fA[j]*randomFloat(0.995024876, 1.00502513), randomFloat(0.1, 1));

				this.b3.spliceBuffer(this.b2.buffer, i/this.nSA[j], (i+1)/this.nSA[j], i/this.nSA[j]);

			}

			this.b1.addBuffer(this.b3.buffer);

		}

		this.b1.normalize(-1, 1);

		this.eB = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.eG = new MyGain(0);
		this.eB.makeRamp(0, 1, 0.5, 0.5, 1, 1);
		this.eB.playbackRate = this.rate;

		this.b1.connect(this.eG); this.eB.connect(this.eG.gain.gain);
		this.eG.connect(this.output);

		this.b1.start();

		this.startArray = [this.eB];

		bufferGraph(this.b1.buffer);

	},

	// preset48 (splice pluck)
	pitch48: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b3 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = 200;
		this.b1.loop = true;

		this.b1.makeConstant(0);

		this.fund = 300;
		this.nSA = [100, 100, 100];
		this.fA = [1, 4.75, 6.375];

		for(var j=0; j<this.fA.length; j++){

			this.b3.makeConstant(0);

			for(var i=0; i<this.nSA[j]; i++){

				this.b2.makeConstant(0);
				this.b2.addSine(this.fA[j]*randomFloat(0.995024876, 1.00502513), randomFloat(0.1, 1));

				this.b3.spliceBuffer(this.b2.buffer, i/this.nSA[j], (i+1)/this.nSA[j], i/this.nSA[j]);

			}

			this.b1.addBuffer(this.b3.buffer);

		}

		this.b1.normalize(-1, 1);

		this.eB = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.eG = new MyGain(0);
		this.eB.makeRamp(0, 1, 0.1, 0.15, 0.1, 8);
		this.eB.playbackRate = this.rate;

		this.b1.connect(this.eG); this.eB.connect(this.eG.gain.gain);
		this.eG.connect(this.output);

		this.b1.start();

		this.startArray = [this.eB];

		bufferGraph(this.b1.buffer);

	},

	// preset49 (flute shape)
	pitch49: function(){

		this.duration = 1;

		this.fund = 75.9375;

		this.o = new MyOsc("sine", this.fund*P4*m2*2);

		this.t = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.t.playbackRate = 2.7482829957236223; // 20*randomFloat(0.125, 0.25);
		this.t.makeTriangle();

		this.tF = new MyBiquad("lowpass", 10, 1);
		this.tG = new MyGain(0);

		this.s = new MyWaveShaper();
		this.s.makeFm(6.152804112338611, 0.25346180312232277, 1); // randomFloat(5, 7.1), randomFloat(0.1, 0.31), 1
		this.sIG = new MyGain(0.1);
		this.sOG = new MyGain(0.5);
		this.sF = new MyBiquad("highpass", 10, 1);

		this.dly = new MyStereoDelay(0.25, 0.11, 0.25, 0.6);

		this.f = new MyBiquad("highpass", 80, 1);
		this.f2 = new MyBiquad("lowpass", 20000, 1);
		this.f3 = new MyBiquad("lowshelf", 100, 1);
		this.f3.biquad.gain.value = -3; // -2.5

		this.f4 = new MyBiquad("lowshelf", 146.52, 1);
		this.f4.biquad.gain.value = -2; // -1.59
		this.f5 = new MyBiquad("peaking", 180.19, 2.534);
		this.f5.biquad.gain.value = -3; // -2.29
		this.f6 = new MyBiquad("peaking", 514.78, 1);
		this.f6.biquad.gain.value = -1.8; // -1.8

		this.t.connect(this.tF);
		this.o.connect(this.tG); this.tF.connect(this.tG.gain.gain);
		this.tG.connect(this.sIG);
		this.sIG.connect(this.s);
		this.s.connect(this.sF);
		this.sF.connect(this.sOG);

		this.sOG.connect(this.dly);

		this.dly.connect(this.f);
		this.f.connect(this.f2);
		this.f2.connect(this.f3);
		this.f3.connect(this.f4);
		this.f4.connect(this.f5);
		this.f5.connect(this.f6);

		this.f6.connect(this.output);

		this.o.start();

		this.startArray = [this.t];

	},

	// preset50 (flute shape stacatto)
	pitch50: function(fund){

		this.duration = 1;

		this.fund = 75.9375;

		this.o = new MyOsc("sine", this.fund*P4*m2*2);

		this.t = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.t.playbackRate = 2.7482829957236223; // 20*randomFloat(0.125, 0.25);
		this.t.makeRamp(0, 1, 0.015, 0.02, 0.1, 8);

		this.tF = new MyBiquad("lowpass", 10, 1);
		this.tG = new MyGain(0);

		this.s = new MyWaveShaper();
		this.s.makeFm(6.152804112338611, 0.25346180312232277, 1); // randomFloat(5, 7.1), randomFloat(0.1, 0.31), 1
		this.sIG = new MyGain(0.1);
		this.sOG = new MyGain(0.5);
		this.sF = new MyBiquad("highpass", 10, 1);

		this.dly = new MyStereoDelay(0.25, 0.11, 0.25, 0.6);

		this.f = new MyBiquad("highpass", 80, 1);
		this.f2 = new MyBiquad("lowpass", 20000, 1);
		this.f3 = new MyBiquad("lowshelf", 100, 1);
		this.f3.biquad.gain.value = -3; // -2.5

		this.f4 = new MyBiquad("lowshelf", 146.52, 1);
		this.f4.biquad.gain.value = -2; // -1.59
		this.f5 = new MyBiquad("peaking", 180.19, 2.534);
		this.f5.biquad.gain.value = -3; // -2.29
		this.f6 = new MyBiquad("peaking", 514.78, 1);
		this.f6.biquad.gain.value = -1.8; // -1.8

		this.t.connect(this.tF);
		this.o.connect(this.tG); this.tF.connect(this.tG.gain.gain);
		this.tG.connect(this.sIG);
		this.sIG.connect(this.s);
		this.s.connect(this.sF);
		this.sF.connect(this.sOG);

		this.sOG.connect(this.dly);

		this.dly.connect(this.f);
		this.f.connect(this.f2);
		this.f2.connect(this.f3);
		this.f3.connect(this.f4);
		this.f4.connect(this.f5);
		this.f5.connect(this.f6);

		this.f6.connect(this.output);

		this.o.start();

		this.startArray = [this.t];

	},

	// preset51 (sk pad)
	pitch51: function(fund){

		this.duration = 1;

		this.fund = 432*0.25*P5;

		this.o = new MyOsc("sine", this.fund);

		this.t = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.t.playbackRate = randomFloat(0.125, 0.25); // 20*randomFloat(0.125, 0.25);
		this.t.makeRamp(0, 1, 0.5, 0.5, 1, 1);

		this.tF = new MyBiquad("lowpass", 10, 1);
		this.tG = new MyGain(0);

		this.s = new MyWaveShaper();
		this.s.makeFm(randomFloat(5, 7.1), randomFloat(0.1, 0.31), 1);
		this.sIG = new MyGain(0.2);
		this.sOG = new MyGain(0.5);
		this.sF = new MyBiquad("highpass", 10, 1);

		this.dly = new MyStereoDelay(0.25, 0.11, 0.2, 1);
		this.dly2 = new MyStereoDelay(0.4, 0.55, 0.25, 1);

		//-----------------------------------

		this.nFX = 4;
		this.fXG = new MyGain(1);

		this.fx = new MultiEffect(this.nFX);
		this.fx.effects[0].effect.randomShortDelay();
		this.fx.effects[1].effect.randomShortDelay();
		this.fx.effects[2].effect.randomShortDelay();
		this.fx.effects[3].effect.randomShortDelay();


		for(var i=0; i<this.nFX; i++){
			this.fXG.connect(this.fx.effects[i].effect);
			this.fx.effects[i].effect.output.gain.value = 1/this.nFX;
			this.fx.effects[i].effect.connect(this.output);
			this.fx.effects[i].effect.on();
		}

		//-----------------------------------

		this.fx2 = new MultiEffect(this.nFX);
		this.fx2.effects[0].effect.randomEcho();
		this.fx2.effects[1].effect.randomEcho();
		this.fx2.effects[2].effect.randomEcho();
		this.fx2.effects[3].effect.randomEcho();


		for(var i=0; i<this.nFX; i++){
			this.fXG.connect(this.fx2.effects[i].effect);
			this.fx2.effects[i].effect.output.gain.value = 1/this.nFX;
			this.fx2.effects[i].effect.connect(this.output);
			this.fx2.effects[i].effect.on();
		}

		//-----------------------------------

		this.f = new MyBiquad("lowshelf", 500, 0);
		this.f.biquad.gain.value = -12;
		this.f2 = new MyBiquad("highpass", 51, 0);
		this.f3 = new MyBiquad("lowpass", 6300, 0);

		this.t.connect(this.tF);
		this.o.connect(this.tG); this.tF.connect(this.tG.gain.gain);
		this.tG.connect(this.sIG);
		this.sIG.connect(this.s);
		this.s.connect(this.sF);
		this.sF.connect(this.sOG);

		this.sOG.connect(this.f);
		this.sOG.connect(this.dly);
		this.sOG.connect(this.dly2);

		this.dly.connect(this.f);
		this.dly2.connect(this.f);

		this.f.connect(this.f2);
		this.f2.connect(this.f3);

		this.f3.connect(this.fXG);

		this.f3.connect(this.output);

		this.o.start();

		this.startArray = [this.t];

	},

	// preset52 (shaper EP)
	pitch52: function(){

		this.fund = 598*0.5;

	  // TONE

	    this.t = new MyOsc("sine", this.fund);

	  // BREAKPOINT AM

	    // AM Breakpoint

	      this.aE = new MyBuffer(1, 1, audioCtx.sampleRate);
				this.aE.makeRamp(0, 1, 0.01, 0.02, 0.1, 4);
				this.aE.playbackRate = 1;

	      this.aG = new MyGain(0);

	    // waveshaper AM Breakpoint

	      this.wE = new MyBuffer(1, 1, audioCtx.sampleRate);
				this.wE.makeRamp(0, 1, 0.01, 0.02, 0.1, 4);
	      this.wE.playbackRate = 1;
	      this.wE.output.gain.value = 0.0003;

	      this.w = new MyWaveShaper();
	      this.wG = new MyGain(0);
	      this.w.makeFm(this.fund*2, this.fund*4, 1);

			// envelope filters

				this.wEF = new MyBiquad("lowpass", 500, 1);
				this.aEF = new MyBiquad("lowpass", 500, 1);

			// tone filter

				this.f = new MyBiquad("lowpass", 1500, 1);

	  // CONNECTIONS

	    // tone - am - shaper am - shaper
	                               this.aE.connect(this.aEF);
	      this.t.connect(this.aG); this.aEF.connect(this.aG.gain.gain);

	                                this.wE.connect(this.wEF);
	      this.aG.connect(this.wG); this.wEF.connect(this.wG.gain.gain);
	      this.wG.connect(this.w);

	    // to master gain
	    	this.w.connect(this.f);
				this.f.connect(this.output);

		this.t.start();

		this.startArray = [this.aE, this.wE];

	},

	// preset53 (shape strum)
	pitch53: function(){

		this.fund = 200*P4;
		this.panVal = 0;

		// bPS

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.01, 0.0125, 0.5, 30);
		this.bPE.playbackRate = 1;

		bufferGraph(this.bPE.buffer);

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(107, 20, 1);
		this.s1G = new MyGain(0.1);

		this.sF = new MyBiquad("highshelf", 3000, 1);
		this.sF.biquad.gain.value = -8;
		this.sF2 = new MyBiquad("lowpass", 3000, 1);
		this.sF3 = new MyBiquad("highpass", 5, 1);

		this.w = new MyWaveShaper();
		this.w.makeSigmoid(5);
		this.wD = new MyStereoDelay(randomFloat(0.001, 0.01), randomFloat(0.001, 0.01), 0.1, 1);
		this.wD.output.gain.value = 0.2;

		// fToneShapeDelay2 (from "tension atlas")

		this.dly = new MyStereoDelay(randomFloat(0.01, 0.035), randomFloat(0.01, 0.035), randomFloat(0.05, 0.1), 1);
		this.f = new MyBiquad("bandpass", this.fund, 50);
		this.p = new MyPanner2(this.panVal);
		this.sG = new MyGain(0.03125*0.15);
		this.s = new MyWaveShaper();
		this.s.makeFm(this.fund, this.fund*2, 1);
		this.f2 = new MyBiquad("highpass", 10, 1);

		// FX

		this.sD = new MyStereoDelay(0.172413793*2, 0.172413793, 0.1, 1);
		this.sD.output.gain.value = 0.2;

		this.d2 = new MyStereoDelay(randomFloat(0.005, 0.02), randomFloat(0.005, 0.02), randomFloat(0.025, 0.075), 1);
		this.d2.output.gain.value = 0.2;

		this.f3 = new MyBiquad("lowshelf", 200, 1);
		this.f3.biquad.gain.value = -4;

		this.f4 = new MyBiquad("lowpass", 1000, 1);

		// CONNECTIONS

		this.bPE.connect(this.s1G);
		this.s1G.connect(this.s1);
		this.s1.connect(this.sF);
		this.sF.connect(this.sF2);

		this.sF2.connect(this.sF3);

		this.sF2.connect(this.w);
		this.w.connect(this.wD);
		this.wD.connect(this.sF3);

		this.sF3.connect(this.f);

		this.f.connect(this.sG);
		this.sG.connect(this.s);
		this.s.connect(this.dly);
		this.dly.connect(this.p);
		this.p.connect(this.f2);

		this.f2.connect(this.f3);

		this.f3.connect(this.sD);
		this.f3.connect(this.d2);

		this.f3.connect(this.f4);
		this.sD.connect(this.f4);
		this.d2.connect(this.f4);

		this.f4.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 54 (pipe bass)
	pitch54: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.1, 0.15, 0.1, 20);
		this.bPE.playbackRate = 1;

		this.f = new MyBiquad("lowpass", 200, 1);
		this.f2 = new MyBiquad("lowpass", 1000, 1);

		this.sh = new SemiOpenPipe(50);

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(400, 10, 1);
		this.s1G = new MyGain(0.1);

		bufferGraph(this.bPE.buffer);

		// CONNECTIONS

		this.bPE.connect(this.f);
		this.f.connect(this.sh);
		this.sh.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.f2);

		this.f2.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 55 (pipe pluck)
	pitch55: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.1, 0.15, 0.1, 20);
		this.bPE.playbackRate = 1;

		this.f = new MyBiquad("lowpass", 200, 1);
		this.f2 = new MyBiquad("lowpass", 1000, 1);

		this.sh = new SemiOpenPipe(100);

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(100, 10, 1);
		this.s1G = new MyGain(0.1);

		bufferGraph(this.bPE.buffer);

		// CONNECTIONS

		this.bPE.connect(this.f);
		this.f.connect(this.sh);
		this.sh.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.f2);

		this.f2.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 56 (stiff pipe pluck)
	pitch56: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.1, 0.15, 0.1, 20);
		this.bPE.playbackRate = 1;

		this.f = new MyBiquad("lowpass", 20000, 1);
		this.f2 = new MyBiquad("lowpass", 20000, 1);

		this.sh = new SemiOpenPipe(800);

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(200, 13, 1);
		this.s1G = new MyGain(0.1);

		bufferGraph(this.bPE.buffer);

		// CONNECTIONS

		this.bPE.connect(this.f);
		this.f.connect(this.sh);
		this.sh.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.f2);

		this.f2.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 57 (reso pipe pluck)
	pitch57: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.1, 0.15, 0.1, 20);
		this.bPE.playbackRate = 1;

		this.f = new MyBiquad("lowpass", 20000, 1);
		this.f2 = new MyBiquad("lowpass", 20000, 1);

		this.sh = new SemiOpenPipe(200);

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(500, 13, 1);
		this.s1G = new MyGain(0.05);

		bufferGraph(this.bPE.buffer);

		// CONNECTIONS

		this.bPE.connect(this.f);
		this.f.connect(this.sh);
		this.sh.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.f2);

		this.f2.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 58 (reso pipe pluck)
	pitch58: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.1, 0.15, 0.1, 20);
		this.bPE.playbackRate = 100;

		this.f = new MyBiquad("lowpass", 20000, 1);
		this.f2 = new MyBiquad("lowpass", 20000, 1);

		this.p = new SemiOpenPipe(100);

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(1000, 13.2, 1);
		this.s1G = new MyGain(0.0125);

		bufferGraph(this.bPE.buffer);

		// CONNECTIONS

		this.bPE.connect(this.f);
		this.f.connect(this.p);
		this.p.connect(this.s1G);
		this.s1G.connect(this.s1);

		this.s1.connect(this.f2);

		this.f2.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 59 (reso pipe am)
	pitch59: function(){

		this.o = new MyOsc("sine", 100);

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.1, 0.15, 0.1, 20);
		this.bPE.playbackRate = 100;

		this.aGE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.aGE.makeRamp(0, 1, 0.1, 0.15, 0.1, 20);
		this.aGE.playbackRate = 1;

		this.aG1 = new MyGain(0);
		this.aG2 = new MyGain(0);

		this.f = new MyBiquad("lowpass", 20000, 1);
		this.f2 = new MyBiquad("lowpass", 20000, 1);

		this.p = new SemiOpenPipe(100);

		this.s1 = new MyWaveShaper();
		this.s1.makeFm(1000, 13.2, 1);
		this.s1G = new MyGain(0.0125);

		bufferGraph(this.bPE.buffer);

		// CONNECTIONS

		this.bPE.connect(this.f);
		this.f.connect(this.p);
		this.p.connect(this.s1G);
		this.s1G.connect(this.s1);
		this.s1.connect(this.f2);
		this.f2.connect(this.aG1); this.aGE.connect(this.aG1.gain.gain);

		this.o.connect(this.aG2); this.aG1.connect(this.aG2.gain.gain);

		this.aG2.connect(this.output);

		this.o.start();

		this.startArray = [this.bPE, this.aGE];

	},

	// preset 60 (shaped moog)
	pitch60: function(){

		this.m = new MiniMoog();
		this.m.trXylophone(432*0.5);
		this.m.output.gain.value = 128;

		this.f = new MyBiquad("highpass", 500, 1);
		this.f2 = new MyBiquad("highpass", 80, 1);

		this.dly = new MyStereoDelay(0.25, 0.125, 0.3, 1);
		this.dG = new MyGain(0.4);

		this.wG = new MyGain(0.4);
		this.w = new MyWaveShaper();
		this.w.makeFm(5, 0.09, 1);
		this.wOG = new MyGain(0.25);

		this.m.connect(this.f);
		this.f.connect(this.dG);
		this.dG.connect(this.dly);
		this.dly.connect(this.wG);
		this.wG.connect(this.w);
		this.w.connect(this.wOG);
		this.wOG.connect(this.f2);

		this.f2.connect(this.output);

		this.startArray = [this.m];

	},

	// preset 61 (flutter moog)
	pitch61: function(){

		this.m = new MiniMoog();
		this.m.trXylophone(432*1);
		this.m.output.gain.value = 1;

		this.dly = new MyStereoDelay(0.0625, 0.125, 0.4, 1);
		this.f = new MyBiquad("lowpass", 22000, 0);
		this.w = new MyWaveShaper();
		this.w.makeFm(400, 200, 1);
		this.wGain = new MyGain(1);
		this.g = new MyGain(0.5);

		this.m.connect(this.wGain);
		this.wGain.connect(this.w);
		this.w.connect(this.dly);
		this.dly.connect(this.g);
		this.g.connect(this.f);
		this.f.connect(this.output);

		this.startArray = [this.m];

	},

	// preset 62 (ribbon moog)
	pitch62: function(){

		this.m = new MiniMoog();
		this.m.trXylophone(432*P5*2);
		this.m.output.gain.value = 200;

		this.f = new MyBiquad("highpass", 500, 1);
		this.f2 = new MyBiquad("highpass", 1000, 1);

		this.dly = new MyStereoDelay(0.25, 0.125, 0.3, 1);
		this.dG = new MyGain(0.6);
		this.dly2 = new MyStereoDelay(0.4, 0.325, 0.3, 1);
		this.dG2 = new MyGain(0.4);

		this.e = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.e.playbackRate = 10;
		this.eF = new MyBiquad("lowpass", 100, 1);
		this.e.makeSawtooth(8);

		this.eG = new MyGain(0);

		this.wG = new MyGain(0.4);
		this.w = new MyWaveShaper();
		this.w.makeFm(5, 0.4, 1);
		this.wOG = new MyGain(2);

		this.e.connect(this.eF);

		this.m.connect(this.eG); this.eF.connect(this.eG.gain.gain);
		this.eG.connect(this.f);

		this.f.connect(this.dG);
		this.dG.connect(this.dly);
		this.dly.connect(this.wG);

		this.f.connect(this.dG2);
		this.dG2.connect(this.dly2);
		this.dly2.connect(this.wG);

		this.wG.connect(this.w);
		this.w.connect(this.wOG);
		this.wOG.connect(this.f2);
		this.f2.connect(this.output);

		this.startArray = [this.m, this.e];

	},

	// preset 63 (shaped splice pad)
	pitch63: function(){

		this.fund = 460.83248321310566*0.5;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
	  this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
	  this.b3 = new MyBuffer(1, 1, audioCtx.sampleRate);

		this.b1.playbackRate = 1;

	  this.d = new Effect();
	  this.d.randomShortDelay();
	  this.d.on();
	  this.d.output.gain.value = 0.3;

	 	this.d2 = new Effect();
	  this.d2.randomEcho();
	  this.d2.on();
	  this.d2.output.gain.value = 0.5;

	  this.f = new MyBiquad("lowshelf", 200, 1);
	  this.f.biquad.gain.value = -12;

	  this.w = new MyWaveShaper();
	  this.w.makeSigmoid(5);

	  this.b1.connect(this.d);
	  this.b1.connect(this.d2);

	  this.b1.connect(this.output);
	  this.d.connect(this.output);
	  this.d2.connect(this.output);

	 	this.nH = 10;

	  for(var i=0; i<this.nH; i++){

	  this.b2.makeFm(this.fund*randomFloat(0.98, 1.02), this.fund*randomFloat(0.98, 1.02), randomFloat(0.2, 0.4));
	  this.b3.makeFm(this.fund*randomFloat(0.98, 1.02), this.fund*randomFloat(0.98, 1.02), randomFloat(0.2, 0.4));
	  // b2.applySine(randomFloat(0.5, 4));

	  this.b2.subtractBuffer(this.b3.buffer);

	  this.b1.addBuffer(this.b2.buffer);

	  }

	  this.b1.normalize(-1, 1);

	  this.peakPoint = randomFloat(0.5, 0.7);

	  this.b1.applyRamp(0, 1, this.peakPoint, this.peakPoint, 1, 1);

		this.startArray = [this.b1];

	},

	// preset 64 (shaped splice pad 2)
	pitch64: function(){

		this.fund = 460.83248321310566*0.5;

		this.g = new MyGain(8);

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
	  this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
	  this.b3 = new MyBuffer(1, 1, audioCtx.sampleRate);

		this.b1.playbackRate = 1;

	  this.d = new Effect();
	  this.d.randomShortDelay();
	  this.d.on();
	  this.d.output.gain.value = 0.3;

	  this.d2 = new Effect();
	  this.d2.randomEcho();
	  this.d2.on();
	  this.d2.output.gain.value = 0.5;

	  this.f = new MyBiquad("lowshelf", 200, 1);
	  this.f.biquad.gain.value = -12;

	  this.f3 = new MyBiquad("lowpass", 20000, 1);

	  this.fS = new MyBiquad("bandpass", 5000, 3);
	  this.fS.output.gain.value = 0.5;
	 	this.fP = new MyPanner2(0);

	  this.w = new Effect();
	  this.w.fmShaper(this.fund, this.fund*2, 1, 0.000015);
	  this.w.on();

	  this.b1.connect(this.d);
	  this.b1.connect(this.d2);

	  this.b1.connect(this.f);
	  this.d.connect(this.f);
	  this.d2.connect(this.f);

	  this.f.connect(this.w);
	  this.w.connect(this.f3);

	  this.f3.connect(this.fS);

	  this.fS.connect(this.fP);

	  this.f3.connect(this.g);
	  this.fP.connect(this.g);

		this.g.connect(this.output);

		this.nH = 10;

		this.eS2;
		this.eL2;
		this.eP2;

		for(var i=0; i<this.nH; i++){

		this.b2.makeFm(this.fund*randomFloat(0.98, 1.02), this.fund*randomFloat(0.98, 1.02), randomFloat(0.2, 0.4));
		this.b3.makeFm(this.fund*randomFloat(0.98, 1.02), this.fund*randomFloat(0.98, 1.02), randomFloat(0.2, 0.4));
		// b2.applySine(randomFloat(0.5, 4));

		this.b2.subtractBuffer(this.b3.buffer);

		this.b1.addBuffer(this.b2.buffer);

		this.eS2 = randomFloat(0, 0.5);
		this.eL2 = randomFloat(0.2, 0.5);
		this.eP2 = randomFloat(0, 0.8);

		this.b1.edit(this.eS2, this.eS2+this.eL2, this.eP2);

		}

		this.b1.normalize(-1, 1);

		this.peakPoint = randomFloat(0.5, 0.7);

		this.b1.applyRamp(0, 1, this.peakPoint, this.peakPoint, 1, 1);

		this.startArray = [this.b1];

	},

	// preset 65 (reso pipe)
	pitch65: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.01, 0.0125, 0.5, 30);
		this.bPE.playbackRate = 10;

		this.nB = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.nB.makeNoise();
		this.nB.multiply(0.0003);

		this.bPE.addBuffer(this.nB.buffer);

		this.pi = new SemiOpenPipe(100*0.5); // <- determines pitch
		this.pi.output.gain.value = 8;

		this.w = new Effect();
		this.w.fmShaper(200, 100, 100, 0.00125);
		this.w.on();

		this.f = new MyBiquad("lowpass", 20000, 1);

		this.d = new MyStereoDelay(0.02417677268385887, 0.025461271405220032, randomFloat(0, 0.1), 1);

		this.p = new MyPanner2(0);

		bufferGraph(this.bPE.buffer);

		this.bPE.connect(this.w);
		this.w.connect(this.d);
		this.d.connect(this.p);
		this.p.connect(this.f);
		this.f.connect(this.pi);
		this.pi.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset 66 (reso pipe bass)
	pitch66: function(){

		this.bPE = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.bPE.makeRamp(0, 1, 0.01, 0.0125, 0.5, 30);
		this.bPE.playbackRate = 10;

		this.nB = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.nB.makeNoise();
		this.nB.multiply(0.0003);

		this.bPE.addBuffer(this.nB.buffer);

		this.pi = new SemiOpenPipe(100*0.5); // <- determines pitch
		this.pi.output.gain.value = 8;

		this.w = new Effect();
		this.w.fmShaper(200, 100, 100, 0.00125);
		this.w.on();

		this.f = new MyBiquad("lowpass", 20000, 1);

		this.d = new MyStereoDelay(0.02417677268385887, 0.025461271405220032, randomFloat(0, 0.1), 1);

		this.p = new MyPanner2(0);

		bufferGraph(this.bPE.buffer);

		this.bPE.connect(this.w);
		this.w.connect(this.d);
		this.d.connect(this.p);
		this.p.connect(this.f);
		this.f.connect(this.pi);
		this.pi.connect(this.output);

		this.startArray = [this.bPE];

	},

	// preset67 (dry flute shape)
	pitch67: function(){

		this.duration = 1;

		this.fund = 75.9375;

		this.o = new MyOsc("sine", this.fund*P4*m2*2);

		this.t = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.t.playbackRate = 2.7482829957236223; // 20*randomFloat(0.125, 0.25);
		this.t.makeTriangle();

		this.tF = new MyBiquad("lowpass", 10, 1);
		this.tG = new MyGain(0);

		this.s = new MyWaveShaper();
		this.s.makeFm(6.152804112338611, 0.25346180312232277, 1); // randomFloat(5, 7.1), randomFloat(0.1, 0.31), 1
		this.sIG = new MyGain(0.1);
		this.sOG = new MyGain(0.5);
		this.sF = new MyBiquad("highpass", 10, 1);

		this.f = new MyBiquad("highpass", 80, 1);
		this.f2 = new MyBiquad("lowpass", 20000, 1);
		this.f3 = new MyBiquad("lowshelf", 100, 1);
		this.f3.biquad.gain.value = -3; // -2.5

		this.f4 = new MyBiquad("lowshelf", 146.52, 1);
		this.f4.biquad.gain.value = -2; // -1.59
		this.f5 = new MyBiquad("peaking", 180.19, 2.534);
		this.f5.biquad.gain.value = -3; // -2.29
		this.f6 = new MyBiquad("peaking", 514.78, 1);
		this.f6.biquad.gain.value = -1.8; // -1.8

		this.t.connect(this.tF);
		this.o.connect(this.tG); this.tF.connect(this.tG.gain.gain);
		this.tG.connect(this.sIG);
		this.sIG.connect(this.s);
		this.s.connect(this.sF);
		this.sF.connect(this.sOG);

		this.sOG.connect(this.f);
		this.f.connect(this.f2);
		this.f2.connect(this.f3);
		this.f3.connect(this.f4);
		this.f4.connect(this.f5);
		this.f5.connect(this.f6);

		this.f6.connect(this.output);

		this.o.start();

		this.startArray = [this.t];

	},

	// preset 68 (ltone)
	pitch68: function(){

			this.fund = 432*0.5;

			this.d2O = new LFO(0, 1, this.fund);
			this.d2O.buffer.makeUnipolarSine();
			this.d2OF = new MyBiquad("lowpass", 20000, 1);
			this.d2OF.output.gain.value = 0.5;
			this.d2OW = new Effect();
			this.d2OW.fmShaper(this.fund, this.fund*2, 1, 0.0006);
			this.d2OW.on();

			this.p = new MyPanner2(randomFloat(-0.25, 0.25));
			this.p.output.gain.value = 1;

			this.t = new Effect();
			this.t.thru();
			this.t.on();

			this.dR = new Effect();
			this.dR.randomShortDelay();
			this.dR.output.gain.value = 0.3;
			this.dR.on();

			this.dE = new Effect();
			this.dE.randomEcho();
			this.dE.output.gain.value = 0.3;
			this.dE.on();

			this.d2O.connect(this.d2OF);
			this.d2OF.connect(this.d2OW);
			this.d2OW.connect(this.p);
			this.p.connect(this.t);

			this.t.connect(this.dR);
			this.dR.connect(this.dE);

			// envelope

			this.eB = new MyBuffer(1, 1, audioCtx.sampleRate);
			this.eB.playbackRate = 1;
			this.eB.makeRamp(0, 1, 0.1, 0.2, 0.5, 8);
			this.eG = new MyGain(0);

			this.t.connect(this.eG);
			this.dR.connect(this.eG);
			this.dE.connect(this.eG); this.eB.connect(this.eG.gain.gain);

			this.eG.connect(this.output);

			this.d2O.start();

			this.startArray = [this.eB];

	},

	// preset 69 (fm bell dot)
	pitch69: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = 3.1*this.fund;
		this.mI = 0.125*this.fund;

		this.sTE = 2;
		this.pBR = 5;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.makeAm(this.cF/this.pBR, this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 70 (fm tone block)
	pitch70: function(){

		this.fund = 432*1;

		this.cF = 1*this.fund;
		this.mF = 2*this.fund;
		this.mI = 1*this.fund;

		this.sTE = 10;
		this.pBR = 10;

		this.cO = new MyOsc("sine", this.cF);

		this.mO = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.mO.makeFm(this.cF/this.pBR, this.mF/this.pBR, 1);
		this.mO.applyRamp(0, 1, 0.01, 0.015, 0.01, this.sTE);
		this.mO.playbackRate = this.pBR;
		this.mO.multiply(this.mI);

		this.mO.connect(this.cO.frequencyInlet);

		this.f = new MyBiquad("notch", this.fund, this.fund*0.0625);

		this.cO.connect(this.f);
		this.f.connect(this.output);

		this.cO.start();

		this.startArray = [this.mO];

	},

	// preset 71 (dot synth)
	pitch71: function(){

		this.fund = 300*2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		
		this.d = new Effect();
		this.d.randomShortDelay();
		this.d.on();
		this.d.output.gain.value = 0.3;
		
		this.f = new MyBiquad("highpass", 100, 1);

		this.w = new Effect();
		this.w.fmShaper(this.fund*randomFloat(0.99, 1.01), 2*this.fund*randomFloat(0.99, 1.01), 1, 0.00001);
		this.w.on();

		for(var i=0; i<10; i++){
		
		this.b2.addSine(this.fund*randomFloat(0.98, 1.02), 1);

		this.b1.addBuffer(this.b2.buffer);
		
		}

		this.c = new MyConvolver(2, 3, audioCtx.sampleRate);
		this.c.buffer.makeNoise();
		this.c.buffer.applyRamp(0, 1, 0.001, 0.0015, 0.1, 8);
		this.c.setBuffer();
		this.c.output.gain.value = 0.3;
		
		this.b1.normalize(-1, 1);
		this.b1.applyRamp(0, 1, 0.01, 0.015, 4, 8);
		this.b1.playbackRate = 1;

		this.b1.connect(this.d);
		
		this.b1.connect(this.f);
		this.d.connect(this.f);

		this.f.connect(this.c);

		this.f.connect(this.output);
		this.c.connect(this.output);

		this.startArray = [this.b1];

	},

	// preset 72 (convolver chime)
	pitch72: function(){

		this.c1 = new MyConvolver(1, 1, audioCtx.sampleRate);
		this.c1.buffer.addSine(0.25*432, 1);
		this.c1.buffer.addSine(0.25*432*4.75, 0.25);
		this.c1.buffer.addSine(0.25*432*6.375, 1);
		this.c1.buffer.applyRamp(0, 1, 0.001, 0.0015, 0.1, 4);
		this.c1.setBuffer();
	
		this.s = new PercussionPresets();
		this.s.perc7();
	
		this.s.connect(this.c1);

		this.c1.connect(this.output);

		this.c1.output.gain.value = 8;
	
		this.startArray = [this.s];

	},

	// preset 73 (convolver breath mallet)
	pitch73: function(){

		this.iArray = [1, 4.75, 6.375];
		this.fund = 432*0.25;
		this.nH = 5;

		this.c1 = new MyConvolver(1, 1, audioCtx.sampleRate);
		this.aB = new MyBuffer(1, 1, audioCtx.sampleRate);
	
		for(let i=0; i<this.iArray.length; i++){
	
			for(let j=0; j<this.nH; j++){
	
				this.c1.buffer.addSine(this.fund*this.iArray[i]*randomFloat(0.99, 1.01), randomFloat(0.25, 1));
	
			}
	
		}
	
		this.aB.makeNoise();
		this.aB.multiply(0.5);
	
		this.c1.buffer.addBuffer(this.aB.buffer);
	
		this.c1.buffer.normalize(-1, 1);
		this.c1.buffer.applyRamp(0, 1, 0.001, 0.0015, 0.1, 4);
		this.c1.setBuffer();
	
		this.s = new PercussionPresets();
		this.s.perc13();
	
		this.s.connect(this.c1);

		this.c1.connect(this.output);

		this.c1.output.gain.value = 8;
	
		this.startArray = [this.s];

	},

	// start instrument immediately
	start: function(){
		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].start();
		}
	},

	// stop instrument immediately
	stop: function(){
		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].stop();
		}
	},

	// start instrument at specified time (in seconds)
	startAtTime: function(time){

		this.time = time;

		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].startAtTime(this.time);
		}

	},

	// stop instrument at specified time (in seconds)
	stopAtTime: function(time){

		this.time = time;

		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].stopAtTime(this.time);
		}

	},

	// connect the output node of this object to the input of another
	connect: function(audioNode){
		if (audioNode.hasOwnProperty('input') == 1){
			this.output.connect(audioNode.input);
		}
		else {
			this.output.connect(audioNode);
		}
	},

}

//--------------------------------------------------------------

// object within which to design signal-generating chains, which are
// stored as methods
function FXPresets(){

	this.input = audioCtx.createGain();
	this.output = audioCtx.createGain();
	this.startArray = [];

}

FXPresets.prototype = {

	input: this.input,
	output: this.output,
	startArray: this.startArray,

	// instrument preset template
	instrumentMethod: function(){
		this.startArray = [];
	},

	// preset 1
	fx1: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 3;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.n = 1;

		this.fmCFA = [21];
		this.fmMFA = [30];
		this.fmGVA = [10];
		this.fmMGA = [0.01, 0.1, 0.1];

		this.fmPPA = [0.5, 0.5, 0.75];
		this.fmUEA = [1,   1, 2];
		this.fmDEA = [1,   1, 2];

		this.amCFA = [1];
		this.amMFA = [2];
		this.amGVA = [1];
		this.amMGA = [1];

		this.rPPA = [0.2];
		this.rUEA = [32];
		this.rDEA = [32];
		this.rMGA = [0];

		for(var i=0; i<this.fmCFA.length; i++){
			this.b2.makeFm(this.fund*this.fmCFA[i], this.fund*this.fmMFA[i], this.fmGVA[i]);
			this.b2.applyRamp(0, 1, this.fmPPA[i], this.fmPPA[i], this.fmUEA[i], this.fmDEA[i]);
			this.b2.multiply(this.fmMGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 1");

	},

	// preset 2
	fx2: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 3;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.n = 1;

		this.fmCFA = [21];
		this.fmMFA = [30];
		this.fmGVA = [10];
		this.fmMGA = [0.01, 0.1, 0.1];

		this.fmPPA = [0.5, 0.5, 0.75];
		this.fmUEA = [1,   1, 2];
		this.fmDEA = [1,   1, 2];

		this.amCFA = [1];
		this.amMFA = [2];
		this.amGVA = [1];
		this.amMGA = [1];

		this.rPPA = [0.2];
		this.rUEA = [32];
		this.rDEA = [32];
		this.rMGA = [0];

		for(var i=0; i<this.fmCFA.length; i++){
			this.b2.makeFm(this.fund*this.fmCFA[i], this.fund*this.fmMFA[i], this.fmGVA[i]);
			this.b2.applyRamp(0, 1, this.fmPPA[i], this.fmPPA[i], this.fmUEA[i], this.fmDEA[i]);
			this.b2.multiply(this.fmMGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 2");

	},

	// preset 3
	fx3: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.n = 1;

		this.fmCFA = [11];
		this.fmMFA = [26];
		this.fmGVA = [17];
		this.fmMGA = [0.01];

		this.fmPPA = [0.5,  0.4, 0.9];
		this.fmUEA = [1,    16,  256];
		this.fmDEA = [1,  9,   2];

		this.amCFA = [1];
		this.amMFA = [2];
		this.amGVA = [1];
		this.amMGA = [1];

		this.rPPA = [0.2];
		this.rUEA = [32];
		this.rDEA = [32];
		this.rMGA = [0];

		for(var i=0; i<this.fmCFA.length; i++){
			this.b2.makeFm(this.fund*this.fmCFA[i], this.fund*this.fmMFA[i], this.fmGVA[i]);
			this.b2.applyRamp(0, 1, this.fmPPA[i], this.fmPPA[i], this.fmUEA[i], this.fmDEA[i]);
			this.b2.multiply(this.fmMGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 3");

	},

	// preset 4
	fx4: function(){

		this.duration = 1;

		this.fund = 432*0.125;
		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fmCFA = [11, 12, 13, 2];
		this.fmMFA = [26, 27, 28, 1];
		this.fmGVA = [17, 18, 19, 5];
		this.fmMGA = [0.01, 0.01, 0.01, 0.001];

		this.fmPPA = [0.2,  0.4, 0.9, 0.5];
		this.fmUEA = [2,    16,  1,   1];
		this.fmDEA = [256,  9,   2,   1];

		this.amCFA = [1];
		this.amMFA = [2];
		this.amGVA = [1];
		this.amMGA = [1];

		this.rPPA = [0.2];
		this.rUEA = [32];
		this.rDEA = [32];
		this.rMGA = [0];

		for(var i=0; i<this.fmCFA.length; i++){
			this.b2.makeFm(this.fund*this.fmCFA[i], this.fund*this.fmMFA[i], this.fmGVA[i]);
			this.b2.applyRamp(0, 1, this.fmPPA[i], this.fmPPA[i], this.fmUEA[i], this.fmDEA[i]);
			this.b2.multiply(this.fmMGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 4");

	},

	// preset 5
	fx5: function(){

		this.duration = 8;

		this.fund = 432*0.25;
		this.rate = 0.125;
		this.cFA = [5];
		this.mFA = [200];
		this.gVA = [20];
		this.mGA = [1];
		this.pPA = [0.0001];
		this.uEA = [0.01];
		this.dEA = [128];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 5");

	},

	// preset 6
	fx6: function(){

		this.duration = 4;

		this.fund = 432*0.125;
		this.rate = 0.25;
		this.cFA = [1];
		this.mFA = [100];
		this.gVA = [120];
		this.mGA = [1];
		this.pPA = [0.2];
		this.uEA = [1.5];
		this.dEA = [128];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 6");

	},

	// preset 7
	fx7: function(){

		this.duration = 4;

		this.fund = 432*0.125;
		this.rate = 0.25;
		this.cFA = [1];
		this.mFA = [2];
		this.gVA = [4];
		this.mGA = [1];
		this.pPA = [0.2];
		this.uEA = [1.5];
		this.dEA = [128];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 7");

	},

	// preset 8
	fx8: function(){

		this.duration = 4;

		this.fund = 432*0.125;
		this.rate = 0.25;
		this.cFA = [1];
		this.mFA = [2];
		this.gVA = [4];
		this.mGA = [1];
		this.pPA = [0.2];
		this.uEA = [1.5];
		this.dEA = [2];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 8");

	},

	// preset 9
	fx9: function(){

		this.duration = 4;

		this.fund = 432*0.125;
		this.rate = 0.25;
		this.cFA = [1, 2];
		this.mFA = [2, 4];
		this.gVA = [4, 8];
		this.mGA = [1, 0.25];
		this.pPA = [0.2, 0.3];
		this.uEA = [1.5, 2];
		this.dEA = [2, 1.5];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 9");

	},

	// preset 10
	fx10: function(){

		this.duration = 4;

		this.fund = 432*0.125;
		this.rate = 0.25;
		this.cFA = [100];
		this.mFA = [100];
		this.gVA = [100];
		this.mGA = [1];
		this.pPA = [0.4];
		this.uEA = [1];
		this.dEA = [4];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 10");

	},

	// preset 11
	fx11: function(){

		this.duration = 2;

		this.fund = 432*1;
		this.rate = 0.5;
		this.cFA = [200, 100];
		this.mFA = [200, 120];
		this.gVA = [1000, 2000];
		this.mGA = [1, 1];
		this.pPA = [0.002, 0.001];
		this.uEA = [0.1, 0.1];
		this.dEA = [7, 8];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 11");

	},

	// preset 12
	fx12: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 1;
		this.cFA = [1,   1   , 1  ];
		this.mFA = [1.5, 1.25, 2.9];
		this.gVA = [0.2, 0.2, 0.2];
		this.mGA = [1, 1, 1];
		this.pPA = [0.5, 0.5, 0.5];
		this.uEA = [1, 1, 1];
		this.dEA = [1, 1, 1];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.f);
		this.f.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 12")

	},

	// preset 13
	fx13: function(){

		this.duration = 1;

		this.fund = 432*1;
		this.rate = 1;
		this.cFA = [0.7];
		this.mFA = [0.5];
		this.gVA = [1];
		this.mGA = [1];
		this.pPA = [0.5];
		this.uEA = [1];
		this.dEA = [1];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.f);
		this.f.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

		console.log("fx preset 13");

	},

	// preset 14
	fx14: function(){

		this.duration = 1;

		this.fund = 432*1;
		this.rate = 1;
		this.cFA = [0.1, 0.2];
		this.mFA = [0.5, 0.7];
		this.gVA = [1, 1];
		this.mGA = [1, 1];
		this.pPA = [0.1, 0.5];
		this.uEA = [0.01, 1];
		this.dEA = [8, 1];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 14")

	},

	// preset 15
	fx15: function(){

		this.duration = 1;

		this.fund = 432*0.1;
		this.rate = 1;
		this.cFA = [0.1, 0.3];
		this.mFA = [0.2, 0.2];
		this.gVA = [100, 1];
		this.mGA = [1, 1];
		this.pPA = [0.1, 0.1];
		this.uEA = [0.1, 0.1];
		this.dEA = [8, 4];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 15");

	},

	// preset 16 (bird)
	fx16: function(){

		this.duration = 1;

		this.fund = 432*0.01;
		this.rate = 16;
		this.cFA = [0.1, 0.3];
		this.mFA = [0.2, 0.2];
		this.gVA = [100, 150];
		this.mGA = [1, 1];
		this.pPA = [0.1, 0.1];
		this.uEA = [0.1, 0.1];
		this.dEA = [8, 4];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 16");

	},

	// preset 17
	fx17: function(){

		this.duration = 1;

		this.fund = 432*0.01;
		this.rate = 1;
		this.cFA = [0.1, 0.3];
		this.mFA = [0.2, 0.2];
		this.gVA = [100, 150];
		this.mGA = [1, 1];
		this.pPA = [0.1, 0.1];
		this.uEA = [0.1, 0.1];
		this.dEA = [8, 4];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 17");

	},

	// preset 18
	fx18: function(){

		this.duration = 1;

		this.fund = 432*0.1;
		this.rate = 1;
		this.cFA = [0.1, 0.3, 0.7 , 1.1 , 0.6 ];
		this.mFA = [0.2, 0.2, 0.05, 0.07, 0.77];
		this.gVA = [100, 150, 120,  1   , 20 ];
		this.mGA = [1, 1, 1, 1, 1];
		this.pPA = [0.1, 0.1, 0.2, 0.5, 0.8];
		this.uEA = [0.1, 0.1, 0.2, 1, 3];
		this.dEA = [8, 4, 3, 1, 0.4];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 18");

	},

	// preset 19
	fx19: function(){

		this.duration = 1;

		this.fund = 432*1;
		this.rate = 16;
		this.cFA = [0.1, 0.3, 0.7 , 1.1 , 0.6 ];
		this.mFA = [0.2, 0.2, 0.05, 0.07, 0.77];
		this.gVA = [100, 150, 120,  1   , 20 ];
		this.mGA = [1, 1, 1, 1, 1];
		this.pPA = [0.1, 0.1, 0.2, 0.5, 0.8];
		this.uEA = [0.1, 0.1, 0.2, 1, 3];
		this.dEA = [8, 4, 3, 1, 0.4];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 19");

	},

	// preset 20
	fx20: function(){

		this.duration = 1;

		this.fund = 432*16;
		this.rate = 16;
		this.cFA = [0.1, 0.3, 0.7 , 1.1 , 0.6 ];
		this.mFA = [0.2, 0.2, 0.05, 0.07, 0.77];
		this.gVA = [100, 150, 120,  1   , 20 ];
		this.mGA = [1, 1, 1, 1, 1];
		this.pPA = [0.1, 0.1, 0.2, 0.5, 0.8];
		this.uEA = [0.1, 0.1, 0.2, 1, 3];
		this.dEA = [8, 4, 3, 1, 0.4];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 20");

	},

	// preset 21
	fx21: function(){

		this.duration = 1;

		this.fund = 432*16;
		this.rate = 1;
		this.cFA = [0.1, 0.3, 0.7 , 1.1 , 0.6 ];
		this.mFA = [0.2, 0.2, 0.05, 0.07, 0.77];
		this.gVA = [100, 150, 120,  1   , 20 ];
		this.mGA = [1, 1, 1, 1, 1];
		this.pPA = [0.1, 0.1, 0.2, 0.5, 0.8];
		this.uEA = [0.1, 0.1, 0.2, 1, 3];
		this.dEA = [8, 4, 3, 1, 0.4];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 21");

	},

	// preset 22
	fx22: function(){

		this.duration = 1;

		this.fund = 16;
		this.rate = 1;
		this.cFA = [1, 9.10714286, 10.3571429];
		this.mFA = [1, 9.10714286, 10.3571429];
		this.gVA = [10, 10, 10];
		this.mGA = [1, 0.5, 0.125];
		this.pPA = [0.1, 0.1, 0.1];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 16, 16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 22");

	},

	// preset 23
	fx23: function(){

		this.duration = 4;

		this.fund = 16;
		this.rate = 0.25;
		this.cFA = [1, 9.10714286, 10.3571429];
		this.mFA = [1, 9.10714286, 10.3571429];
		this.gVA = [10, 10, 10];
		this.mGA = [1, 0.5, 0.125];
		this.pPA = [0.1, 0.1, 0.1];
		this.uEA = [0.1, 0.1, 0.1];
		this.dEA = [16, 16, 16];

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.f = new MyBiquad("notch", this.fund, 5);
		this.b1.playbackRate = this.rate;

		for(var i=0; i<this.cFA.length; i++){
			this.b2.makeFm(this.fund*this.cFA[i], this.fund*this.mFA[i], this.gVA[i]);
			this.b2.applyRamp(0, 1, this.pPA[i], this.pPA[i], this.uEA[i], this.dEA[i]);
			this.b2.multiply(this.mGA[i]);

			this.b1.addBuffer(this.b2.buffer);
		}

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		console.log("fx preset 23")

	},

	// preset 24
	fx24: function(){

		this.duration = 1;

		this.fund = 432;
		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);

		this.b1.playbackRate = 1;

		//

		this.b2.makeFm(432, 432, 1);
		this.b2.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.addBuffer(this.b2.buffer);

		this.b2.makeFm(432*2, 432, 1);
		this.b2.applyRamp(0, 0.75, 0.25, 0.5, 1, 1);

		bufferGraph(this.b2.buffer);

		this.b1.subtractBuffer(this.b2.buffer);

		this.b2.makeFm(432*0.25, 432*0.1, 1);
		this.b2.applyRamp(0, 1, 0.5, 0.5, 1, 1);
		this.b2.multiply(0.1);

		bufferGraph(this.b2.buffer);

		this.b1.multiplyBuffer(this.b2.buffer);

		this.b1.normalize(-1, 1);

		bufferGraph(this.b1.buffer);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

	},

	// preset 25
	fx25: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);

		this.b1.playbackRate = 1;

		//

		this.b2.makeFm(this.fund, this.fund, 1);
		this.b2.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.addBuffer(this.b2.buffer);

		this.b2.makeFm(this.fund*2, this.fund, 1);
		this.b2.applyRamp(0, 0.75, 0.25, 0.5, 1, 1);

		bufferGraph(this.b2.buffer);

		this.b1.subtractBuffer(this.b2.buffer);

		this.b2.makeFm(this.fund*0.25, this.fund*0.1, 1);
		this.b2.applyRamp(0, 1, 0.5, 0.5, 1, 1);
		this.b2.multiply(0.1);

		bufferGraph(this.b2.buffer);

		this.b1.multiplyBuffer(this.b2.buffer);

		this.b1.normalize(-1, 1);

		bufferGraph(this.b1.buffer);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

	},

	// preset 26
	fx26: function(){

		this.duration = 1;

		this.fund = 432*0.0625;
		this.rate = 8;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);

		this.b1.playbackRate = this.rate;

		//

		this.b2.makeFm(this.fund, this.fund, 1);
		this.b2.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.addBuffer(this.b2.buffer);

		this.b2.makeFm(this.fund*2, this.fund, 1);
		this.b2.applyRamp(0, 1, 0.25, 0.5, 1, 1);

		bufferGraph(this.b2.buffer);

		this.b1.subtractBuffer(this.b2.buffer);

		this.b2.makeFm(this.fund*0.25, this.fund*0.1, 1);
		this.b2.applyRamp(0, 1, 0.5, 0.5, 1, 1);
		this.b2.multiply(0.1);

		bufferGraph(this.b2.buffer);

		this.b1.multiplyBuffer(this.b2.buffer);

		this.b1.normalize(-1, 1);

		bufferGraph(this.b1.buffer);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

	},

	// preset 27
	fx27: function(){

		this.duration = 1;

		this.fund = 432*0.125;
		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 20;
		this.cA = [1, 9.10714286, 10.3571429];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				this.b2.addSine(j+parseInt(this.fund*this.cA[i]), randomFloat(0.5, 1));

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.5, 0.5, 8, 8);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 28
	fx28: function(){

		this.duration = 1;

		this.fund = 432*0.5;
		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 50;
		this.cA = [1, 4.75, 6.375];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				this.b2.addSine(j+parseInt(this.fund*this.cA[i]), randomFloat(0.5, 1));

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.5, 0.5, 8, 8);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 29 (bouncing ball)
	fx29: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 50;
		this.cA = [1, 1.859375, 3.734375];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				if(j<parseInt(this.bw*0.5)){
					this.b2.addSine(j+(this.fund-parseInt(this.bw*0.5)), randomFloat(1, 1)*(j/(parseInt(this.bw*0.5))));
				};

				if(j>=parseInt(this.bw*0.5)){
					this.b2.addSine(j+this.fund, randomFloat(1, 1)*(this.bw-j)/parseInt(this.bw*0.5));
				};

				this.b2.addSine(j+parseInt(this.fund*this.cA[i]), randomFloat(0.5, 1));

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 30
	fx30: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 100;
		this.cA = [1, 3.218181818181818, 4.527272727272727];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				if(j<parseInt(this.bw*0.5)){
					this.b2.addSine(j+((this.cA[i]*this.fund)-parseInt(this.bw*0.5)), randomFloat(0.125, 1)*(j/(parseInt(this.bw*0.5))));
				};

				if(j>=parseInt(this.bw*0.5)){
					this.b2.addSine(j+(this.cA[i]*this.fund), randomFloat(0.125, 1)*(this.bw-j)/parseInt(this.bw*0.5));
				};

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 31
	fx31: function(){

		this.duration = 2;

		this.fund = 432*0.25;
		this.rate = 0.5;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 100;
		this.cA = [1, 3.218181818181818, 4.527272727272727];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				if(j<parseInt(this.bw*0.5)){
					this.b2.addSine(j+((this.cA[i]*this.fund)-parseInt(this.bw*0.5)), Math.pow(randomFloat(0.125, 1)*(j/(parseInt(this.bw*0.5))), 8));
				};

				if(j>=parseInt(this.bw*0.5)){
					this.b2.addSine(j+(this.cA[i]*this.fund), Math.pow(randomFloat(0.125, 1)*(this.bw-j)/parseInt(this.bw*0.5), 8));
				};

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 32
	fx32: function(){

		this.duration = 2;

		this.fund = 432*0.25;
		this.rate = 0.5;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 100;
		this.cA = [1, 3.218181818181818, 4.527272727272727, 1, 9.10714286, 10.3571429];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				if(j<parseInt(this.bw*0.5)){
					this.b2.addSine(j+((this.cA[i]*this.fund)-parseInt(this.bw*0.5)), Math.pow(randomFloat(0.125, 1)*(j/(parseInt(this.bw*0.5))), 8));
				};

				if(j>=parseInt(this.bw*0.5)){
					this.b2.addSine(j+(this.cA[i]*this.fund), Math.pow(randomFloat(0.125, 1)*(this.bw-j)/parseInt(this.bw*0.5), 8));
				};

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 33
	fx33: function(){

		this.duration = 2;

		this.fund = 432*0.25;
		this.rate = 0.5;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 100;
		this.cA = [1, 3.218181818181818, 4.527272727272727, 1, 9.10714286, 10.3571429];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				if(j<parseInt(this.bw*0.5)){
					this.b2.addSine(j+((this.cA[i]*this.fund)-parseInt(this.bw*0.5)), Math.pow(randomFloat(0.125, 1)*(j/(parseInt(this.bw*0.5))), 0.1));
				};

				if(j>=parseInt(this.bw*0.5)){
					this.b2.addSine(j+(this.cA[i]*this.fund), Math.pow(randomFloat(0.125, 1)*(this.bw-j)/parseInt(this.bw*0.5), 0.1));
				};

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.5, 0.5, 3, 2);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 34 (spring)
	fx34: function(){

		this.duration = 1;

		this.fund = 432*0.25;
		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.bw = 100;
		this.cA = [1, 3.218181818181818, 4.527272727272727, 9.10714286, 10.3571429];

		for(var i=0; i<this.cA.length; i++){

			for(var j=0; j<this.bw; j++){

				if(j<parseInt(this.bw*0.5)){
					this.b2.addSine(j+((this.cA[i]*this.fund)-parseInt(this.bw*0.5)), Math.pow(randomFloat(0.125, 1)*(j/(parseInt(this.bw*0.5))), 0.1));
				};

				if(j>=parseInt(this.bw*0.5)){
					this.b2.addSine(j+(this.cA[i]*this.fund), Math.pow(randomFloat(0.125, 1)*(this.bw-j)/parseInt(this.bw*0.5), 0.1));
				};

			}

		}

		this.b1.addBuffer(this.b2.buffer);
		this.b1.applyRamp(0, 1, 0.01, 0.02, 3, 2);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 35 (pitchy bubbles)
	fx35: function(){

		this.duration = 1;

		this.fund = 432*1;
		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b3 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.n = 40;

		for(var i=0; i<this.n; i++){

			this.b2.makeAm(this.fund*randomArrayValue([1, M2, M3, P4, P5, M6, m7]), this.fund*randomArrayValue([1, M2, M3, P4, P5, M6, m7]), 1);
			this.b2.applyRamp(i/this.n, (i+1)/this.n, 0.25, 0.75, 1, 1);

			bufferGraph(this.b2.buffer);

			this.b1.subtractBuffer(this.b2.buffer);

		}

		this.b1.applyRamp(0, 1, 0.5, 0.5, 2, 3);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 36 (fm scramble)
	fx36: function(){

		this.duration = 1;

		this.fund = 432*1;
		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b3 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.n = 100;

		for(var i=0; i<this.n; i++){

			this.b2.makeFm(this.fund*randomArrayValue([1, M2, M3, P4, P5, M6, m7]), this.fund*randomArrayValue([1, M2, M3, P4, P5, M6, m7]), randomFloat(0.1, 1));
			this.b2.applyRamp(i/this.n, (i+1)/this.n, 0.25, 0.75, 1, 1);

			this.b1.subtractBuffer(this.b2.buffer);

		}

		this.b1.applyRamp(0, 1, 0.5, 0.5, 2, 3);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 37 (door)
	fx37: function(){

		this.duration = 1;

		this.fund = 432*1;
		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b3 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.n = 100;

		for(var i=0; i<this.n; i++){

			this.b2.addSine(this.fund*randomArrayValue([1, M2, M3, P4, P5, M6, m7]), 1);
			this.b2.applyRamp(0, 1, randomFloat(0.3, 0.5), randomFloat(0.5, 0.7), 100, 100);

			this.b1.subtractBuffer(this.b2.buffer);

		}

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1, 1);

		this.b1.connect(this.output);

		this.b1.normalize(-1, 1);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 38
	fx38: function(){

		this.duration = 1;

		this.rate = 2;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 200;
		this.iA = [2, 3, 4, 1];
		this.bWA = [50, 20, 30, 70];

		for(var i=0; i<this.iA.length; i++){

				for(var j=0; j<this.bWA[i]; j++){

					this.b1.addSine(j+((this.fund*this.iA[i])-(this.bWA[i]*0.5)), randomFloat(0.25, 1));

				}

			}

			this.b1.normalize(-1, 1);

			this.b1.applyRamp(0, 1, 0.1, 0.3, 0.1, 8);

			this.b1.connect(this.output);


			this.startArray = [this.b1];

			bufferGraph(this.b1.buffer);

		},

	// preset 39 (metal breath)
	fx39: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 250;
		this.iA = [1, 9.10714286, 10.3571429, 4.75, 6.375, 3.218181818181818, 4.527272727272727];
		this.bWA = [50, 20, 50, 20, 50, 20, 50];

		for(var i=0; i<this.iA.length; i++){

			for(var j=0; j<this.bWA[i]; j++){

				this.b1.addSine(j+((this.fund*this.iA[i])-(this.bWA[i]*0.5)), randomFloat(0.5, 1));

			}

		}

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.5, 0.5, 1.2, 1.2);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 40 (bounce)
	fx40: function(){

		this.duration = 1;

		this.rate = 1;
		this.cF = 20;
		this.mF = this.cF*1;
		this.nH = 20;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1.1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.b1.makeFm(this.cF, this.mF, this.mF);

		for(var i=0; i<this.nH; i++){

			this.b2.addSine(this.cF+(this.mF*i), randomFloat(0, 1));
			this.b2.addSine(this.cF-(this.mF*i), randomFloat(0, 1));

		}

		this.b1.subtractBuffer(this.b2.buffer);

		this.b1.normalize(-1, 1);

		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 6);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 41 (coin tone)
	fx41: function(){

		this.duration = 1;

		this.rate = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = this.rate;

		this.fund = 1000;

		this.iA = [1, 9.10714286, 10.3571429];
		this.bwA = [10, 20, 30];
		this.gA = [1, 1, 1];

		for(var i=0; i<this.iA.length; i++){

			for(var j=0; j<parseInt(this.bwA[i]); j++){

				this.f = j+((this.fund*this.iA[i])-(parseInt(this.bwA[i]*0.5)));
				this.b1.addSine(this.f, 1);
				this.b1.addSine(this.f*randomFloat(0.99, 1.01), 1);

			}

		}

		this.b1.applyRamp(0, 1, 0.01, 0.02, 0.1, 4);

		this.b1.normalize(-1, 1);

		this.b1.connect(this.output);

		this.startArray = [this.b1];

		bufferGraph(this.b1.buffer);

	},

	// preset 42 (splice bubble)
	fx42: function(){

		this.rate = 1;

		this.duration = 1/this.rate;
		this.output.gain.value = 1;

		this.b1 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b2 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b3 = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.b1.playbackRate = 1;
		this.b1.loop = true;

		this.b1.makeConstant(0);

		this.nSA = [50, 100, 50];
		this.fA =  [1, 4.75, 6.375];
		this.hA = [100, 200, 300, 400];

		for(var j=0; j<this.fA.length; j++){

			this.b3.makeConstant(0);

			for(var i=0; i<this.nSA[j]; i++){

				this.b2.makeConstant(0);
				this.b2.addSine(this.fA[j]*randomArrayValue(this.hA)/*randomFloat(0.99, 1.01)*/, 1);
				// this.b2.makeAm(this.fA[j]*randomFloat(0.95, 1.05), this.fA[j]*randomFloat(0.95, 1.05), 1);
				// this.b2.makeFm(this.fA[j]*randomFloat(0.95, 1.05), this.fA[j]*randomFloat(0.95, 1.05), 1);

				this.b3.spliceBuffer(this.b2.buffer, i/this.nSA[j], (i+1)/this.nSA[j], i/this.nSA[j]);

			}

			this.b1.addBuffer(this.b3.buffer);

		}

		this.b1.normalize(-1, 1);

		bufferGraph(this.b1.buffer);

		this.b1.movingAverage(Math.pow(2, 8));
		// this.b1.movingAverage(Math.pow(2, 11));

		this.b1.normalize(-1, 1);

		bufferGraph(this.b1.buffer);

		this.eB = new MyBuffer(1, 1, audioCtx.sampleRate);
		this.eG = new MyGain(0);
		this.eB.makeRamp(0, 1, 0.5, 0.5, 1, 1);
		this.eB.playbackRate = this.rate;

		this.b1.connect(this.eG); this.eB.connect(this.eG.gain.gain);
		this.eG.connect(this.output);

		this.b1.start();

		this.startArray = [this.eB];

	},

	// preset 43 (convolver chime)
	fx43: function(){
	
		this.c1 = new MyConvolver(1, 1, audioCtx.sampleRate);
		this.c1.buffer.addSine(0.25*432, 1);
		this.c1.buffer.addSine(0.25*432*4.75, 0.25);
		this.c1.buffer.addSine(0.25*432*6.375, 1);
		this.c1.buffer.applyRamp(0, 1, 0.001, 0.0015, 0.1, 4);
		this.c1.setBuffer();
	
		this.s = new PercussionPresets();
		this.s.perc7();
	
		this.s.connect(this.c1);

		this.c1.connect(this.output);

		this.c1.output.gain.value = 8;
	
		this.startArray = [this.s];

	},

	// start instrument immediately
	start: function(){
		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].start();
		}
	},

	// stop instrument immediately
	stop: function(){
		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].stop();
		}
	},

	// start instrument at specified time (in seconds)
	startAtTime: function(time){

		this.time = time;

		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].startAtTime(this.time);
		}

	},

	// stop instrument at specified time (in seconds)
	stopAtTime: function(time){

		this.time = time;

		for(var i=0; i<this.startArray.length; i++){
			this.startArray[i].stopAtTime(this.time);
		}

	},

	// connect the output node of this object to the input of another
	connect: function(audioNode){
		if (audioNode.hasOwnProperty('input') == 1){
			this.output.connect(audioNode.input);
		}
		else {
			this.output.connect(audioNode);
		}
	},

}
