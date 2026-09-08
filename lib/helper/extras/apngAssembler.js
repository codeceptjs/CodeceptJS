const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

/**
 * True if `buf` starts with the 8-byte PNG signature.
 *
 * @param {object} buf a Buffer.
 * @returns {boolean}
 */
function isPng(buf) {
  return buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE)
}

function readChunks(buf) {
  if (!isPng(buf)) throw new Error('not a PNG file (bad signature)')
  const chunks = []
  let offset = 8
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset)
    const type = buf.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    if (dataEnd + 4 > buf.length) break
    const data = buf.subarray(dataStart, dataEnd)
    chunks.push({ type, data })
    offset = dataEnd + 4
    if (type === 'IEND') break
  }
  return chunks
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([length, typeBuf, data, crc])
}

function delayToFraction(delayMs) {
  let num = Math.max(1, Math.round(delayMs))
  let den = 1000
  while (num > 65535) {
    num = Math.round(num / 2)
    den = Math.round(den / 2) || 1
  }
  return { num, den }
}

/**
 * Muxes a sequence of complete, same-dimension PNG frames into a single APNG (Animated PNG) file.
 * This is byte-level PNG chunk container work only — no pixel encoding or decoding. The first
 * frame's `IHDR` and any other ancillary chunks (e.g. `gAMA`, `pHYs`) are carried over verbatim;
 * each frame's `IDAT` chunk(s) are concatenated and re-emitted as the animation's `IDAT` (frame 0)
 * or `fdAT` (subsequent frames) with a shared, monotonically increasing sequence number across all
 * `fcTL`/`fdAT` chunks, per the APNG spec.
 *
 * @param {Array<{buffer: object, delayMs: number}>} frames complete single-image PNG buffers with the
 * delay (in milliseconds) to hold that frame before advancing to the next one; the last frame's own
 * `delayMs` is ignored in favor of `options.lastFrameDelayMs`.
 * @param {object} [options] {onDropFrame: function, numPlays: number, lastFrameDelayMs: number} — options.onDropFrame(info) is called for any frame whose
 * dimensions don't match the first frame, which is then excluded from the output (APNG requires a
 * single fixed size per this implementation — no scaling). options.numPlays is the animation loop
 * count (0 = infinite, the default). options.lastFrameDelayMs is the hold time for the final frame
 * (default 1000ms).
 * @returns {object} a Buffer containing the assembled APNG file.
 */
function assembleApng(frames, options = {}) {
  if (!frames || !frames.length) throw new Error('assembleApng: at least one frame is required')

  const parsed = frames.map(f => ({ chunks: readChunks(f.buffer), delayMs: f.delayMs }))
  const ihdr = parsed[0].chunks.find(c => c.type === 'IHDR')
  if (!ihdr) throw new Error('assembleApng: first frame has no IHDR chunk')
  const width = ihdr.data.readUInt32BE(0)
  const height = ihdr.data.readUInt32BE(4)

  const usable = []
  for (const pf of parsed) {
    const frameIhdr = pf.chunks.find(c => c.type === 'IHDR')
    const w = frameIhdr && frameIhdr.data.readUInt32BE(0)
    const h = frameIhdr && frameIhdr.data.readUInt32BE(4)
    if (w !== width || h !== height) {
      if (typeof options.onDropFrame === 'function') {
        options.onDropFrame({ width: w, height: h, expectedWidth: width, expectedHeight: height })
      }
      continue
    }
    usable.push(pf)
  }
  if (!usable.length) throw new Error('assembleApng: no frames with dimensions matching the first frame')

  const out = [PNG_SIGNATURE, makeChunk('IHDR', ihdr.data)]

  const actl = Buffer.alloc(8)
  actl.writeUInt32BE(usable.length, 0)
  actl.writeUInt32BE(options.numPlays || 0, 4)
  out.push(makeChunk('acTL', actl))

  for (const c of parsed[0].chunks) {
    if (c.type === 'IHDR' || c.type === 'IDAT' || c.type === 'IEND') continue
    out.push(makeChunk(c.type, c.data))
  }

  let seq = 0
  usable.forEach((pf, i) => {
    const imageData = Buffer.concat(pf.chunks.filter(c => c.type === 'IDAT').map(c => c.data))
    const delayMs = i === usable.length - 1 ? (options.lastFrameDelayMs ?? 1000) : pf.delayMs
    const { num, den } = delayToFraction(delayMs)

    const fctl = Buffer.alloc(26)
    fctl.writeUInt32BE(seq++, 0)
    fctl.writeUInt32BE(width, 4)
    fctl.writeUInt32BE(height, 8)
    fctl.writeUInt32BE(0, 12)
    fctl.writeUInt32BE(0, 16)
    fctl.writeUInt16BE(num, 20)
    fctl.writeUInt16BE(den, 22)
    fctl.writeUInt8(0, 24)
    fctl.writeUInt8(0, 25)
    out.push(makeChunk('fcTL', fctl))

    if (i === 0) {
      out.push(makeChunk('IDAT', imageData))
    } else {
      const fdat = Buffer.alloc(4 + imageData.length)
      fdat.writeUInt32BE(seq++, 0)
      imageData.copy(fdat, 4)
      out.push(makeChunk('fdAT', fdat))
    }
  })

  out.push(makeChunk('IEND', Buffer.alloc(0)))
  return Buffer.concat(out)
}

export { assembleApng, isPng, readChunks, crc32, PNG_SIGNATURE }
