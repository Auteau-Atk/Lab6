/*
 * Project: Milestone 1
 * File Name: IOhandler.js
 * Description: Collection of functions for files input/output related operations
 *
 * Created Date:
 * Author:
 *
 */

const yauzl = require('yauzl-promise');
const fs = require("fs");
const PNG = require("pngjs").PNG;
const path = require("path");
const { promisify } = require('util');
const { pipeline } = require('stream/promises');


/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */
async function unzip(pathIn, pathOut) {
  const zip = await yauzl.open(pathIn);

  try {
    await fs.promises.mkdir(pathOut, { recursive: true });

    for await (const entry of zip) {
      if (entry.filename.endsWith('/')) {
        await fs.promises.mkdir(`${pathOut}/${entry.filename}`, { recursive: true });
      } else {
        const readStream = await entry.openReadStream();
        const writeStream = fs.createWriteStream(
          `${pathOut}/${entry.filename}`
        );
        await pipeline(readStream, writeStream);
      }
    }
  } finally {
    await zip.close();
  }
}

/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */
const readdir = promisify(fs.readdir);

async function readDir(directoryPath) {
  try {
    const files = await readdir(directoryPath);
    const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');
    const filePaths = pngFiles.map(file => path.join(directoryPath, file));
    return Promise.resolve(filePaths);
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */

function grayscale(pathIn, pathOut) {
  fs.promises.mkdir(pathOut, { recursive: true })
    .then(() => {
      const readStream = fs.createReadStream(pathIn);
      const writeStream = fs.createWriteStream(`${pathOut}/out.png`);

      readStream
        .pipe(new PNG({ filterType: 4 }))
        .on("parsed", function () {
          for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
              var idx = (this.width * y + x) << 2;

              // invert color
              var local_variable = (this.data[idx] + this.data[idx + 1] + this.data[idx + 2]) / 3;
              this.data[idx] = local_variable;
              this.data[idx + 1] = local_variable;
              this.data[idx + 2] = local_variable;
            }
          }
          this.pack().pipe(writeStream);
        })
        .on('error', (err) => console.log(`Error processing file ${pathIn}: ${err}`));
    })
    .catch(err => console.log(err));
}

grayscale('B:/Programming/Lab6/starter 6 2/unzipped/in2.png', 'B:/Programming/Lab6/starter 6 2/output');
module.exports = {
  unzip,
  readDir,
  grayscale
};
