const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Define input and output directories
const directoryPathFolder = path.join(__dirname, "../02-ocr-output/14_allfile_fixed_v1");
const outputPath = path.join(__dirname, "../03-formated-output");

// Function to process each file
function processFile(file, folderName) {
    return new Promise((resolve, reject) => {
        const command = `node 03_format_json.js "${file}" "${folderName}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution error: ${error}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`Standard error: ${stderr}`);
                reject(new Error(stderr));
                return;
            }
            resolve(stdout);
        });
    });
}

// Function to read and process files in a folder
async function readAndProcessFiles(folderName) {
    try {
        const newFolderPath = path.join(directoryPathFolder, folderName);
        const files = fs.readdirSync(newFolderPath);
        const newOutputPath = path.join(outputPath, folderName);

        // Create the output folder if it doesn't exist
        if (!fs.existsSync(newOutputPath)) {
            fs.mkdirSync(newOutputPath);
        }

        // Process each file in the folder
        for (const file of files) {
            await processFile(file, folderName);
            //console.log(`${filePath} processed`);
        }
    } catch (err) {
        console.error("An error occurred:", err);
    }
}

// Start processing each subfolder in the directory
const folders = fs.readdirSync(directoryPathFolder);
folders.forEach(folderName => {
    readAndProcessFiles(folderName);
});
