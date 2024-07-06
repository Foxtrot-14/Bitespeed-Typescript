import express from "express";
import { json, urlencoded } from "body-parser";
import { router as indexRouter } from "./routes/index";
import morgan from "morgan";
const app = express();

app.use(json());
const customFormat: string =
  "\x1b[36m:method\x1b[0m :url \x1b[32m:status\x1b[0m :response-time ms - :res[content-length]";
app.use(morgan(customFormat));
app.use(urlencoded({ extended: true }));

app.use("/", indexRouter);

export default app;
