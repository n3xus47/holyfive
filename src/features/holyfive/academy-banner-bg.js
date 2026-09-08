(function () {
    'use strict';

    const BG_COLOR = '#0f0f0f';
    const LINE_COLOR_MAIN = 'rgba(90, 90, 90, 0.5)';
    const LINE_COLOR_ACCENT = 'rgba(120, 120, 120, 0.4)';
    const NUM_LINES = 6;
    const SEGMENTS = 120;
    const SPEED = 0.03;
    const MARGIN = 80;

    let canvas, ctx, w, h;
    let phase = 0;

    function resize() {
        const banner = canvas.closest('.academy-banner');
        if (!banner) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = banner.offsetWidth;
        h = banner.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    function drawFullLine(lineIndex, t) {
        const step = (w + 2 * MARGIN) / SEGMENTS;
        const startX = -MARGIN;
        const baseY = (lineIndex + 1) * (h / (NUM_LINES + 1));
        const amp = h * 0.12;
        const freq1 = 0.008;
        const freq2 = 0.013;
        const phase1 = t + lineIndex * 0.7;
        const phase2 = t * 0.6 + lineIndex * 1.2;

        ctx.beginPath();
        for (let i = 0; i <= SEGMENTS; i++) {
            const x = startX + i * step;
            const y = baseY
                + Math.sin(x * freq1 + phase1) * amp
                + Math.sin(x * freq2 + phase2) * (amp * 0.6);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        const isAccent = lineIndex % 3 === 0;
        ctx.strokeStyle = isAccent ? LINE_COLOR_ACCENT : LINE_COLOR_MAIN;
        ctx.lineWidth = isAccent ? 1.3 : 1;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    function draw() {
        if (!ctx || w <= 0 || h <= 0) return;
        phase += SPEED;
        const t = phase;

        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < NUM_LINES; i++) {
            drawFullLine(i, t);
        }

        requestAnimationFrame(draw);
    }

    function start() {
        canvas = document.querySelector('.academy-banner__bg');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        if (!ctx) return;

        resize();
        draw();

        const ro = new ResizeObserver(resize);
        ro.observe(canvas.closest('.academy-banner'));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
