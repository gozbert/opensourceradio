require('dotenv').config();
const fs = require('fs');
const musicMetadata = require('music-metadata');
const fx = require('mkdir-recursive');
const { promisify } = require('util');
const { resolve } = require('path');
const ffmetadata = require("ffmetadata");

const readdir = promisify(fs.readdir);
const removeFile = promisify(fs.unlink);
const stat = promisify(fs.stat);
const ROOT_AUDIO_PATH = require(`${process.env.STREAM_WORKING_DIR}/config.json`).AUDIO_PATH;

async function getFiles(dir) {
  const subdirs = await readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = resolve(dir, subdir);
    return (await stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.reduce((a, f) => a.concat(f), []);
}

function getMetadataForSong(filename) {
  return musicMetadata.parseFile(`${ROOT_AUDIO_PATH}/${filename}`, { duration: true })
    .then(metadata => {
      return {
        artist: metadata.common.artist,
        album: metadata.common.album,
        title: metadata.common.title
      };
    });
}

function writeMetadataForSong(filename, metadata) {
  return new Promise((resolve, reject) => {
    ffmetadata.write(`${ROOT_AUDIO_PATH}/${filename}`, metadata, function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getMetadataForSongs(songs) {
  return Promise.all(songs.map(audioPath => {
    audioPath = `${ROOT_AUDIO_PATH}${audioPath}`;
    return musicMetadata.parseFile(audioPath, { duration: true })
    .then(metadata => {
      return {
        artist: metadata.common.artist,
        album: metadata.common.album,
        title: metadata.common.title
      };
    });
  })
  );
}

function loadMetadataforSchedules(schedules) {
  return Promise.all(
    schedules.map(schedule => {
      const playlist = schedule.playlist.split(',');
      return getMetadataForSongs(playlist).then(songs => {
        schedule.playlist = songs;
        return schedule;
      })
    })
  )
}

function loadLibrary() {
  return getFiles(ROOT_AUDIO_PATH).then(files => {
    return files.reduce((acc, file) => {
      file = file.replace(`${resolve(ROOT_AUDIO_PATH)}/`, '');

      const idx = file.indexOf('/');
      if(idx >= 0) {
        const folder = file.substr(0, idx);
        file = file.substr(idx+1);
        if(!acc[folder]) acc[folder] = [];
        acc[folder].push(file);
      } else {
        acc['/'].push(file);
      }

      return acc;
    }, { '/': []});
  });
}

function removeSong(filename) {
  const path = resolve(ROOT_AUDIO_PATH, filename);
  if(!path.startsWith(resolve(ROOT_AUDIO_PATH))) {
    return Promise.reject('Unaccepted path.');
  }

  return removeFile(path)
    .then(() => {
      return true;
    })
    .catch(error => {
      console.log('error:', error);
      return false;
    });
}

function moveFiles(files, folderName) {
  let audioPath = ROOT_AUDIO_PATH;
  if(folderName) {
    //recursively make folder if needed
    audioPath = `${audioPath}${folderName}/`;
    fx.mkdirSync(audioPath);
  }
  console.log(files);

  return Promise.all(files.map(file => {
    const { path, name } = file;
    return new Promise(resolve => {
      fs.copyFile(path, `${audioPath}${name}`, err => {
        if(err) {
          console.log(err);
          throw err;
        } else {
          resolve();
        }
      });
    })
  }));
}

module.exports = {
  loadMetadataforSchedules,
  loadLibrary,
  getMetadataForSong,
  writeMetadataForSong,
  removeSong,
  moveFiles,
};
