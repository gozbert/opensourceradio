require('dotenv').config();
const express = require('express');
const router = express.Router();
const pm2 = require('pm2');
const { SongLogRepository } = require('../repo');

const { errorHandler, authMiddleware } = require('./middleware');

const processInfo = {
  name: process.env.STREAM_NAME,
  startScript: process.env.STREAM_START_SCRIPT,
  workingDirectory: process.env.STREAM_WORKING_DIR,
};

const onStatus = (res) => (err, process) => {
  if(err) return res.status(500).json({ err });

  if(process.length === 0) {
    return res.status(500).json({error: 'No process found.'});
  }
  const description = {
    status: process[0].pm2_env.status
  };
  return res.json({ description });
};

router.post('/start', authMiddleware, (req, res) => {
  pm2.start(processInfo.startScript, { name: processInfo.name, cwd: processInfo.workingDirectory }, onStatus(res));
});

router.post('/stop', authMiddleware, (req, res) => {
  pm2.stop(processInfo.name, (err) => {
    if(err) res.status(500).json({ err });
    else res.json({ ok: true });
  });
});

router.get('/status', authMiddleware, (req, res) => {
  pm2.describe(processInfo.name, onStatus(res));
});

router.get('/log', authMiddleware, (req, res) => {
  SongLogRepository.latest()
    .then(logs => {
      const currentLog = logs[0];
      delete currentLog.ffmpeg_command;
      res.json({ currentLog });
    });
});

module.exports = router;
