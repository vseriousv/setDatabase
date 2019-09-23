"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var signature_generator_1 = require("@acryl/signature-generator");
var ts_lib_crypto_1 = require("@acryl/ts-lib-crypto");
var where = require("lodash.where");
var axios = require('axios');
var AWS = require("aws-sdk");
AWS.config.update({ region: 'eu-central-1' });
var dynamoDb = new AWS.DynamoDB.DocumentClient();
// Enter ADDRESS and privateKey for check transactions type of Aset Transfer
var ADDRESS = process.env.ADDRESS;
var privateKey = process.env.privateKey;
//Get list transactions with typy of Asset Transfer (type == 4)
var getListAssetTransfer = function (address) { return __awaiter(void 0, void 0, void 0, function () {
    var URL, res, filtered;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                URL = "https://nodestestnet.acrylplatform.com/transactions/address/" + address + "/limit/100";
                return [4 /*yield*/, axios(URL)];
            case 1:
                res = _a.sent();
                filtered = where(res.data[0], { "type": 4 });
                return [2 /*return*/, filtered];
        }
    });
}); };
//Get array with objects from database
var getDataDynamoDB = new Promise(function (resolve, reject) {
    dynamoDb.scan({ TableName: "client" }).promise()
        .then(function (data) { return resolve(data.Items); });
});
//search every value ID from array of blockchain to array of database, method brute force
var diff = function (arr1, arr2) {
    arr2.map(function (x) {
        arr1 = arr1.filter(function (item1) {
            return item1.id != x.TxAssetID;
        });
    });
    return arr1;
};
//Record array with objects to database
var setDataDynamoDB = function (clients, listTxAssetID) {
    return clients.map(function (customer, index) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                        var params = {
                            TableName: 'client',
                            Item: {
                                "address": customer.address ? customer.address : 'no value',
                                "countMiners": customer.countMiners ? customer.countMiners : '',
                                "country": customer.country ? customer.country : '',
                                "countryState": customer.state ? customer.state : '',
                                "customName": customer.name ? customer.name : '',
                                "email": customer.email ? customer.email : '',
                                "phone": customer.phone ? customer.phone : '',
                                "postCode": customer.postCode ? customer.postCode : 'no value',
                                "sity": customer.sity ? customer.sity : '',
                                "TxAssetID": listTxAssetID[index]
                            }
                        };
                        dynamoDb.put(params, function (error, data) {
                            if (error) {
                                console.log("createChatMessage ERROR=" + error.stack);
                                resolve({
                                    statusCode: 400,
                                    error: "Could not create message: " + error.stack
                                });
                            }
                            else {
                                resolve({ statusCode: 200, body: JSON.stringify(params.Item) });
                            }
                        });
                    })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); });
};
var getTransportKey = function (senderPublicKey, privateKey) {
    var privateKeyDecode = signature_generator_1.libs.base58.decode(privateKey);
    var sellerPublicKeyDecode = signature_generator_1.libs.base58.decode(senderPublicKey);
    var sharedKey = signature_generator_1.libs.axlsign.sharedKey(privateKeyDecode, sellerPublicKeyDecode);
    var encSharedKey = signature_generator_1.libs.base58.encode(sharedKey);
    return encSharedKey;
};
var getAddressFromAttachment = function (item) {
    var decryptAttachment = signature_generator_1.libs.base58.decode(item);
    return ts_lib_crypto_1.bytesToString(decryptAttachment);
};
var dataDecrypt = function (dataRes) {
    var encryptedMessage = dataRes.data[0].value.toString();
    var trasportKey = getTransportKey(dataRes.senderPublicKey, privateKey);
    var decrypt = signature_generator_1.utils.crypto.decryptSeed(encryptedMessage, trasportKey, 5000);
    return JSON.parse(decrypt);
};
var getCustomerInfo = function (addresses) {
    return Promise.all(addresses.map(function (address) { return __awaiter(void 0, void 0, void 0, function () {
        var url, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://nodestestnet.acrylplatform.com/transactions/info/" + address;
                    return [4 /*yield*/, axios(url)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, dataDecrypt(res.data)];
            }
        });
    }); }));
};
exports.handler = function (event, context, callback) { return __awaiter(void 0, void 0, void 0, function () {
    var dataBlockchainArray, listTxAssetID;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getListAssetTransfer(ADDRESS)];
            case 1:
                dataBlockchainArray = _a.sent();
                listTxAssetID = new Array;
                return [4 /*yield*/, getDataDynamoDB.then(function (result) {
                        var dataBaseArray = result;
                        return { dataBaseArray: dataBaseArray, dataBlockchainArray: dataBlockchainArray };
                    })
                        .then(function (_a) {
                        var dataBaseArray = _a.dataBaseArray, dataBlockchainArray = _a.dataBlockchainArray;
                        var dataDifferent = diff(dataBlockchainArray, dataBaseArray);
                        var dataDiff = new Array;
                        dataDifferent.map(function (item) {
                            listTxAssetID.push(item.id);
                            dataDiff.push(getAddressFromAttachment(item.attachment));
                        });
                        return dataDiff;
                    })
                        .then(function (dataDiff) {
                        return getCustomerInfo(dataDiff);
                    })
                        .then(function (customerInfo) {
                        return setDataDynamoDB(customerInfo, listTxAssetID);
                    })
                        .then(function (result) { return console.log(result); })];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
