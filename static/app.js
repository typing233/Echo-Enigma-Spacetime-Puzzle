class AudioArchaeologist {
    constructor() {
        this.audioContext = null;
        this.source = null;
        this.originalBuffer = null;
        this.reversedBuffer = null;
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.filters = {
            noiseReduction: false,
            reverse: false
        };
        this.gainNode = null;
        this.lowpassFilter = null;
        this.highpassFilter = null;
        this.noiseGain = null;
        this.analyser = null;
        this.animationId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
    }

    setupEventListeners() {
        const playBtn = document.getElementById('play-btn');
        const stopBtn = document.getElementById('stop-btn');
        const noiseReductionBtn = document.getElementById('noise-reduction-btn');
        const reverseBtn = document.getElementById('reverse-btn');
        const submitBtn = document.getElementById('submit-btn');
        const passwordInput = document.getElementById('password-input');

        playBtn.addEventListener('click', () => this.togglePlay());
        stopBtn.addEventListener('click', () => this.stop());
        
        noiseReductionBtn.addEventListener('click', () => this.toggleFilter('noiseReduction'));
        reverseBtn.addEventListener('click', () => this.toggleFilter('reverse'));
        
        submitBtn.addEventListener('click', () => this.verifyPassword());
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyPassword();
        });
    }

    setupCanvas() {
        const canvas = document.getElementById('audio-visualizer');
        const ctx = canvas.getContext('2d');
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    async initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 0.8;
            
            this.lowpassFilter = this.audioContext.createBiquadFilter();
            this.lowpassFilter.type = 'lowpass';
            this.lowpassFilter.frequency.value = 20000;
            
            this.highpassFilter = this.audioContext.createBiquadFilter();
            this.highpassFilter.type = 'highpass';
            this.highpassFilter.frequency.value = 20;
            
            this.noiseGain = this.audioContext.createGain();
            this.noiseGain.gain.value = 1.0;
            
            await this.generateAudioBuffer();
        }
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    async generateAudioBuffer() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 15;
        const totalSamples = sampleRate * duration;
        
        this.originalBuffer = this.audioContext.createBuffer(2, totalSamples, sampleRate);
        
        const leftChannel = this.originalBuffer.getChannelData(0);
        const rightChannel = this.originalBuffer.getChannelData(1);
        
        this.addBackgroundNoise(leftChannel, rightChannel, totalSamples, sampleRate);
        
        this.addHiddenMessage(leftChannel, rightChannel, totalSamples, sampleRate);
        
        this.reversedBuffer = this.reverseAudioBuffer(this.originalBuffer);
    }

    addBackgroundNoise(leftChannel, rightChannel, totalSamples, sampleRate) {
        let noisePhase = 0;
        let noisePhase2 = 0;
        
        for (let i = 0; i < totalSamples; i++) {
            const t = i / sampleRate;
            
            noisePhase += 440 / sampleRate * 2 * Math.PI;
            noisePhase2 += 880 / sampleRate * 2 * Math.PI;
            
            const whiteNoise = (Math.random() * 2 - 1) * 0.15;
            
            const brownNoise = 0;
            const pinkNoise = whiteNoise * 0.8;
            
            const hum = Math.sin(noisePhase) * 0.05 + Math.sin(noisePhase2) * 0.02;
            
            const staticNoise = Math.random() < 0.1 ? (Math.random() * 2 - 1) * 0.3 : 0;
            
            leftChannel[i] = whiteNoise + pinkNoise * 0.5 + hum + staticNoise * 0.3;
            rightChannel[i] = leftChannel[i] * 0.98 + (Math.random() * 2 - 1) * 0.02;
        }
    }

    addHiddenMessage(leftChannel, rightChannel, totalSamples, sampleRate) {
        const messageStartTime = 2;
        const digitDuration = 0.8;
        const gapDuration = 0.3;
        
        const digits = [7, 3, 9, 5];
        
        digits.forEach((digit, index) => {
            const startTime = messageStartTime + index * (digitDuration + gapDuration);
            const startSample = Math.floor(startTime * sampleRate);
            const endSample = Math.floor((startTime + digitDuration) * sampleRate);
            
            this.synthesizeDigitSpeech(leftChannel, rightChannel, startSample, endSample, sampleRate, digit);
        });
        
        const voiceStartTime = 7;
        const voiceStartSample = Math.floor(voiceStartTime * sampleRate);
        const voiceEndSample = Math.floor((voiceStartTime + 3) * sampleRate);
        
        this.synthesizeVoiceHint(leftChannel, rightChannel, voiceStartSample, voiceEndSample, sampleRate);
    }

    synthesizeDigitSpeech(leftChannel, rightChannel, startSample, endSample, sampleRate, digit) {
        const digitFrequencies = {
            0: { base: 120, formants: [800, 1150, 2800] },
            1: { base: 130, formants: [450, 1800, 2800] },
            2: { base: 125, formants: [700, 1220, 2600] },
            3: { base: 135, formants: [550, 1650, 2700] },
            4: { base: 120, formants: [600, 1900, 2550] },
            5: { base: 130, formants: [500, 1700, 2600] },
            6: { base: 125, formants: [650, 1250, 2750] },
            7: { base: 135, formants: [550, 1850, 2500] },
            8: { base: 120, formants: [750, 1200, 2850] },
            9: { base: 130, formants: [580, 1750, 2650] }
        };
        
        const freqData = digitFrequencies[digit];
        const duration = (endSample - startSample) / sampleRate;
        
        let phase = 0;
        let phase2 = 0;
        let phase3 = 0;
        
        for (let i = startSample; i < endSample && i < leftChannel.length; i++) {
            const t = (i - startSample) / sampleRate;
            const progress = t / duration;
            
            const envelope = this.generateEnvelope(progress);
            
            const baseFreq = freqData.base;
            const voiceSample = this.generateVoicePulse(
                t, 
                baseFreq, 
                freqData.formants,
                envelope
            );
            
            const signal = voiceSample * 0.25;
            
            leftChannel[i] += signal;
            rightChannel[i] += signal * 0.95;
        }
    }

    generateEnvelope(progress) {
        if (progress < 0.1) {
            return progress / 0.1;
        } else if (progress > 0.85) {
            return (1 - progress) / 0.15;
        } else {
            return 1.0;
        }
    }

    generateVoicePulse(t, baseFreq, formants, envelope) {
        const period = 1 / baseFreq;
        const phase = t % period;
        const phaseProgress = phase / period;
        
        const glottalPulse = Math.sin(phaseProgress * Math.PI) ** 2;
        
        let output = 0;
        formants.forEach((freq, index) => {
            const amplitude = [0.8, 0.6, 0.4][index];
            output += Math.sin(t * freq * 2 * Math.PI) * glottalPulse * amplitude;
        });
        
        return output * envelope;
    }

    synthesizeVoiceHint(leftChannel, rightChannel, startSample, endSample, sampleRate) {
        const duration = (endSample - startSample) / sampleRate;
        
        const syllables = [
            { freq: 150, duration: 0.3, formants: [800, 1200, 2500] },
            { freq: 145, duration: 0.25, formants: [650, 1100, 2800] },
            { freq: 155, duration: 0.3, formants: [700, 1250, 2600] },
        ];
        
        let currentSample = startSample;
        
        syllables.forEach((syllable, idx) => {
            const syllableSamples = Math.floor(syllable.duration * sampleRate);
            const gapSamples = Math.floor(0.15 * sampleRate);
            
            for (let i = 0; i < syllableSamples && currentSample + i < endSample; i++) {
                const t = i / sampleRate;
                const progress = i / syllableSamples;
                const envelope = this.generateEnvelope(progress);
                
                const period = 1 / syllable.freq;
                const phase = t % period;
                const phaseProgress = phase / period;
                const glottalPulse = Math.sin(phaseProgress * Math.PI) ** 2;
                
                let signal = 0;
                syllable.formants.forEach((freq, fIdx) => {
                    const amp = [0.7, 0.5, 0.3][fIdx];
                    signal += Math.sin(t * freq * 2 * Math.PI) * glottalPulse * amp;
                });
                
                const channelIdx = currentSample + i;
                if (channelIdx < leftChannel.length) {
                    leftChannel[channelIdx] += signal * 0.2;
                    rightChannel[channelIdx] += signal * 0.19;
                }
            }
            
            currentSample += syllableSamples + gapSamples;
        });
    }

    reverseAudioBuffer(buffer) {
        const reversedBuffer = this.audioContext.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );
        
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const originalData = buffer.getChannelData(channel);
            const reversedData = reversedBuffer.getChannelData(channel);
            
            for (let i = 0; i < originalData.length; i++) {
                reversedData[i] = originalData[originalData.length - 1 - i];
            }
        }
        
        return reversedBuffer;
    }

    async togglePlay() {
        await this.initAudioContext();
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.source) {
            this.source.disconnect();
        }
        
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.filters.reverse ? this.reversedBuffer : this.originalBuffer;
        
        this.updateFilters();
        
        this.source.connect(this.lowpassFilter);
        this.lowpassFilter.connect(this.highpassFilter);
        this.highpassFilter.connect(this.noiseGain);
        this.noiseGain.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        const offset = this.pauseTime;
        this.source.start(0, offset);
        this.startTime = this.audioContext.currentTime - offset;
        
        this.isPlaying = true;
        this.updateUI();
        this.startVisualization();
        
        this.source.onended = () => {
            if (this.isPlaying) {
                this.stop();
            }
        };
    }

    pause() {
        if (this.source) {
            this.source.stop();
        }
        this.pauseTime = this.audioContext.currentTime - this.startTime;
        this.isPlaying = false;
        this.updateUI();
        this.stopVisualization();
    }

    stop() {
        if (this.source) {
            this.source.stop();
            this.source.disconnect();
        }
        this.isPlaying = false;
        this.pauseTime = 0;
        this.updateUI();
        this.stopVisualization();
    }

    toggleFilter(filterName) {
        this.filters[filterName] = !this.filters[filterName];
        
        const btn = document.querySelector(`[data-filter="${filterName}"]`);
        const statusEl = document.getElementById(
            filterName === 'noiseReduction' ? 'noise-status' : 'reverse-status'
        );
        
        if (this.filters[filterName]) {
            btn.classList.add('active');
            statusEl.textContent = '已启用';
        } else {
            btn.classList.remove('active');
            statusEl.textContent = '未启用';
        }
        
        if (this.isPlaying) {
            const currentTime = this.audioContext.currentTime - this.startTime;
            this.stop();
            this.pauseTime = currentTime;
            this.play();
        }
    }

    updateFilters() {
        if (this.filters.noiseReduction) {
            this.lowpassFilter.frequency.value = 3000;
            this.highpassFilter.frequency.value = 300;
            this.noiseGain.gain.value = 0.3;
        } else {
            this.lowpassFilter.frequency.value = 20000;
            this.highpassFilter.frequency.value = 20;
            this.noiseGain.gain.value = 1.0;
        }
    }

    updateUI() {
        const playBtn = document.getElementById('play-btn');
        const stopBtn = document.getElementById('stop-btn');
        const playIcon = document.getElementById('play-icon');
        const playText = document.getElementById('play-text');
        const statusEl = document.getElementById('tape-status');
        
        if (this.isPlaying) {
            playBtn.classList.add('active');
            playIcon.textContent = '❚❚';
            playText.textContent = '暂停';
            stopBtn.disabled = false;
            statusEl.classList.add('playing');
            statusEl.textContent = '播放中';
        } else {
            playBtn.classList.remove('active');
            playIcon.textContent = '▶';
            playText.textContent = '播放';
            statusEl.classList.remove('playing');
            statusEl.textContent = this.pauseTime > 0 ? '已暂停' : '待播放';
        }
    }

    startVisualization() {
        const canvas = document.getElementById('audio-visualizer');
        const ctx = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            this.animationId = requestAnimationFrame(draw);
            
            this.analyser.getByteFrequencyData(dataArray);
            
            ctx.fillStyle = '#050510';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                
                const hue = 180 + (dataArray[i] / 255) * 60;
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }

    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        const canvas = document.getElementById('audio-visualizer');
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#00d9ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    }

    async verifyPassword() {
        const passwordInput = document.getElementById('password-input');
        const submitBtn = document.getElementById('submit-btn');
        const feedbackEl = document.getElementById('password-feedback');
        const password = passwordInput.value.trim();
        
        if (!password) {
            this.showFeedback('请输入密码', 'error');
            return;
        }
        
        submitBtn.disabled = true;
        passwordInput.disabled = true;
        
        try {
            const response = await fetch('/api/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showFeedback(data.message, 'success');
                this.revealTruth(data);
            } else {
                this.showFeedback(data.message, 'error');
                submitBtn.disabled = false;
                passwordInput.disabled = false;
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (error) {
            console.error('Error:', error);
            this.showFeedback('网络错误，请稍后重试', 'error');
            submitBtn.disabled = false;
            passwordInput.disabled = false;
        }
    }

    showFeedback(message, type) {
        const feedbackEl = document.getElementById('password-feedback');
        feedbackEl.textContent = message;
        feedbackEl.className = `feedback ${type}`;
        feedbackEl.classList.remove('hidden');
        
        setTimeout(() => {
            if (!feedbackEl.classList.contains('success')) {
                feedbackEl.classList.add('hidden');
            }
        }, 3000);
    }

    revealTruth(data) {
        const truthSection = document.getElementById('truth-section');
        const truthText = document.getElementById('truth-text');
        const truthAudio = document.getElementById('truth-audio');
        const passwordSection = document.querySelector('.password-section');
        
        passwordSection.style.opacity = '0.5';
        passwordSection.style.pointerEvents = 'none';
        
        truthText.textContent = data.truth;
        truthSection.classList.remove('hidden');
        
        this.generateTruthAudio();
        
        truthSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    generateTruthAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 5;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < sampleRate * duration; i++) {
            const t = i / sampleRate;
            const freq = 440 + Math.sin(t * 2) * 100;
            const envelope = t < 0.1 ? t / 0.1 : t > duration - 0.5 ? (duration - t) / 0.5 : 1;
            
            channelData[i] = Math.sin(t * freq * 2 * Math.PI) * 0.3 * envelope;
            channelData[i] += Math.sin(t * (freq * 1.5) * 2 * Math.PI) * 0.2 * envelope;
            channelData[i] += Math.sin(t * (freq * 2) * 2 * Math.PI) * 0.1 * envelope;
        }
        
        const truthAudio = document.getElementById('truth-audio');
        const audioBlob = this.bufferToWave(buffer);
        const audioUrl = URL.createObjectURL(audioBlob);
        truthAudio.src = audioUrl;
    }

    bufferToWave(abuffer) {
        const numOfChan = abuffer.numberOfChannels;
        const length = abuffer.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let i, sample, offset = 0, pos = 0;
        
        const setUint16 = (data) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };
        
        const setUint32 = (data) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };
        
        setUint32(0x46464952);
        setUint32(length - 8);
        setUint32(0x45564157);
        setUint32(0x20746d66);
        setUint32(16);
        setUint16(1);
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan);
        setUint16(numOfChan * 2);
        setUint16(16);
        setUint32(0x61746164);
        setUint32(abuffer.length * numOfChan * 2);
        
        for (i = 0; i < abuffer.numberOfChannels; i++) {
            channels.push(abuffer.getChannelData(i));
        }
        
        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }
        
        return new Blob([buffer], { type: "audio/wav" });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.audioArchaeologist = new AudioArchaeologist();
});
