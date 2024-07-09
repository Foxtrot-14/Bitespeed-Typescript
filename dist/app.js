"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const index_1 = require("./routes/index");
const morgan_1 = __importDefault(require("morgan"));
const app = (0, express_1.default)();
app.use((0, body_parser_1.json)());
const customFormat = "\x1b[0m :method :url \x1b[32m:status\x1b[0m :response-time ms - :res[content-length]\x1b[36m:remote-addr";
app.use((0, morgan_1.default)(customFormat));
app.use((0, body_parser_1.urlencoded)({ extended: true }));
app.use("/", index_1.router);
exports.default = app;
