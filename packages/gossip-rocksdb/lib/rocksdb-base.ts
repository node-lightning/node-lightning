import fs from "fs";
import levelup, { LevelUp } from "levelup";
import rocksdb from "rocksdb";

export abstract class RocksdbBase {
    protected _path: string;
    protected _db: LevelUp;

    constructor(path: string) {
        this._path = path;
        fs.mkdirSync(this._path, { recursive: true });
        this._db = levelup(rocksdb(this._path));
    }

    public async open(): Promise<void> {
        return this._db.open();
    }

    public async close(): Promise<void> {
        return this._db.close();
    }

    protected async _safeGet<T>(key: Buffer): Promise<T> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return await this._db.get(key);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (err.notFound) return;
            else throw err;
        }
    }
}
