import { expect } from 'chai'
import zlib from 'zlib'
import { assembleApng, isPng } from '../../lib/helper/extras/apngAssembler.js'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// Independent CRC-32 (not the module's own), used only to build fixtures here and to
// re-verify the module's output CRCs without depending on the code under test.
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([length, typeBuf, data, crc])
}

function tinyPng(width, height, fillByte) {
  const rows = []
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width)
    row[0] = 0
    row.fill(fillByte, 1)
    rows.push(row)
  }
  const compressed = zlib.deflateSync(Buffer.concat(rows))
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 0 // color type: grayscale
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  return Buffer.concat([PNG_SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

function readAllChunks(buf) {
  const chunks = []
  let offset = 8
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset)
    const type = buf.toString('ascii', offset + 4, offset + 8)
    const data = buf.subarray(offset + 8, offset + 8 + length)
    const storedCrc = buf.readUInt32BE(offset + 8 + length)
    chunks.push({ type, data, storedCrc })
    offset += 12 + length
    if (type === 'IEND') break
  }
  return chunks
}

describe('apngAssembler', () => {
  it('produces PNG-signed output with acTL and one fcTL per frame, valid CRCs', () => {
    const frame1 = tinyPng(2, 2, 10)
    const frame2 = tinyPng(2, 2, 200)

    const buf = assembleApng([
      { buffer: frame1, delayMs: 150 },
      { buffer: frame2, delayMs: 150 },
    ])

    expect(isPng(buf)).to.equal(true)
    expect(buf.subarray(0, 8)).to.deep.equal(PNG_SIGNATURE)

    const chunks = readAllChunks(buf)
    const types = chunks.map(c => c.type)
    expect(types[0]).to.equal('IHDR')
    expect(types).to.include('acTL')
    expect(types.filter(t => t === 'fcTL')).to.have.lengthOf(2)
    expect(types.filter(t => t === 'fdAT')).to.have.lengthOf(1)
    expect(types[types.length - 1]).to.equal('IEND')

    const acTL = chunks.find(c => c.type === 'acTL')
    expect(acTL.data.readUInt32BE(0)).to.equal(2)
    expect(acTL.data.readUInt32BE(4)).to.equal(0)

    for (const c of chunks) {
      const computed = crc32(Buffer.concat([Buffer.from(c.type, 'ascii'), c.data]))
      expect(computed, `CRC for ${c.type}`).to.equal(c.storedCrc)
    }
  })

  it('drops a frame whose dimensions differ from the first frame, via onDropFrame', () => {
    const frame1 = tinyPng(2, 2, 1)
    const mismatched = tinyPng(3, 3, 1)
    const dropped = []
    const buf = assembleApng(
      [
        { buffer: frame1, delayMs: 100 },
        { buffer: mismatched, delayMs: 100 },
      ],
      { onDropFrame: info => dropped.push(info) },
    )
    expect(dropped).to.have.lengthOf(1)
    expect(dropped[0]).to.deep.equal({ width: 3, height: 3, expectedWidth: 2, expectedHeight: 2 })
    const chunks = readAllChunks(buf)
    const acTL = chunks.find(c => c.type === 'acTL')
    expect(acTL.data.readUInt32BE(0)).to.equal(1)
    expect(chunks.filter(c => c.type === 'fdAT')).to.have.lengthOf(0)
  })

  it('throws when given no frames', () => {
    expect(() => assembleApng([])).to.throw()
  })

  it('isPng rejects non-PNG buffers', () => {
    expect(isPng(Buffer.from('not a png'))).to.equal(false)
    expect(isPng(Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0]))).to.equal(false)
  })
})
