const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Function to process all folders in the specified directory
function processAllFolders(rootFolderPath, outputRootFolderPath) {
    const folders = fs.readdirSync(rootFolderPath).filter(folder => {
        return fs.lstatSync(path.join(rootFolderPath, folder)).isDirectory();
    });

    folders.forEach(folder => {
        const inputFolderPath = path.join(rootFolderPath, folder);
        const outputFolderPath = outputRootFolderPath;

        // Call the script to process the Excel files in this folder
        exec(`node 02_readExcelFiles.js "${inputFolderPath}" "${outputFolderPath}"`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error processing folder ${folder}:`, err);
                return;
            }

            console.log(`Processed folder ${folder}`);
            console.log(stdout);
            if (stderr) console.error(stderr);
        });
    });
}

// Usage
const rootFolderPath = '../Folderfile_Truth/Folderinput_Excel';  // Replace with the root folder containing all folders
const outputRootFolderPath = '../Folderfile_Truth/Folderoutput_Json';  // Replace with the root output folder for JSON files

processAllFolders(rootFolderPath, outputRootFolderPath);
