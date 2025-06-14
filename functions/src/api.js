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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
var functions = require("firebase-functions");
var express = require("express");
var admin = require("firebase-admin");
var isAdmin_1 = require("./middleware/isAdmin");
var app = express();
// Secure /me endpoint: returns user role from Firestore
app.get('/me', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var idToken, decodedToken, userDoc, _a, role, email, uid, err_1;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                idToken = (_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split('Bearer ')[1];
                if (!idToken)
                    return [2 /*return*/, res.status(401).send('Unauthorized')];
                return [4 /*yield*/, admin.auth().verifyIdToken(idToken)];
            case 1:
                decodedToken = _c.sent();
                return [4 /*yield*/, admin.firestore().collection('users').doc(decodedToken.uid).get()];
            case 2:
                userDoc = _c.sent();
                if (!userDoc.exists)
                    return [2 /*return*/, res.status(404).send('User not found')];
                _a = userDoc.data(), role = _a.role, email = _a.email, uid = _a.uid;
                res.json({ uid: uid, email: email, role: role });
                return [3 /*break*/, 4];
            case 3:
                err_1 = _c.sent();
                res.status(401).send('Unauthorized');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Example protected admin route
app.get('/admin/verification-requests', isAdmin_1.isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // ...admin logic here...
        res.send('Admin data');
        return [2 /*return*/];
    });
}); });
exports.api = functions.https.onRequest(app);
