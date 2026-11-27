/* App Factory Core Engine — Unified Real SQLite Adapter
 * Mobile (iOS/Android): @capacitor-community/sqlite
 * Web / Playwright:     Real SQLite via sql.js (WASM) + IndexedDB persistence
 * ZERO MOCK DATA: Both run the exact same database/tables.sql & database/seed.sql.
 */

import { NativeBridge } from './native-bridge.js';

const IDB_NAME = 'af_sqlite_store';
const IDB_STORE = 'databases';

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadSqlJsScript(vendorBase) {
  if (typeof window.initSqlJs === 'function') return window.initSqlJs;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${vendorBase}/sql-wasm.js`;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load sql-wasm.js from ${vendorBase}`));
    document.head.appendChild(script);
  });
  return window.initSqlJs;
}

async function fetchSqlText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`SQL file not found: ${path} (${res.status})`);
  return res.text();
}

export class DBAdapter {
  constructor() {
    this.mode = 'uninitialized';
    this.dbName = 'app_db';
    this.wasmDb = null;
    this.nativePlugin = null;
    this.ready = false;
  }

  async init({
    dbName = 'app_db',
    schemaVersion = 1,
    tablesSqlPath = './database/tables.sql',
    seedSqlPath = './database/seed.sql',
    vendorBase = './core-engine/vendor',
    ephemeral = false
  } = {}) {
    this.dbName = dbName;
    this.ephemeral = ephemeral;

    const nativeSqlite = window.Capacitor?.Plugins?.CapacitorSQLite;
    if (NativeBridge.isNative() && nativeSqlite) {
      await this._initNative(nativeSqlite, { dbName, schemaVersion, tablesSqlPath, seedSqlPath });
    } else {
      await this._initWasm({ dbName, schemaVersion, tablesSqlPath, seedSqlPath, vendorBase });
    }
    this.ready = true;
    return this;
  }

  async _initWasm({ dbName, schemaVersion, tablesSqlPath, seedSqlPath, vendorBase }) {
    this.mode = 'wasm-sqlite';
    const initSqlJs = await loadSqlJsScript(vendorBase);
    const SQL = await initSqlJs({
      locateFile: (file) => `${vendorBase}/${file}`
    });

    let savedBytes = null;
    if (!this.ephemeral) {
      try {
        savedBytes = await idbGet(dbName);
      } catch { /* ignore in restricted origins */ }
    }

    this.wasmDb = savedBytes ? new SQL.Database(new Uint8Array(savedBytes)) : new SQL.Database();
    this.wasmDb.run('PRAGMA foreign_keys = ON;');
    this.wasmDb.run(`
      CREATE TABLE IF NOT EXISTS _af_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    const currentVerRow = await this.queryOne("SELECT value FROM _af_meta WHERE key = 'schema_version'");
    const currentVer = currentVerRow ? Number(currentVerRow.value) : 0;

    if (currentVer < schemaVersion) {
      const tablesSql = await fetchSqlText(tablesSqlPath);
      this.wasmDb.run(tablesSql);

      if (currentVer === 0 && seedSqlPath) {
        const seedSql = await fetchSqlText(seedSqlPath);
        if (seedSql.trim()) this.wasmDb.run(seedSql);
      }

      await this.run(
        "INSERT OR REPLACE INTO _af_meta (key, value) VALUES ('schema_version', ?)",
        [String(schemaVersion)]
      );
      await this._persistWasm();
    }
  }

  async _initNative(plugin, { dbName, schemaVersion, tablesSqlPath, seedSqlPath }) {
    this.mode = 'native-sqlite';
    this.nativePlugin = plugin;
    await plugin.createConnection({
      database: dbName,
      encrypted: false,
      mode: 'no-encryption',
      version: schemaVersion,
      readonly: false
    });
    await plugin.open({ database: dbName, readonly: false });
    await plugin.execute({
      database: dbName,
      statements: `
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS _af_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      `
    });
    const currentVerRow = await this.queryOne("SELECT value FROM _af_meta WHERE key = 'schema_version'");
    const currentVer = currentVerRow ? Number(currentVerRow.value) : 0;
    if (currentVer < schemaVersion) {
      const tablesSql = await fetchSqlText(tablesSqlPath);
      await plugin.execute({ database: dbName, statements: tablesSql });
      if (currentVer === 0 && seedSqlPath) {
        const seedSql = await fetchSqlText(seedSqlPath);
        if (seedSql.trim()) await plugin.execute({ database: dbName, statements: seedSql });
      }
      await this.run(
        "INSERT OR REPLACE INTO _af_meta (key, value) VALUES ('schema_version', ?)",
        [String(schemaVersion)]
      );
    }
  }

  async _persistWasm() {
    if (this.mode !== 'wasm-sqlite' || this.ephemeral || !this.wasmDb) return;
    try {
      const bytes = this.wasmDb.export();
      await idbSet(this.dbName, bytes);
    } catch { /* ignore */ }
  }

  async query(sql, params = []) {
    if (this.mode === 'native-sqlite') {
      const res = await this.nativePlugin.query({ database: this.dbName, statement: sql, values: params });
      return res.values || [];
    }
    const stmt = this.wasmDb.prepare(sql);
    try {
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally {
      stmt.free();
    }
  }

  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async run(sql, params = []) {
    if (this.mode === 'native-sqlite') {
      const res = await this.nativePlugin.run({ database: this.dbName, statement: sql, values: params });
      return { changes: res.changes?.changes ?? 0, lastInsertRowid: res.changes?.lastId ?? null };
    }
    this.wasmDb.run(sql, params);
    const changes = this.wasmDb.getRowsModified();
    const idRow = await this.queryOne('SELECT last_insert_rowid() AS id');
    await this._persistWasm();
    return { changes, lastInsertRowid: idRow ? idRow.id : null };
  }

  async execute(sql) {
    if (this.mode === 'native-sqlite') {
      await this.nativePlugin.execute({ database: this.dbName, statements: sql });
      return;
    }
    this.wasmDb.run(sql);
    await this._persistWasm();
  }
}

export const db = new DBAdapter();
