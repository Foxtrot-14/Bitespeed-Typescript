import express from "express";
import { json, urlencoded } from "body-parser";
import { router as indexRouter } from "./routes/index";
import morgan from "morgan";
const app = express();

app.use(json());
const customFormat: string =
  "\x1b[0m :method :url \x1b[32m:status\x1b[0m :response-time ms - :res[content-length]\x1b[36m:remote-addr";

app.use(morgan(customFormat));
app.use(urlencoded({ extended: true }));

app.use("/", indexRouter);

export default app;
