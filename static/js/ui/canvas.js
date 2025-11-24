// ui/canvas.js - Canvas drawing and area interactions

import { getCurrentRichMenu } from '../utils/helpers.js';
import { drawImageOnCanvas } from '../utils/image.js';
import { broadcastAreasUpdate } from '../socket/collaboration.js';

/**
 * Setup canvas HTML structure with dual-layer approach
 */
function setupCanvasHTML() {
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) return;
    canvasContainer.innerHTML = `
        <div id="richmenu-canvas-stage" style="position: relative; display: inline-block;">
            <canvas id="richmenu-canvas-bg" style="position: absolute; top: 0; left: 0; z-index: 1;"></canvas>
            <canvas id="richmenu-canvas-overlay" style="position: absolute; top: 0; left: 0; z-index: 2; pointer-events: all;"></canvas>
        </div>
    `;
}

/**
 * Setup canvas with proper dimensions and scaling
 * @param {Object} state - Editor state
 */
export async function setupCanvas(state) {
    setupCanvasHTML();

    const bgCanvas = document.getElementById('richmenu-canvas-bg');
    const overlayCanvas = document.getElementById('richmenu-canvas-overlay');

    if (!bgCanvas || !overlayCanvas) {
        console.error('Canvas elements not found');
        return;
    }

    const wrapper = overlayCanvas.closest('.canvas-wrapper');
    const stage = document.getElementById('richmenu-canvas-stage');
    const currentRM = getCurrentRichMenu(state);

    const paddingPx = 16;
    const maxWidth = (wrapper ? wrapper.clientWidth : 0) - paddingPx;
    const cw = Math.max(100, Math.round(maxWidth * 0.75));
    const ch = Math.round(cw * (currentRM.metadata.size.height / currentRM.metadata.size.width));

    if (stage) {
        stage.style.width = cw + 'px';
        stage.style.height = ch + 'px';
    }

    [bgCanvas, overlayCanvas].forEach(canvas => {
        canvas.width = cw;
        canvas.height = ch;
        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
    });

    state.scale = cw / currentRM.metadata.size.width;

    state.markDirty = () => {
        const saveBtn = document.getElementById('save-project');
        const dirtyDot = document.getElementById('dirty-dot');
        if (saveBtn) saveBtn.classList.add('dirty');
        if (dirtyDot) dirtyDot.style.display = '';
    };

    await drawBackground(state);
    drawOverlay(state);
    enableAreaInteractions(overlayCanvas, state);
}

/**
 * Draw background layer (image or grid)
 * @param {Object} state - Editor state
 */
export async function drawBackground(state) {
    const bgCanvas = document.getElementById('richmenu-canvas-bg');
    const ctx = bgCanvas.getContext('2d');
    const currentRM = getCurrentRichMenu(state);

    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    if (currentRM.image && currentRM.image.dataUrl) {
        await drawImageOnCanvas(ctx, currentRM.image.dataUrl, bgCanvas.width, bgCanvas.height);
    } else {
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < bgCanvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, bgCanvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < bgCanvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(bgCanvas.width, y);
            ctx.stroke();
        }
    }
}

/**
 * Draw overlay layer (areas and handles)
 * @param {Object} state - Editor state
 */
export function drawOverlay(state) {
    const overlayCanvas = document.getElementById('richmenu-canvas-overlay');
    const ctx = overlayCanvas.getContext('2d');

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    drawAreas(state);
    drawResizeHandles(state);
}

/**
 * Draw all areas on overlay
 * @param {Object} state - Editor state
 */
export function drawAreas(state) {
    const overlayCanvas = document.getElementById('richmenu-canvas-overlay');
    const ctx = overlayCanvas.getContext('2d');
    const currentRM = getCurrentRichMenu(state);
    const areas = currentRM.metadata.areas || [];

    areas.forEach((area, idx) => {
        const { x, y, width, height } = area.bounds;
        const sx = x * state.scale, sy = y * state.scale, sw = width * state.scale, sh = height * state.scale;

        if (idx === state.selectedAreaIndex) {
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.strokeStyle = '#02a568';
            ctx.lineWidth = 3;
            ctx.strokeRect(sx, sy, sw, sh);
            ctx.restore();

            ctx.fillStyle = 'rgba(2,165,104,0.15)';
            ctx.fillRect(sx, sy, sw, sh);
        } else {
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.strokeStyle = '#1a73e8';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, sy, sw, sh);
            ctx.restore();

            ctx.fillStyle = 'rgba(26,115,232,0.08)';
            ctx.fillRect(sx, sy, sw, sh);
        }

        ctx.save();
        ctx.fillStyle = idx === state.selectedAreaIndex ? '#02a568' : '#1a73e8';
        ctx.font = 'bold 12px Arial';
        const text = `#${idx + 1}`;
        const textWidth = ctx.measureText(text).width;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(sx + 2, sy + 2, textWidth + 4, 16);

        ctx.fillStyle = idx === state.selectedAreaIndex ? '#02a568' : '#1a73e8';
        ctx.fillText(text, sx + 4, sy + 14);
        ctx.restore();
    });
}

/**
 * Draw resize handles for selected area
 * @param {Object} state - Editor state
 */
