#!/usr/bin/env python3
"""Animate the type and icon stills in the homepage's Enode carousel.

Each still is taken apart into a background plate and a few layers (a word, a
line of text, the guide lines, an icon), and the layers are brought in with the reveal
enode.com uses: fade up from 0, rise 12px, sharpen from blur(8px), over 0.7s on
cubic-bezier(0.16, 1, 0.3, 1). The stills are 2x, so those are 24px and 16px
here. Every video holds on a frame identical to its still, then leaves on the
mirrored curve and loops.

The carousel shows a frame for 3 seconds and plays these from the start each
time (`data-reveal`, see home.js), so the reveal has to land well inside that;
the exit is only ever seen by someone who stops the carousel on the frame.

Each still stays in the page under its video, and is what anyone sees who has
no video yet, or asked for less motion or less data. So a video has to end on
its still exactly, which render() checks.

Needs numpy, Pillow and ffmpeg. Run from the repo root:

    python3 scripts/build-type-animations.py              # all four
    python3 scripts/build-type-animations.py enode-icons  # just the one
"""

import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ASSETS = Path('src/assets/work')
W, H = 2800, 1400
FPS = 30
TOTAL = 7.5
CRF = 21

RISE = 24.0
BLUR = 16.0
IN_DUR = 0.7
OUT_DUR = 0.5
STEP = 0.12
OUT_STEP = 0.08
START = 0.4
OUT_AT = 6.0

BG = np.array([207, 255, 173], np.float32)
PAD = 96  # room around a layer for its blur and travel


def cubic_bezier(x1, y1, x2, y2):
    def coord(a, b, s):
        return 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3

    def ease(p):
        if p <= 0:
            return 0.0
        if p >= 1:
            return 1.0
        lo, hi = 0.0, 1.0
        for _ in range(40):
            mid = (lo + hi) / 2
            if coord(x1, x2, mid) < p:
                lo = mid
            else:
                hi = mid
        return coord(y1, y2, (lo + hi) / 2)

    return ease


ENTER = cubic_bezier(0.16, 1, 0.3, 1)
EXIT = cubic_bezier(0.7, 0, 0.84, 0)


def load(name):
    image = Image.open(ASSETS / name).convert('RGB')
    assert image.size == (W, H), f'{name} is {image.size}, expected {(W, H)}'
    return np.asarray(image).astype(np.float32)


def darkness(image):
    return 1 - image.mean(2) / BG.mean()


def dilate(mask, radius):
    out = mask.copy()
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            out |= np.roll(np.roll(mask, dy, 0), dx, 1)
    return out


class Layer:
    """A piece of the still, as its difference from the plate, cropped."""

    def __init__(self, delta, mask):
        ys, xs = np.where(mask)
        self.y0, self.y1 = ys.min() - PAD, ys.max() + 1 + PAD
        self.x0, self.x1 = xs.min() - PAD, xs.max() + 1 + PAD
        h, w = self.y1 - self.y0, self.x1 - self.x0
        self.delta = np.zeros((h, w, 3), np.float32)
        sy0, sy1 = max(self.y0, 0), min(self.y1, H)
        sx0, sx1 = max(self.x0, 0), min(self.x1, W)
        crop = np.where(mask[sy0:sy1, sx0:sx1, None], delta[sy0:sy1, sx0:sx1], 0)
        self.delta[sy0 - self.y0:sy1 - self.y0, sx0 - self.x0:sx1 - self.x0] = crop
        self._fft = None

    def moved(self, dy, sigma):
        """The layer shifted down by dy and gaussian-blurred, in one pass."""
        if self._fft is None:
            self._fft = np.fft.rfft2(self.delta, axes=(0, 1))
            h, w = self.delta.shape[:2]
            self._fy = np.fft.fftfreq(h)[:, None]
            self._fx = np.fft.rfftfreq(w)[None, :]
        response = np.exp(-2 * np.pi ** 2 * sigma ** 2 * (self._fx ** 2 + self._fy ** 2))
        response = response * np.exp(-2j * np.pi * self._fy * dy)
        return np.fft.irfft2(self._fft * response[..., None], s=self.delta.shape[:2], axes=(0, 1))

    def add(self, frame, contribution):
        sy0, sy1 = max(self.y0, 0), min(self.y1, H)
        sx0, sx1 = max(self.x0, 0), min(self.x1, W)
        frame[sy0:sy1, sx0:sx1] += contribution[sy0 - self.y0:sy1 - self.y0, sx0 - self.x0:sx1 - self.x0]

    def exit_state(self, t):
        """None before the exit, else its progress from 0 to 1."""
        if t < self.t_out:
            return None
        return EXIT((t - self.t_out) / OUT_DUR)

    def leave(self, frame, q):
        if q < 1:
            self.add(frame, self.moved(-RISE * q, BLUR * q) * (1 - q))


