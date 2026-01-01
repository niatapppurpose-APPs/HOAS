import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import PDFDocument from 'pdfkit'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())
const PORT = 5000

const DATA_DIR = path.join(__dirname, 'files')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR)
}

const ownerProfile = {
  collegeId: 'ABC123',
  ownerName: 'Hemanth',
  email: 'owner@test.com',
  students: 120,
  wardens: 4
}

app.get('/download/json', (req, res) => {
  console.log('➡️ /download/json hit')

  try {
    const filePath = path.join(DATA_DIR, 'report.json')
    console.log('Writing file to:', filePath)

    fs.writeFileSync(
      filePath,
      JSON.stringify(ownerProfile, null, 2),
      'utf8'
    )

    console.log('File written successfully')

    console.log('Starting download (stream) ...')
    res.on('close', () => console.log('Response closed by client'))
    res.on('finish', () => console.log('Response finished'))
    res.on('error', (e) => console.error('Response error event:', e))

    try {
      const stat = fs.statSync(filePath)
      res.setHeader('Content-Length', String(stat.size))
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', 'attachment; filename="college-report.json"')

      const readStream = fs.createReadStream(filePath)
      readStream.on('error', (e) => {
        console.error('File stream error:', e)
        if (!res.headersSent) res.status(500).send('Stream error')
        else res.destroy(e)
      })
      readStream.pipe(res)
    } catch (e) {
      console.error('Stream setup error:', e)
      if (!res.headersSent) res.status(500).send('Stream setup failed')
    }
  } catch (err) {
    console.error('JSON route error:', err)
    res.status(500).send('Internal error')
  }
})

app.post('/download/json', (req, res) => {
  console.log('➡️ POST /download/json hit')

  try {
    const filePath = path.join(DATA_DIR, 'report.json')
    console.log('Writing file to:', filePath)

    fs.writeFileSync(
      filePath,
      JSON.stringify(ownerProfile, null, 2),
      'utf8'
    )

    console.log('File written successfully')

    console.log('Starting download (stream) ...')
    res.on('close', () => console.log('Response closed by client'))
    res.on('finish', () => console.log('Response finished'))
    res.on('error', (e) => console.error('Response error event:', e))

    try {
      const stat = fs.statSync(filePath)
      res.setHeader('Content-Length', String(stat.size))
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', 'attachment; filename="college-report.json"')

      const readStream = fs.createReadStream(filePath)
      readStream.on('error', (e) => {
        console.error('File stream error:', e)
        if (!res.headersSent) res.status(500).send('Stream error')
        else res.destroy(e)
      })
      readStream.pipe(res)
    } catch (e) {
      console.error('Stream setup error:', e)
      if (!res.headersSent) res.status(500).send('Stream setup failed')
    }
  } catch (err) {
    console.error('JSON route error:', err)
    res.status(500).send('Internal error')
  }
})

app.get('/download/pdf', (req, res) => {
  const filePath = path.join(DATA_DIR, 'sample-report.pdf')

  const ensurePdf = async () => {
    try {
      if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
        console.log('PDF missing or empty — generating sample PDF at', filePath)
        await new Promise((resolve, reject) => {
          const doc = new PDFDocument()
          const stream = fs.createWriteStream(filePath)
          doc.pipe(stream)
          doc.fontSize(20).text('College Report', { align: 'center' })
          doc.moveDown()
          doc.fontSize(12).text(`College ID: ${ownerProfile.collegeId}`)
          doc.text(`Owner: ${ownerProfile.ownerName} <${ownerProfile.email}>`)
          doc.text(`Students: ${ownerProfile.students} — Wardens: ${ownerProfile.wardens}`)
          doc.end()
          stream.on('finish', resolve)
          stream.on('error', reject)
        })
        console.log('Sample PDF generated')
      }
    } catch (e) {
      console.error('Error ensuring PDF:', e)
      throw e
    }
  }

  ensurePdf().then(() => {
    res.download(filePath, 'college-report.pdf', err => {
      if (err) {
        console.error('PDF download error:', err)
        if (!res.headersSent) res.status(500).send('Download failed')
      }
    })
  }).catch(err => {
    res.status(500).send('Failed to prepare PDF')
  })
})

app.post('/download/pdf', (req, res) => {
  const filePath = path.join(DATA_DIR, 'sample-report.pdf')

  const ensurePdf = async () => {
    try {
      if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
        console.log('PDF missing or empty — generating sample PDF at', filePath)
        await new Promise((resolve, reject) => {
          const doc = new PDFDocument()
          const stream = fs.createWriteStream(filePath)
          doc.pipe(stream)
          doc.fontSize(20).text('College Report', { align: 'center' })
          doc.moveDown()
          doc.fontSize(12).text(`College ID: ${ownerProfile.collegeId}`)
          doc.text(`Owner: ${ownerProfile.ownerName} <${ownerProfile.email}>")`)
          doc.text(`Students: ${ownerProfile.students} — Wardens: ${ownerProfile.wardens}`)
          doc.end()
          stream.on('finish', resolve)
          stream.on('error', reject)
        })
        console.log('Sample PDF generated')
      }
    } catch (e) {
      console.error('Error ensuring PDF:', e)
      throw e
    }
  }

  ensurePdf().then(() => {
    res.download(filePath, 'college-report.pdf', err => {
      if (err) {
        console.error('PDF download error:', err)
        if (!res.headersSent) res.status(500).send('Download failed')
      }
    })
  }).catch(err => {
    res.status(500).send('Failed to prepare PDF')
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