export function drawResizeHandles(state) {
    if (state.selectedAreaIndex < 0) return;

    const overlayCanvas = document.getElementById('richmenu-canvas-overlay');
    const ctx = overlayCanvas.getContext('2d');
    const currentRM = getCurrentRichMenu(state);
    const area = currentRM.metadata.areas[state.selectedAreaIndex];
    const { x, y, width, height } = area.bounds;

    const sx = x * state.scale;
    const sy = y * state.scale;
    const sw = width * state.scale;
    const sh = height * state.scale;

    const handleSize = 8;
    const handles = [
        { x: sx - handleSize / 2, y: sy - handleSize / 2 },
        { x: sx + sw / 2 - handleSize / 2, y: sy - handleSize / 2 },
        { x: sx + sw - handleSize / 2, y: sy - handleSize / 2 },
        { x: sx + sw - handleSize / 2, y: sy + sh / 2 - handleSize / 2 },
        { x: sx + sw - handleSize / 2, y: sy + sh - handleSize / 2 },
        { x: sx + sw / 2 - handleSize / 2, y: sy + sh - handleSize / 2 },
        { x: sx - handleSize / 2, y: sy + sh - handleSize / 2 },
        { x: sx - handleSize / 2, y: sy + sh / 2 - handleSize / 2 },
    ];

    handles.forEach(handle => {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = '#02a568';
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
        ctx.restore();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
}

/**
 * Enable area interactions (create, drag, resize)
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} state - Editor state
 */
export function enableAreaInteractions(canvas, state) {
    let mode = 'select';
    let dragStart = null;
    let dragOffset = { x: 0, y: 0 };
    let resizeHandle = null;

    const getCanvasPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const hitTestArea = (pos) => {
        const currentRM = getCurrentRichMenu(state);
        const areas = currentRM.metadata.areas || [];
        for (let i = areas.length - 1; i >= 0; i--) {
            const a = areas[i];
            const x = a.bounds.x * state.scale;
            const y = a.bounds.y * state.scale;
            const w = a.bounds.width * state.scale;
            const h = a.bounds.height * state.scale;
            if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
                return i;
            }
        }
        return -1;
    };

    const getResizeHandle = (pos) => {
        if (state.selectedAreaIndex < 0) return null;

        const currentRM = getCurrentRichMenu(state);
        const area = currentRM.metadata.areas[state.selectedAreaIndex];
        const { x, y, width, height } = area.bounds;

        const sx = x * state.scale;
        const sy = y * state.scale;
        const sw = width * state.scale;
        const sh = height * state.scale;

        const handleSize = 8;
        const tolerance = handleSize / 2;

        const handles = [
            { name: 'nw', x: sx, y: sy },
            { name: 'n', x: sx + sw / 2, y: sy },
            { name: 'ne', x: sx + sw, y: sy },
            { name: 'e', x: sx + sw, y: sy + sh / 2 },
            { name: 'se', x: sx + sw, y: sy + sh },
            { name: 's', x: sx + sw / 2, y: sy + sh },
            { name: 'sw', x: sx, y: sy + sh },
            { name: 'w', x: sx, y: sy + sh / 2 },
        ];

        for (const handle of handles) {
            if (Math.abs(pos.x - handle.x) <= tolerance && Math.abs(pos.y - handle.y) <= tolerance) {
                return handle.name;
            }
        }

        return null;
    };

    canvas.onmousedown = (e) => {
        const pos = getCanvasPos(e);

        const handle = getResizeHandle(pos);
        if (handle && state.selectedAreaIndex >= 0) {
            mode = 'resizing';
            resizeHandle = handle;
            return;
        }

        const hitIndex = hitTestArea(pos);
        if (hitIndex >= 0) {
            state.selectedAreaIndex = hitIndex;
            mode = 'dragging';
            const currentRM = getCurrentRichMenu(state);
            const area = currentRM.metadata.areas[hitIndex];
            dragOffset.x = pos.x - area.bounds.x * state.scale;
            dragOffset.y = pos.y - area.bounds.y * state.scale;

            drawOverlay(state);
            if (window.updateActionPanel) window.updateActionPanel(state);
            return;
        }

        mode = 'creating';
        dragStart = pos;
        state.selectedAreaIndex = -1;
        if (window.updateActionPanel) window.updateActionPanel(state);
    };

    canvas.onmouseup = (e) => {
        if (mode === 'creating' && dragStart) {
            const pos = getCanvasPos(e);
            const x = Math.min(dragStart.x, pos.x);
            const y = Math.min(dragStart.y, pos.y);
            const w = Math.abs(pos.x - dragStart.x);
            const h = Math.abs(pos.y - dragStart.y);

            if (w > 10 && h > 10) {
                const currentRM = getCurrentRichMenu(state);
                const area = {
                    bounds: {
                        x: Math.round(x / state.scale),
                        y: Math.round(y / state.scale),
                        width: Math.round(w / state.scale),
                        height: Math.round(h / state.scale)
                    },
                    action: { type: 'uri', uri: '' }
                };
                currentRM.metadata.areas.push(area);
                state.selectedAreaIndex = currentRM.metadata.areas.length - 1;

                if (window.updateActionPanel) window.updateActionPanel(state);
                if (window.renderJsonPreview) window.renderJsonPreview(state);
                if (state.scheduleAutosave) state.scheduleAutosave();

                broadcastAreasUpdate(currentRM.id, currentRM.metadata.areas);
            }

            drawOverlay(state);
        }

        if (mode === 'dragging' || mode === 'resizing') {
            const currentRM = getCurrentRichMenu(state);
            broadcastAreasUpdate(currentRM.id, currentRM.metadata.areas);
        }

        mode = 'select';
        dragStart = null;
        resizeHandle = null;
    };

    canvas.oncontextmenu = (e) => {
        e.preventDefault();
        return false;
    };
}

/**
 * Redraw entire canvas (convenience function)
 * @param {Object} state - Editor state
 */
export function redrawCanvas(state) {
    drawBackground(state);
    drawOverlay(state);
}