class Reveal(Layer):
    """Fade up, rise and sharpen; leave the same way, still rising."""

    def __init__(self, delta, mask, t_in, t_out):
        super().__init__(delta, mask)
        self.t_in, self.t_out = t_in, t_out

    def is_static(self, t):
        return t <= self.t_in or self.t_in + IN_DUR <= t <= self.t_out or t >= self.t_out + OUT_DUR

    def draw(self, frame, t):
        if t <= self.t_in:
            return
        q = self.exit_state(t)
        if q is not None:
            return self.leave(frame, q)
        p = ENTER((t - self.t_in) / IN_DUR)
        if p >= 1:
            return self.add(frame, self.delta)
        self.add(frame, self.moved(RISE * (1 - p), BLUR * (1 - p)) * p)


class Wipe(Layer):
    """Drawn in from the left behind a soft edge; fades on the way out."""

    def __init__(self, delta, mask, t_in, t_out, duration, feather):
        super().__init__(delta, mask)
        self.t_in, self.t_out = t_in, t_out
        self.duration, self.feather = duration, feather
        xs = np.where(mask)[1]
        self.left, self.right = xs.min(), xs.max()
        self.columns = np.arange(self.x0, self.x1, dtype=np.float32)

    def is_static(self, t):
        return t <= self.t_in or self.t_in + self.duration <= t <= self.t_out or t >= self.t_out + OUT_DUR

    def draw(self, frame, t):
        if t <= self.t_in:
            return
        q = self.exit_state(t)
        if q is not None:
            if q < 1:
                self.add(frame, self.delta * (1 - q))
            return
        p = ENTER((t - self.t_in) / self.duration)
        if p >= 1:
            return self.add(frame, self.delta)
        front = self.left + p * (self.right - self.left + self.feather)
        edge = np.clip((front - self.columns) / self.feather, 0, 1)
        edge = edge * edge * (3 - 2 * edge)
        self.add(frame, self.delta * edge[None, :, None])


class Typed(Layer):
    """Set one character at a time, the way a monospace invites."""

    def __init__(self, delta, mask, t_in, t_out, characters, per_character):
        super().__init__(delta, mask)
        self.t_in, self.t_out = t_in, t_out
        self.characters, self.per_character = characters, per_character
        self.columns = np.arange(self.x0, self.x1)

    def is_static(self, t):
        done = self.t_in + len(self.characters) * self.per_character
        return t <= self.t_in or done <= t <= self.t_out or t >= self.t_out + OUT_DUR

    def draw(self, frame, t):
        if t <= self.t_in:
            return
        q = self.exit_state(t)
        if q is not None:
            return self.leave(frame, q)
        count = int((t - self.t_in) / self.per_character) + 1
        if count >= len(self.characters):
            return self.add(frame, self.delta)
        visible = self.columns < self.characters[count - 1][1]
        self.add(frame, self.delta * visible[None, :, None])


def text_runs(mask, axis, gap):
    """Spans of a mask along an axis, merging any closer together than gap."""
    filled = np.flatnonzero(mask.any(1 - axis))
    runs = [[filled[0], filled[0]]]
    for position in filled[1:]:
        if position - runs[-1][1] > gap:
            runs.append([position, position])
        else:
            runs[-1][1] = position
    return [(a, b + 1) for a, b in runs]


def band(shape, axis, start, stop):
    mask = np.zeros(shape, bool)
    if axis == 0:
        mask[start:stop] = True
    else:
        mask[:, start:stop] = True
    return mask


