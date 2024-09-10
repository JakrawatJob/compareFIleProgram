const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function readExcelFiles(folderPath, outputFolderPath) {
    const files = fs.readdirSync(folderPath);
    const excelFiles = files.filter(file => path.extname(file) === '.xlsx');
    const finalJsonData = [];

    for (const file of excelFiles) {
        const filePath = path.join(folderPath, file);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        workbook.eachSheet((worksheet) => {
            const sheetData = [];
            let invoiceTag = '';

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) {
                    return; // Skip header row
                }

                const rowData = {
                    "INVOICE_NO": row.getCell(1).text,
                    "PO_NO": row.getCell(2).text,
                    "ITEM_NO": row.getCell(3).text,
                    "QTY": row.getCell(4).text,
                    "UNIT_PRICE": row.getCell(5).text,
                    "AMOUNT": row.getCell(6).text
                };

                if (rowData['INVOICE_NO']) {
                    invoiceTag = rowData['INVOICE_NO'];
                }

                sheetData.push(rowData);
            });

            finalJsonData.push({
                fileName: file,
                INVOICE_tag: invoiceTag,
                data: sheetData
            });
        });
    }

    // Extract the folder name to use as the JSON file name
    const folderName = path.basename(folderPath);
    console.log("folderName =", folderName);

    // Set the output path to outputRootFolderPath and use the folder name as the JSON file name
    const outputFilePath = path.join(outputFolderPath, `${folderName}.json`);

    // Ensure the output directory exists
    if (!fs.existsSync(outputFolderPath)) {
        fs.mkdirSync(outputFolderPath, { recursive: true });
    }

    // Write final data to output JSON file
    fs.writeFileSync(outputFilePath, JSON.stringify(finalJsonData, null, 2));
    console.log(`All data has been written to ${outputFilePath}`);
}

// Usage
const inputFolderPath = process.argv[2];  // Get input folder path from command line arguments
const outputFolderPath = process.argv[3];  // Get output folder path from command line arguments

if (inputFolderPath && outputFolderPath) {
    readExcelFiles(inputFolderPath, outputFolderPath)
        .then(() => {
            console.log('All files have been processed and data appended to the output file.');
        })
        .catch(err => {
            console.error('Error processing Excel files:', err);
        });
} else {
    console.error('Please provide the input folder path and output folder path as arguments.');
}
