const fs = require("fs");
const path = require("path");

// Read the file path and folder name from command line arguments
const [, , fileName, folderName] = process.argv;

console.log(`Processing file: ${fileName}`);
console.log(`Target folder: ${folderName}`);

const filePath = `../02-ocr-output/14_allfile_fixed_v1/${folderName}/${fileName}`;
//const filePath = `../02-ocr-output/accident/test1/20240715/20240709105329`;
console.log("filePath", filePath);


function readJSONFile(filePath) {
    try {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading JSON file:", error);
        return null;
    }
}
const jsonData = readJSONFile(filePath);

const structure = {
    amount: { data: {}, key: "AMOUNT" },
    unit_price: { data: {}, key: "UNIT_PRICE" },
    QTY: { data: {}, key: "QUANTITY" },
    po_number: { data: {}, key: "PO_NUMBER" },
    item_no: { data: {}, key: "ITEM_NOUMBER" },
};
let line_array_compare = {};
let line_array_use = {};
const item_data_object = [];

//const numKeys = Object.keys(jsonData).length;

line_array_compare = {};
line_array_use = {};
let jsonKey = fileName;
if (jsonKey != "01 SHANGHAI SUOGUANG VISUAL") {
    //continue;
}
let jsonObject = jsonData.data[0];
let jsonKeyObject = { value: jsonKey, confidence: 1 };

if (jsonObject.invoice_id) {
    invoiceData = {
        value: jsonObject.invoice_id.value,
        confidence: jsonObject.invoice_id.confidence,
    };
} else {
    invoiceData = {
        value: "",
        confidence: 0,
    };
}

poData = {};
if (jsonObject.po_number) {
    poData = {
        value: jsonObject.po_number.value,
        confidence: jsonObject.po_number.confidence,
    };
}
//console.log(invoiceData, jsonKeyObject);
let table_data = jsonObject.table_data;
let amountcount = 0;
let tableLength = 0;
if (table_data) {
    tableLength = table_data.length;
}
for (let i = 0; i < tableLength; i += 1) {
    let tableObject = structure;
    let foundItem = table_data[i].find((item) => /TOTAL/.test(item.value));
    if (foundItem) {
        break; //break if find string total
    }
    for (let j in tableObject) {
        let Object_table = tableObject[j];
        //console.log(Object_table);
        Object_table.data = table_data[i].find(
            (item) => item.predict_class === Object_table.key
        );
        if (Object_table.data) {
            let { value, confidence } = Object_table.data;
            Object_table.data = { value, confidence };
            line_array_compare[j] = Object_table.data;
        } else {
            const havedata = finddataincolumn(Object_table, table_data[i]);
            if (havedata) {
                line_array_compare[j] = havedata;
            }
        }
    }
    let savedatatonextitem = false;
    //console.log("-------------data", line_array_compare);
    if (Object.keys(line_array_compare).length !== 0) {
        //console.log(line_array_compare);
        if (
            line_array_compare.amount &&
            (line_array_compare.unit_price || line_array_compare.QTY)
        ) {
            //console.log(line_array_compare);
            if (Object.keys(line_array_use).length > 2) {
                //console.log(item_data_object);
                datapush(item_data_object, line_array_use, jsonKey, invoiceData);
                line_array_use = {};
                for (let n in line_array_compare) {
                    line_array_use[n] = line_array_compare[n];
                }
            } else {
                for (let n in line_array_compare) {
                    line_array_use[n] = line_array_compare[n];
                }
            }
        } else {
            //console.log("===============================")
            //console.log(line_array_compare);
            //console.log("---------------------------")
            for (let n in line_array_compare) {
                //console.log("n", n, line_array_compare[n])
                if (n == "item_no" || n == "QTY") {
                    if (line_array_use[n]) {
                        savedatatonextitem = true;
                    } else {
                        line_array_use[n] = line_array_compare[n];
                    }
                } else if (n == "po_number") {
                    if (line_array_use[n]) {
                        savedatatonextitem = true;
                    } else {
                        line_array_use[n] = line_array_compare[n];
                    }
                } else if (line_array_compare.unit_price && line_array_compare.QTY) {
                    line_array_use[n] = line_array_compare[n];
                } else if (n == "amount") {
                    line_array_use[n] = line_array_compare[n];
                }
            }
            //console.log(line_array_use);
        }
    }

    //line_array_object.push(line_array_compare);
    if (!savedatatonextitem) {
        line_array_compare = {};
    }
}
if (Object.keys(line_array_use).length > 2) {
    //console.log(item_data_object)
    datapush(item_data_object, line_array_use, jsonKey, invoiceData);
}
line_array_use = {};
//console.log(item_data_object);

