// Import necessary modules
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
  // Open the zip file located at pathIn
  const zip = await yauzl.open(pathIn);

  try {
    // Create the output directory if it doesn't exist
    await fs.promises.mkdir(pathOut, { recursive: true });

    // Iterate through each entry in the zip file
    for await (const entry of zip) {
      // Check if the entry is a directory
      if (entry.filename.endsWith('/')) {
        // Create the directory in the output path
        await fs.promises.mkdir(`${pathOut}/${entry.filename}`, { recursive: true });
      } else {
        // If the entry is a file, open a read stream and write stream for the file
        const readStream = await entry.openReadStream();
        const writeStream = fs.createWriteStream(`${pathOut}/${entry.filename}`);
        // Pipe the read stream to the write stream
        await pipeline(readStream, writeStream);
      }
    }
  } finally {
    // Close the zip file
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
    // Read the contents of the directory
    const files = await readdir(directoryPath);
    // Filter out only the PNG files
    const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');
    // Create an array of file paths for PNG files
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
  // Create the output directory if it doesn't exist
  fs.promises.mkdir(pathOut, { recursive: true })
    .then(() => fs.promises.readdir(pathIn))
    .then((files) => {
      // Iterate through each file in the input directory
      files.forEach((file) => {
        // Check if the file is a PNG file
        if (file.endsWith('.png')) {
          const filePathIn = `${pathIn}/${file}`;
          const filePathOut = `${pathOut}/${file}`;

          // Read the PNG file, convert it to grayscale, and write it to the output path
          fs.createReadStream(filePathIn)
            .pipe(new PNG({ filterType: 4 }))
            .on("parsed", function () {
              // Convert each pixel to grayscale
              for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                  var idx = (this.width * y + x) << 2;

                  // grayscale color by setting R, G, and B channels to the average value
                  var local_variable = (this.data[idx] + this.data[idx + 1] + this.data[idx + 2]) / 3;
                  this.data[idx] = local_variable;
                  this.data[idx + 1] = local_variable;
                  this.data[idx + 2] = local_variable;
                }
              }
              // Write the processed image to the output path
              this.pack().pipe(fs.createWriteStream(filePathOut));
            })
            .on('error', (err) => console.log(`Error processing file ${filePathIn}: ${err}`));
        }
      });
    })
    .catch(err => console.log(err));
}

// Example usage of the grayscale function
grayscale('B:/Programming/Lab6/starter 6 2/unzipped', 'B:/Programming/Lab6/starter 6 2/output');

// Export the functions for use in other modules
module.exports = {
  unzip,
  readDir,
  grayscale
};