def specimen():
    """Enode Sans and Enode Mono, over their guide lines."""
    still = load('enode-type.png')
    dark = darkness(still)
    ink = dark > 0.5
    text = dilate(ink, 3)
    layers = []

    rows = text_runs(ink, 0, gap=20)
    assert len(rows) == 3, rows
    bands = [band((H, W), 0, a - 8, b + 8) for a, b in rows]

    # The guides are the rows a hairline runs most of the way along. They are
    # drawn before the type lands on them, so each is carried on underneath it
    # in the colour it has in the open.
    hair = (dark > 0.03) & ~text
    guide_rows = np.flatnonzero(hair.mean(1) > 0.3)
    guides = text_runs(np.isin(np.arange(H), guide_rows)[:, None], 0, gap=3)
    assert len(guides) == 6, guides
    start = min(np.flatnonzero(hair[row]).min() for row in guide_rows)
    lines = np.zeros((H, W, 3), np.float32)
    for index, (a, b) in enumerate(guides):
        mask = np.zeros((H, W), bool)
        for row in range(a - 1, b + 1):
            open_run = ~text[row, start:]
            colour = np.median(still[row, start:][open_run], axis=0)
            lines[row, start:] = np.where(open_run[:, None], still[row, start:], colour) - BG
            mask[row, start:] = True
        layers.append(Wipe(lines, mask, 0.3 + 0.05 * index, OUT_AT, duration=0.9, feather=80))
    on_guide = np.abs(lines).sum(2) > 0

    # Everything that isn't a guide: the type, and the outlined glyphs.
    rest = still - BG - lines
    taken = np.zeros((H, W), bool)

    def claim(mask):
        taken[mask] = True
        return mask

    words = [claim(text & rows_of) for rows_of in bands]
    for index, word in enumerate(words[:2]):
        layers.append(Reveal(rest, word, START + 0.05 + STEP * index, OUT_AT + OUT_STEP * index))

    # The outlined alphabet and figures, one row beside each word.
    marked = (np.abs(rest).sum(2) > 1) & ~text & ~on_guide
    for index, (a, b) in enumerate(rows[:2]):
        beside = band((H, W), 1, np.where(ink[a:b])[1].max() + 12, W)
        mask = claim(band((H, W), 0, a - 12, b + 12) & beside & marked)
        layers.append(Wipe(rest, mask, 0.75 + STEP * index, OUT_AT, duration=1.1, feather=280))

    characters = text_runs(ink & bands[2], 1, gap=4)
    layers.append(Typed(rest, words[2], 1.0, OUT_AT + OUT_STEP * 2, characters, per_character=0.05))

    plate = BG + np.where(taken[..., None], 0, rest)
    return still, plate, layers


def shared_plate(first, second):
    """The dot grid the two statements sit on, with both sets of type lifted off.

    The stills share a background exactly, so each fills in most of what the
    other's type covers. Where both have type, the grid repeats every 16px, so
    the nearest uncovered pixel a whole number of cells away stands in.
    """
    masks = [dilate(darkness(image) > 0.3, 3) for image in (first, second)]
    plate = first.copy()
    plate[masks[0]] = second[masks[0]]
    todo = masks[0] & masks[1]
    known = ~todo
    cell = 16
    offsets = [(dy * cell, dx * cell) for dy in range(-12, 13) for dx in range(-12, 13) if (dy, dx) != (0, 0)]
    offsets.sort(key=lambda o: o[0] ** 2 + o[1] ** 2)
    for dy, dx in offsets:
        if not todo.any():
            break
        source_known = np.roll(np.roll(known, dy, 0), dx, 1)
        fill = todo & source_known
        plate[fill] = np.roll(np.roll(plate, dy, 0), dx, 1)[fill]
        todo &= ~fill
    plate[todo] = BG
    return plate, masks


