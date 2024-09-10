const fs = require("fs");
const path = require("path");

const sourceFolder = path.join(__dirname, "../Folder/ExcelFolder/OCR");
const logFolder = path.join(__dirname, "../Log");

// Function to get the next folder number
function getNextOCRResultNumber() {
    const logDirs = fs.readdirSync(logFolder);
    const ocrFolders = logDirs.filter((folder) =>
        folder.startsWith("OCR_Result")
    );
    const numbers = ocrFolders.map((folder) =>
        parseInt(folder.replace("OCR_Result", ""))
    );
    const maxNumber = Math.max(0, ...numbers); // Get the highest number, default to 0 if none exist
    return maxNumber + 1;
}

// Get the next folder number and create a new folder
const nextNumber = getNextOCRResultNumber();
const destinationFolder = path.join(logFolder, `OCR_Result${nextNumber}`);
fs.mkdirSync(destinationFolder, { recursive: true });

// Move all files from the source folder to the destination folder
const files = fs.readdirSync(sourceFolder);

files.forEach((file) => {
    const sourcePath = path.join(sourceFolder, file);
    const destinationPath = path.join(destinationFolder, file);
    const stats = fs.statSync(sourcePath);

    if (stats.isFile()) {
        fs.renameSync(sourcePath, destinationPath);
        console.log(`File ${file} has been moved to ${destinationPath}.`);
    } else if (stats.isDirectory()) {
        fs.renameSync(sourcePath, destinationPath);
        console.log(`Directory ${file} has been moved to ${destinationPath}.`);
    }
});

console.log(
    `All files from ${sourceFolder} have been moved to ${destinationFolder}.`
);
