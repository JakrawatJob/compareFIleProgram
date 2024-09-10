const fs = require('fs');
const path = require('path');

// Define the input folder and output file
const inputFolder = path.join(__dirname, '../Folderfile_Truth/Folderoutput_Json');
const outputFile = path.join(__dirname, '../Folderfile_Truth/FolderallOnejson/allfile.json');

// Initialize an empty array to hold the combined JSON data
let allData = [];

// Read the input folder
fs.readdir(inputFolder, (err, files) => {
    if (err) {
        console.error('Error reading the directory:', err);
        return;
    }

    // Loop through each file in the folder
    files.forEach(file => {
        const filePath = path.join(inputFolder, file);

        // Check if the file has a .json extension
        if (path.extname(file) === '.json') {
            const fileData = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(fileData);

            // Append the JSON data to the allData array
            allData = allData.concat(jsonData);
        }
    });

    // Write the combined JSON data to the output file
    fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2), 'utf8');
    console.log(`Combined JSON file created at: ${outputFile}`);
});
