#!/usr/bin/env node

import * as body from "body-parser";
import * as cluster from "cluster";
import * as express from "express";
import { NextFunction, Request, Response } from "express";
import * as fs from "fs";
import * as http from "http";
import * as morgan from "morgan";
import * as multer from "multer";
import * as os from "os";
import * as path from "path";
import * as uuid from "uuid";

const getFolderPath = () =>
    process.env.FILEROOT || path.join(os.homedir(), "./.zipstore-data");

const getFilePath = (id: string) =>
    path.join(getFolderPath(), id);

const createReadStream = (id: string) =>
    fs.createReadStream(getFilePath(id));

const createWriteStream = (id: string) =>
    fs.createWriteStream(getFilePath(id));

// tslint:disable-next-line:variable-name
const _handleFile = (req: Request, file: any & { stream: fs.ReadStream }, cb: (err?: any, data?: any) => void) => {
    const id = uuid.v4();
    const stream = createWriteStream(id);
    file.stream.pipe(stream);
    stream.on("error", cb);
    stream.on("finish", () => cb(null, { id, mime: file.mimetype }));
};

// tslint:disable-next-line:variable-name
const _removeFile = (req: Request, file: Express.Multer.File, cb: () => void) =>
    fs.unlink(file.path, cb);

const storage = { _handleFile, _removeFile } as any;
const upload = (req: Request, res: Response, next: NextFunction) =>
    multer({ storage }).single(req.query.ref)(req, res, next);

if (cluster.isMaster) {

    if (!fs.existsSync(getFolderPath())) {
        fs.mkdirSync(getFolderPath());
    }

    const totalWorkers = os.cpus().length;

    cluster.on("exit", () => cluster.fork());
    for (let i = 0; i < totalWorkers; i++) {
        cluster.fork();
    }
}

if (cluster.isWorker) {
    const app = express();

    app.use(process.env.NODE_ENV === "production" ?
        morgan("combined") : morgan("dev"));
    app.use(body.urlencoded({ extended: false }));
    app.use(body.json());

    app.get("/:id", (req: Request, res: Response) => {
        res.sendFile(getFilePath(req.params.id));
    });

    app.post("/", upload, (req: Request, res: Response) => {
        const file = req.file as Express.Multer.File & { id: string; mime: string; };
        res.status(201).json({ id: file.id, mime: file.mime, extname: path.extname(file.originalname) });
    });

    app.delete("/:id", (req: Request, res: Response) => {
        fs.unlink(getFilePath(req.params.id), (err?: NodeJS.ErrnoException) => err ?
            res.status(404).send("Cannot DELETE " + req.path) : res.status(200).send("Deleted " + req.params.id));
    });

    app.use((req: Request, res: Response) => {
        res.status(404).send("Cannot " + req.method.toUpperCase() + " " + req.path);
    });

    app.listen(parseInt(process.env.PORT || "8000", 10) || 8000,
        process.env.HOSTNAME || "localhost");
}