def statement(still, plate, mask, axis, gap):
    """A line of display type, brought in a word or a line at a time."""
    delta = still - plate
    ink = darkness(still) > 0.3
    layers = []
    runs = text_runs(ink, axis, gap)
    edges = [0] + [(runs[i][1] + runs[i + 1][0]) // 2 for i in range(len(runs) - 1)] + [H if axis == 0 else W]
    for index in range(len(runs)):
        piece = mask & band((H, W), axis, edges[index], edges[index + 1])
        layers.append(Reveal(delta, piece, START + STEP * index, OUT_AT + OUT_STEP * index))
    return layers


def icons():
    """The icon set, arriving as a wave from the top left corner."""
    still = load('enode-icons.png')
    ground = np.median(still.reshape(-1, 3), axis=0)
    marked = dilate(np.abs(still - ground).sum(2) > 24, 3)
    plate = np.where(marked[..., None], ground, still)
    delta = still - plate
    rows = text_runs(marked, 0, gap=20)
    columns = text_runs(marked, 1, gap=20)
    assert (len(rows), len(columns)) == (5, 9), (rows, columns)
    layers = []
    for r, (top, bottom) in enumerate(rows):
        across = marked & band((H, W), 0, top, bottom)
        for c, (left, right) in enumerate(columns):
            icon = across & band((H, W), 1, left, right)
            layers.append(Reveal(delta, icon, START + 0.035 * (r + c), OUT_AT + 0.02 * (r + c)))
    return still, plate, layers


def render(name, still, plate, layers):
    frames = round(TOTAL * FPS)
    out = ASSETS / name
    with tempfile.TemporaryDirectory() as tmp:
        master = Path(tmp) / 'master.mkv'
        encoder = subprocess.Popen(
            ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
             '-r', str(FPS), '-i', '-', '-c:v', 'libx264rgb', '-crf', '0', '-preset', 'ultrafast', str(master)],
            stdin=subprocess.PIPE)
        held = None
        worst = 0.0
        for index in range(frames):
            t = index / FPS
            if all(layer.is_static(t) for layer in layers) and START + 2 < t < OUT_AT and held is not None:
                encoder.stdin.write(held)
                continue
            frame = plate.copy()
            for layer in layers:
                layer.draw(frame, t)
            if START + 2.5 < t < OUT_AT:
                worst = max(worst, float(np.abs(frame - still).max()))
                held = np.clip(frame + 0.5, 0, 255).astype(np.uint8).tobytes()
                encoder.stdin.write(held)
            else:
                encoder.stdin.write(np.clip(frame + 0.5, 0, 255).astype(np.uint8).tobytes())
        encoder.stdin.close()
        if encoder.wait() != 0:
            sys.exit(f'ffmpeg failed on {name}')
        assert worst < 0.01, f'{name}: the held frame differs from its still by {worst}'

        # H.264 only: on flat artwork like this VP9 came out within a few
        # percent either way, which doesn't earn a second file. The half-size
        # copy is what a phone is given. Four reference frames keeps the pair
        # at levels 5.0 and 3.2; veryslow's sixteen would ask for 6.0 and 5.0,
        # which is more than a lot of hardware decoders take.
        tags = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv']
        for suffix, width in (('', W), ('-small', W // 2)):
            scale = (f'scale={width}:-2:flags=lanczos+accurate_rnd+full_chroma_int'
                     ':out_color_matrix=bt709:out_range=tv,format=yuv420p')
            target = f'{out}{suffix}.mp4'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(master), '-vf', scale, *tags,
                            '-c:v', 'libx264', '-crf', str(CRF), '-preset', 'veryslow', '-refs', '4', '-an',
                            '-movflags', '+faststart', target], check=True)
            print(f'{target}  {Path(target).stat().st_size / 1024:.0f} KB')


def main():
    only = sys.argv[1:]

    def wanted(name):
        return not only or name in only

    if wanted('enode-type'):
        render('enode-type', *specimen())

    if wanted('enode-next-grid') or wanted('enode-invisible-enabler'):
        next_grid = load('enode-next-grid.png')
        enabler = load('enode-invisible-enabler.png')
        plate, masks = shared_plate(next_grid, enabler)
        if wanted('enode-next-grid'):
            render('enode-next-grid', next_grid, plate, statement(next_grid, plate, masks[0], axis=1, gap=60))
        if wanted('enode-invisible-enabler'):
            render('enode-invisible-enabler', enabler, plate, statement(enabler, plate, masks[1], axis=0, gap=20))

    if wanted('enode-icons'):
        render('enode-icons', *icons())


if __name__ == '__main__':
    main()
