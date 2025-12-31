import http from 'http'

const url = 'http://localhost:5000/download/json'

http.get(url, res => {
  console.log('STATUS', res.statusCode)
  res.on('data', () => {})
  res.on('end', () => console.log('END'))
}).on('error', err => {
  console.error('CLIENT ERROR', err)
})
