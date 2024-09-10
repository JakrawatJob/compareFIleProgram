const axios = require("axios");
const fs = require("fs");
const path = require("path");

function convertToBase64(filePath) {
    const data = fs.readFileSync(filePath);
    const base64String = Buffer.from(data).toString("base64");
    return base64String;
}

async function postData(datajson, filename, folderin) {
    if (datajson) {
        const api =
            "http://sony-invoice.api-system.80.kube-nonprod.aws.aigen.local/ocr/v3";
        //"http://sony-invoice.api-system.80.kube-stag.aws.aigen.local/ocr/v2";
        //"http://general-invoice.api-system.80.kube-nonprod.aws.aigen.local/general-invoice/invoice-extraction/v2"
        const headers = {
            "x-aigen-key": "SBya7080cdt6g2nymdhep3k786fijseoa0",
        };
        const data = { image: datajson };

        try {
            const response = await axios.post(api, data);
            const jsonData1 = JSON.stringify(response.data, null, 2);
            fs.writeFileSync(
                `../02-ocr-output/14_allfile_fixed_v1/${folderin}/${filename}.json`,
                jsonData1
            );

            console.log(`Success: ${filename} processed.`);
        } catch (error) {
            console.error(
                "Error:",
                error.response ? error.response.data : error.message
            );
            throw error;  // Re-throw the error to be caught in the processFiles function
        }
    } else {
        console.error("Invalid JSON data or missing 'data' property.");
        throw new Error("Invalid JSON data or missing 'data' property.");
    }
}

async function processFiles() {
    const folder = "../01-document/01_phase2";
    let folderin = fs.readdirSync(folder);
    const errorFiles = [];  // Array to store error information

    for (let i = 0; i < folderin.length; i += 1) {
        console.log(folderin[i], i);

        if (folderin[i] != "05.CHIYODA" &&
            folderin[i] != "07.ENT (THAILAND)" &&
            folderin[i] != "16.IWATA BOLT" &&
            folderin[i] != "24.MAE MAE" &&
            folderin[i] != "26.MEKTEC" &&
            folderin[i] != "28.NISSHO PRECISION" &&
            folderin[i] != "38.SENMON" &&
            folderin[i] != "52.TDK (Thailand)" &&
            folderin[i] != "62.YAMAKOH" &&
            folderin[i] != "63.VEL SUEDE") {
            continue;
        }
        const outputDirPath = path.join(
            "../02-ocr-output/14_allfile_fixed_v1/",
            folderin[i]
        );
        if (!fs.existsSync(outputDirPath)) {
            fs.mkdirSync(outputDirPath, { recursive: true });
        }

        const firstFilePath = path.join(folder, folderin[i]);
        let files = fs.readdirSync(firstFilePath);
        files.sort((a, b) => {
            const regex = /(\d+)/;
            const matchA = a.match(regex);
            const matchB = b.match(regex);

            if (matchA && matchB) {
                const numA = parseInt(matchA[0]);
                const numB = parseInt(matchB[0]);
                return numA - numB;
            } else {
                return a.localeCompare(b);
            }
        });

        if (files.length === 0) {
            console.log("No files found in the directory.");
        } else {
            let promises = [];

            // Iterate over files in batches of 3
            for (let j = 0; j < files.length; j += 1) {
                const filePath = path.join(folder, folderin[i], files[j]);
                const base64String = convertToBase64(filePath);
                let filename = files[j].replace(".pdf", "");
                console.log(`Processing file: ${filename}`);
                promises.push(postData(base64String, filename, folderin[i]).catch((error) => {
                    errorFiles.push({ file: filename, error: error.message });
                }));

                // If we have 3 promises or reached the end, wait for them to complete
                if (promises.length === 5 || j === files.length - 1) {
                    await Promise.all(promises);
                    promises = [];
                }
            }

            console.log(`All files in ${folderin[i]} have been processed.`);
        }
    }

    // Display all errors at the end
    if (errorFiles.length > 0) {
        console.log("Errors occurred during processing:");
        errorFiles.forEach((errorFile) => {
            console.log(`File: ${errorFile.file}, Error: ${errorFile.error}`);
        });
    }
}

// Call the async function to start processing files
processFiles().catch((error) => {
    console.error("Error processing files:", error);
});
