const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const [, , folderName] = process.argv;
const folderPath = path.join("../03-formated-output", folderName);
const outputFolderPath = path.join("../04-excel-output", folderName);

// Create the output folder if it doesn't exist
if (!fs.existsSync(outputFolderPath)) {
    fs.mkdirSync(outputFolderPath, { recursive: true });
}

function readJSONFile(filePath) {
    try {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading JSON file:", error);
        return null;
    }
}

// Process each JSON file in the folder
fs.readdirSync(folderPath).forEach((file) => {
    if (path.extname(file) === ".json") {
        const filePath = path.join(folderPath, file);
        const data = readJSONFile(filePath);
        if (!data) {
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");

        const columnHeaders = [
            { header: "INVOICE_NO", key: "invoice_no", width: 20 },
            { header: "PO_NO", key: "po_number", width: 15 },
            { header: "ITEM_NO", key: "item_no", width: 15 },
            { header: "QTY", key: "QTY", width: 15 },
            { header: "UNIT_PRICE", key: "unit_price", width: 15 },
            { header: "AMOUNT", key: "amount", width: 15 },
            { header: "% Confidence", key: "avgconfidence", width: 15 },
            { header: "filename", key: "filename", width: 15 },
        ];

        worksheet.columns = columnHeaders.map((column) => ({
            ...column,
            style: { font: { bold: false } },
        }));

        const modifiedData = data.map((item) => ({
            invoice_no: item.invoice_no?.value || null,
            item_no: item.item_no?.value || null,
            po_number: item.po_number?.value || null,
            amount: item.amount?.value || null,
            unit_price: item.unit_price?.value || null,
            QTY: item.QTY?.value || null,
            avgconfidence: item.avgconfidence?.value || null,
            filename: item.filename?.value || null,
        }));

        worksheet.addRows(modifiedData);

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, size: 12 };
            cell.alignment = { horizontal: "center" };
        });

        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber > 1) {
                const additionalColumns = [
                    "invoice_no",
                    "po_number",
                    "item_no",
                    "QTY",
                    "unit_price",
                    "amount",
                    "avgconfidence",
                ];
                additionalColumns.forEach((columnName) => {
                    const cell = row.getCell(columnName);
                    const cellValue = cell.value;
                    const cell2 = data[rowNumber - 2][columnName];
                    const cellConfidence = cell2?.confidence || null;
                    let colorfill = "";
                    if (cellConfidence < 0.1 || cellConfidence === undefined) {
                        colorfill = "FF0000";
                    } else if (cellConfidence < 0.8) {
                        colorfill = "FFA500";
                    } else if (cellConfidence < 0.85) {
                        colorfill = "FFFF00";
                    }
                    if (cellConfidence < 0.85 || cellConfidence === undefined) {
                        cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: colorfill },
                        };
                    }
                    cell.value = cellValue;
                });
            }
        });

        const existingFilePath = path.join(
            outputFolderPath,
            `${path.basename(file, ".json")}.xlsx`
        );

        workbook.xlsx.writeFile(existingFilePath).then(() => {
            console.log(`ไฟล์ Excel ถูกสร้างและบันทึกแล้วที่: ${existingFilePath}`);
        });
    }
});