function datapush(arrayAns, arrayuse, jsonKey, invoiceData) {
    const anspush = arrayuse;
    //console.log("testanspush", anspush)
    makestringtofloat(anspush);
    postprocessitemno(anspush.item_no);
    //console.log(anspush);
    let sumConfidence = 0;
    anspush.invoice_no = invoiceData;
    invoiceedit(anspush.invoice_no, "invoice");
    for (let i in anspush) {
        if (anspush[i].confidence != undefined) {
            sumConfidence += anspush[i].confidence;
        }
        //console.log(sumConfidence, anspush[i]);
    }
    if (poData.confidence > 0) {
        anspush.po_number = poData;
    }
    invoiceedit(anspush.po_number, "po");
    anspush.avgconfidence = {
        value: sumConfidence / 6,
        confidence: sumConfidence / 6,
    };
    anspush.filename = {
        value: jsonKey,
        confidence: 1,
    };
    //console.log("+++++++++++++++++++++++", anspush, anspush.invoice_no);
    reduceconfidence(anspush.item_no, "item");
    arrayAns.push(anspush);
}
function finddataincolumn(Object_table, data) {
    if (Object_table.key == "AMOUNT") {
        Object_table.data = data.find((item) => item.column === "table_amount");
    }
    if (Object_table.key == "UNIT_PRICE") {
        Object_table.data = data.find(
            (item) => item.column === "table_price_per_unit"
        );
    }
    if (Object_table.key == "QUANTITY") {
        Object_table.data = data.find((item) => item.column === "table_quantity");
        //console.log(Object_table.data);
    }
    return checkobjectOtherclass(Object_table, Object_table.key);
}
function checkobjectOtherclass(Object_table, type) {
    if (Object_table.data && Object_table.data.predict_class == "O") {
        let { value, confidence } = Object_table.data;
        Object_table.data = { value, confidence };
        const checktype = checktypeofdata(Object_table.data.value, type); // check type is number
        //console.log(Object_table.data.value, checktype);
        if (checktype) {
            return Object_table.data;
        }
    }
}

function checktypeofdata(str, type) {
    var str2 = str.replace(/\s/g, "");
    var pattern = /^[0-9,.]+$/;
    if (type == "AMOUNT") {
        pattern = /^[0-9,.]+$/;
    }
    if (type == "UNIT_PRICE") {
        pattern = /^[0-9]+\.[0-9]+/;
        //console.log("UNIT_PRICE", str, pattern.test(str2));
    }
    if (type == "QUANTITY") {
        //console.log("str2", str2);
        pattern = /^[0-9,]+( [A-Za-z]+)?$/;
        return pattern.test(str);
    }
    return pattern.test(str2);
}
function makestringtofloat(object_data) {
    var dataqty = object_data.QTY;
    var dataunit_price = object_data.unit_price;
    var dataamount = object_data.amount;
    //console.log(dataunit_price);
    if (dataqty) {
        var data = dataqty.value;
        let arratstring = [];
        for (let i = 0; i < data.length; i += 1) {
            if (data[i] == ".") {
                if (parseInt(data[i + 1]) >= 1 && parseInt(data[i + 1]) <= 9) {
                    continue;
                } else {
                    break;
                }
            }
            if (data[i] != ",") {
                arratstring.push(data[i]);
            }
        }
        let result = arratstring.join("");
        dataqty = parseInt(result);
        object_data.QTY.value = dataqty;
    }
    if (dataunit_price) {
        var data = dataunit_price.value;
        let arratstring = [];
        let result = data;
        if (data[0] == "0") {
            if (data[1] != ".") {
                for (let i = 0; i < data.length; i += 1) {
                    arratstring.push(data[i]);
                    if (i == 0) {
                        arratstring.push(".");
                    }
                }
                result = arratstring.join("");
            }
        }

        dataunit_price = parseFloat(result);
        object_data.unit_price.value = dataunit_price;
    }
    if (dataamount) {
        var data = dataamount.value;
        if (typeof data === 'string') {
            console.log(dataamount, " dataamount.value", data);

            if (data.includes(",")) {
                data = data.replace(",", "");
            }
        }
        dataamount = parseFloat(data);
        let sumdata = parseFloat(dataqty) * parseFloat(dataunit_price);
        if (Number((sumdata + 0.00001).toFixed(2)) != dataamount) {
            object_data.amount.confidence = 0.6;
            //console.log("++++++++++++++++");
        }
        //console.log(Number((sumdata + 0.00001).toFixed(2)), dataamount);
        object_data.amount.value = dataamount;
    }
    //console.log("++++++++++++++++++", dataqty, dataunit_price, dataamount);
}
function postprocessitemno(item_no) {
    if (item_no) {
        var data = item_no.value;
        let result = data.replace(/[^XT0-9]/g, "");
        //console.log(result);
        item_no.value = result;
        if (result == "") {
            //console.log(item_no.confidence, "item_no.confidence");
            item_no.confidence = 0;
        }
    }
}
function invoiceedit(invoice_Object, type) {
    //console.log(invoice_Object, type, "================");
    if (invoice_Object) {
        var data = invoice_Object.value;
        if (data) {
            let splitted = data.split(/[ .:]+/);
            let maxNumString = "";
            let maxNumCount = 0;

            for (let str of splitted) {
                let numCount = (str.match(/\d/g) || []).length;
                if (numCount > maxNumCount) {
                    maxNumCount = numCount;
                    maxNumString = str;
                }
            }
            if (type == "po") {
                maxNumString = maxNumString.replace(/\]|\-/g, "");
            }
            invoice_Object.value = maxNumString;
        }
        reduceconfidence(invoice_Object, type);
    }
}
function reduceconfidence(data, type) {
    if (data) {
        if (data.value == "") {
            data.confidence = 0;
        } else {
            if (type == "po") {
                if (data.value.length != 10) {
                    data.confidence = 0.84;
                }
            }
            if (type == "item") {
                if (data.value.length != 9) {
                    data.confidence = 0.84;
                }
            }
        }
    }
}
//console.log(item_data_object);
const jsonData1 = JSON.stringify(item_data_object, null, 2);
//console.log(jsonData1);


fs.writeFileSync(`../03-formated-output/${folderName}/${fileName}`, jsonData1);
