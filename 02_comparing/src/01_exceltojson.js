const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
let excelFolder = "../Folder/ExcelFolder/Truth";
let jsonFolder = "";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Press 1 to append '_OCR'");
console.log("Press 2 to append '_Truth'");

rl.question("Enter your choice: ", async (choice) => {
  rl.close();
  if (choice == "1") {
    excelFolder = "../Folder/ExcelFolder/OCR";
    jsonFolder = "../Folder/JsonFolder/OCR";
  }
  if (choice == "2") {
    excelFolder = "../Folder/ExcelFolder/Truth";
    jsonFolder = "../Folder/JsonFolder/Truth";
  }
  const folderFiles = fs.readdirSync(excelFolder);

  for (const folder of folderFiles) {
    const folderPath = path.join(excelFolder, folder);
    const excelFiles = fs.readdirSync(folderPath);
    const appendValue =
      choice === "1" ? "_OCR" : choice === "2" ? "_Truth" : "";

    if (appendValue === "") {
      console.log("Invalid input. Please press 1 or 2.");
      process.exit(1);
    }

    for (const file of excelFiles) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(path.join(excelFolder, folder, file));
      const worksheet = workbook.worksheets[0]; // Get the first sheet

      const headers = [];
      const jsonData = [];

      // Get the headers from the first row
      worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = cell.value;
      });

      // Iterate through all rows (excluding the header row)
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip the header row
        const rowObject = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber];
          const value = cell.value;

          // Skip if header is null or value is null
          if (header && value !== null) {
            rowObject[header] = value;
          }
        });
        // Only push rowObject if it has valid data
        if (Object.keys(rowObject).length > 0) {
          jsonData.push(rowObject);
        }
      });

      const outputFileName = file.replace(".xlsx", `${appendValue}.json`);
      const targetFolderPath = path.join(jsonFolder, folder);
      fs.mkdirSync(targetFolderPath, { recursive: true });
      fs.writeFileSync(
        path.join(targetFolderPath, outputFileName),
        JSON.stringify(jsonData, null, 2)
      );
    }

    console.log(
      "All Excel files converted to JSON successfully in the specified folder."
    );
  }
});
