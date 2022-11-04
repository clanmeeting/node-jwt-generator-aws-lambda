require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');

const app = express();
const path = '/api/v1';
app.use(cors());
app.options('*', cors());

app.get(`${path}/consumers/:consumerId/jwts`, (req, res) => {
  const consumerId = req.params.consumerId;
  const { roomName } = req.query;
  if (consumerId) {
    const header = {
      keyid: consumerId,
      algorithm: 'RS256'
    }
    const payLoad = {
      sub: consumerId,
      aud: 'clanmeeting',
      iss: 'production',
      room: roomName ?? '*',
      // valid for 5 minutes
      exp: Math.floor(Date.now() / 1000) + (60 * 120),
      nbf: Math.floor(Date.now() / 1000),
      context: {},
    }
    let signature;
    try {
      signature = fs.readFileSync(`./private-keys/cm-api-key-${consumerId}.pem`);
    } catch (err) {
      if (err.code !== 'ENOENT') return res.status(500).json({ success: false, error: { message: err } });
      return res.status(500).json({ success: false, error: { message: 'Invalid consumerId' } });
    }
    const token = jwt.sign(payLoad, signature, header);
    if (token) return res.status(200).json({ success: true, data: { token: token } });
    return res.status(500).json({ success: false, error: { message: 'Error generating jwt' } });
  }
  return res.status(400).json({ success: false, error: { message: 'Please set a valid consumerId' } });
});

let port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is up and running on ${port} ...`);
});

module.exports = app;