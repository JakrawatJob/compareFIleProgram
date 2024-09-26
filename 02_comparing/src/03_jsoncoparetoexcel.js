const ExcelJS = require("exceljs");
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Please enter the folder name: ", (folderName) => {
  const folderPath = `../Folder/JsonFolder/OCR`;
  const folderPath2 = `../Folder/JsonFolder/Truth`;
  const folderFiles = fs.readdirSync(folderPath);
  //console.log(folderFiles);
  folderFiles.forEach((folder) => {
    const pathJoin1 = path.join(folderPath, folder);
    const pathJoin2 = path.join(folderPath2, folder);
    //console.log("folder", folder);
    const arrfiles = fs
      .readdirSync(pathJoin1)
      .map((file) => `${folderPath}/${folder}/${file}`);
    const arrfiles2 = fs
      .readdirSync(pathJoin2)
      .map((file) => `${folderPath2}/${folder}/${file}`);
    //console.log("folderPath, folder", arrfiles, arrfiles2);
    function readJSONFile(filePath) {
      //console.log("filepath", filePath);
      if (!filePath) {
        console.error("Error: File path is undefined.");
        return null;
      }
      try {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
      } catch (error) {
        console.error("Error reading JSON file:", error);
        return null;
      }
    }
    function modifyData(filename, data, i) {
      if (!data) {
        process.exit(1);
      }
      //console.log(data[0].invoice_no);
      if (data[0].invoice_no) {
        return data.map((item) => ({
          invoice_no: item.invoice_no?.value || null,
          item_no: item.item_no?.value || null,
          po_number: item.po_number?.value || null,
          amount: item.amount?.value || null,
          unit_price: item.unit_price?.value || null,
          QTY: item.QTY?.value || null,
          avgconfidence: item.avgconfidence?.value || null,
          filename: filename,
        }));
      } else {
        //console.log(data);
        return data.map((item) => ({
          invoice_no: item.INVOICE_NO || null,
          item_no: item.ITEM_NO || null,
          po_number: item.PO_NO || null,
          amount: item.AMOUNT || null,
          unit_price: item.UNIT_PRICE || null,
          QTY: item.QTY || null,
          filename: item.filename || null,
        }));
      }
    }
    function getFilenameWithoutExtension(filePath) {
      //console.log("filePathfilePath", filePath);
      if (filePath) {
        const parts = filePath.split("/");
        let filename = parts[parts.length - 1];
        if (/\.json$/.test(filename)) {
          return filename.replace(/\.json$/, "");
        }
        return filename;
      }
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const columnHeaders = [
      { header: "INVOICE_NO_Truth", key: "invoice_no_truth", width: 20 },
      { header: "INVOICE_NO", key: "invoice_no", width: 20 },

      { header: "PO_NO_Truth", key: "po_number_truth", width: 15 },
      { header: "PO_NO", key: "po_number", width: 15 },

      { header: "ITEM_NO_Truth", key: "item_no_truth", width: 15 },
      { header: "ITEM_NO", key: "item_no", width: 15 },

      { header: "QTY_Truth", key: "QTY_truth", width: 15 },
      { header: "QTY", key: "QTY", width: 15 },

      { header: "UNIT_PRICE_Truth", key: "unit_price_truth", width: 15 },
      { header: "UNIT_PRICE", key: "unit_price", width: 15 },

      { header: "AMOUNT_Truth", key: "amount_truth", width: 15 },
      { header: "AMOUNT", key: "amount", width: 15 },

      { header: "% Confidence", key: "avgconfidence", width: 15 },
      { header: "filename_Truth", key: "filename_truth", width: 15 },
      { header: "filename", key: "filename", width: 15 },
      //{ header: "location", key: "location", width: 15 },
    ];

    worksheet.columns = columnHeaders.map((column) => ({
      ...column,
      style: { font: { bold: false } },
    }));
    //Function for find similary word
    // 1. Helper Function: Extract Filename Without Extension
    function getTrigrams(str) {
      const trigrams = {};
      for (let i = 0; i < str.length - 2; i++) {
        const trigram = str.substring(i, i + 3).toLowerCase();
        trigrams[trigram] = (trigrams[trigram] || 0) + 1;
      }
      return trigrams;
    }

    function cosineSimilarity(a, b) {
      const trigramsA = getTrigrams(a);
      const trigramsB = getTrigrams(b);

      const intersection = Object.keys(trigramsA).filter(trigram => trigramsB[trigram]);

      let dotProduct = 0;
      intersection.forEach(trigram => {
        dotProduct += trigramsA[trigram] * trigramsB[trigram];
      });

      const magnitudeA = Math.sqrt(Object.values(trigramsA).reduce((sum, val) => sum + val * val, 0));
      const magnitudeB = Math.sqrt(Object.values(trigramsB).reduce((sum, val) => sum + val * val, 0));

      return dotProduct / (magnitudeA * magnitudeB);
    }

    function findMostSimilarCosine(target, candidates) {
      let maxSimilarity = -1;
      let mostSimilar = "";

      candidates.forEach(candidate => {
        const similarity = cosineSimilarity(target, candidate);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          mostSimilar = candidate;
        }
      });

      return mostSimilar;
    }
    //
    //console.log(arrfiles);
    let notfound = 0;
    for (let i = 0; i < arrfiles.length; i += 1) {
      //console.log(arrfiles[i], arrfiles2[i]);
      const filename = getFilenameWithoutExtension(arrfiles[i]);
      let isPresent = true;
      let fileTruth = "";
      let mostSimilar = "";
      mostSimilar = findMostSimilarCosine(arrfiles[i], arrfiles2);
      const data = readJSONFile(arrfiles[i]);
      if (data.length == 0) {
        continue;
      }
      const modifiedData = modifyData(filename, data, i);
      const filename2 = getFilenameWithoutExtension(mostSimilar);
      let data_truth = readJSONFile(mostSimilar);


      let modifiedData2;
      if (!isPresent) {
        data_truth = data;
        modifiedData2 = data_truth.map((item, index) => ({
          invoice_no_truth: "Can't found Truth",
          item_no_truth: null,
          po_number_truth: null,
          amount_truth: null,
          unit_price_truth: null,
          QTY_truth: null,
          invoice_no: modifiedData[index]?.invoice_no || null,
          item_no: modifiedData[index]?.item_no || null,
          po_number: modifiedData[index]?.po_number || null,
          amount: modifiedData[index]?.amount || null,
          unit_price: modifiedData[index]?.unit_price || null,
          QTY: modifiedData[index]?.QTY || null,
          avgconfidence: item.avgconfidence?.value || null, // Assuming avgconfidence is structured similarly in all cases
          filename_truth: "Can't found Truth",
          filename: filename,
        }));
      } else {
        modifiedData2 = data_truth.map((item, index) => ({
          invoice_no_truth:
            item.invoice_no?.value ||
            item.INVOICE_NO ||
            item.INVOICE_NO_Truth ||
            null,
          item_no_truth:
            item.item_no?.value || item.ITEM_NO || item.ITEM_NO_Truth || null,
          po_number_truth:
            item.po_number?.value || item.PO_NO || item.PO_NO_Truth || null,
          amount_truth:
            item.amount?.value || item.AMOUNT || item.AMOUNT_Truth || null,
          unit_price_truth:
            item.unit_price?.value ||
            item.UNIT_PRICE ||
            item.UNIT_PRICE_Truth ||
            null,
          QTY_truth: item.QTY?.value || item.QTY || item.QTY_Truth || null,
          invoice_no: modifiedData[index]?.invoice_no || null,
          item_no: modifiedData[index]?.item_no || null,
          po_number: modifiedData[index]?.po_number || null,
          amount: modifiedData[index]?.amount || null,
          unit_price: modifiedData[index]?.unit_price || null,
          QTY: modifiedData[index]?.QTY || null,
          avgconfidence: item.avgconfidence?.value || null, // Assuming avgconfidence is structured similarly in all cases
          filename_truth: filename2,
          filename: filename,
        }));
      }

      //console.log("part1", modifiedData);
      //console.log("part2", modifiedData2);

      worksheet.addRows(modifiedData2);
    }

    // List of column pairs to compare
    const columnPairs = [
      ["A", "B"],
      ["C", "D"],
      ["E", "F"],
      ["G", "H"],
      ["I", "J"],
      ["K", "L"],
    ];
    const sumaryError = { B: 0, D: 0, F: 0, H: 0, J: 0, L: 0 };
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber > 1) {
        columnPairs.forEach((pair) => {
          const [column1, column2] = pair;

          const cell1 = row.getCell(column1);
          const cell2 = row.getCell(column2);
          //console.log("part2", column2);
          //sumaryError[column2] += cell1.value !== cell2.value ? 1 : 0;
          let cellValue1 = cell1.value;
          let cellValue2 = cell2.value;
          if (cellValue1) {
            if (column1 == "G" || column1 == "I" || column1 == "K") {
              cellValue1 = parseFloat(cell1);
            } else {
              let cellValue1AsString = String(cellValue1);
              cellValue1 = cellValue1AsString.replace(/ /g, "");
            }
          }

          if (cellValue1 !== cellValue2) {
            cell2.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFF00" }, // Yellow color
            };
            sumaryError[column2] += 1;
            //console.log("part2", column2, sumaryError);
          }
        });
      }
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
      cell.alignment = { horizontal: "center" };
    });

    const lastRowNumber = worksheet.rowCount;
    const allitem = lastRowNumber - 1;
    //console.log("แถวสุดท้าย:", lastRowNumber);

    const summaryErrorValues = Object.values(sumaryError);
    const totalSum = Object.values(sumaryError).reduce(
      (acc, value) => acc + value,
      0
    );
    const combinedValues = summaryErrorValues.flatMap((value) => ["", value]);
    combinedValues.push("Total all errors", totalSum, "from", allitem * 6);
    //console.log(combinedValues);
    worksheet.addRow(combinedValues);
    const combinedValuesPercent = summaryErrorValues.flatMap((value) => [
      "",
      100 - (value / allitem) * 100,
    ]);
    let precentCorrect = 100 - (totalSum / (allitem * 6)) * 100;
    precentCorrect = parseInt(precentCorrect);
    combinedValuesPercent.push(
      "Total Result percentage",
      100 - (totalSum / (allitem * 6)) * 100
    );
    combinedValuesPercent.push(
      "number of file compare",
      arrfiles2.length
    );
    worksheet.addRow(combinedValuesPercent);
    const targetFolderPath = path.join("../Folder/Output/", folderName);
    fs.mkdirSync(targetFolderPath, { recursive: true });
    const existingFilePath = `../Folder/Output/${folderName}/${folder
      .split("/")
      .pop()}_${precentCorrect}_Compare.xlsx`;
    workbook.xlsx.writeFile(existingFilePath).then(() => {
      console.log("ไฟล์ Excel ถูกสร้างและบันทึกแล้ว");
    });
    rl.close();
  });
});
