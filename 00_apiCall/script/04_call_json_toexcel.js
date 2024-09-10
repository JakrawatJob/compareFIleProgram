const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const directoryPath = "../03-formated-output";

function processFile(folder) {
    return new Promise((resolve, reject) => {
        const folderPath = path.join(directoryPath, folder);

        const command = `node 05_json_toexcel.js "${folder}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                reject(new Error(stderr));
                return;
            }
            console.log(`stdout: ${stdout}`);
            resolve(stdout);
        });
    });
}

async function readAndProcessFiles() {
    try {
        const folders = fs.readdirSync(directoryPath);

        for (const folder of folders) {
            console.log(`Processing ${folder}`);
            await processFile(folder); // Wait for the processing to complete
            console.log(`${folder} processed`);
        }
    } catch (err) {
        console.error("An error occurred:", err);
    }
}

// Start the process
readAndProcessFiles();
