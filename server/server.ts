/* eslint-disable @typescript-eslint/no-unused-vars -- Remove me */
import 'dotenv/config';
import pg from 'pg';
import express from 'express';
import { Entry } from '../client/src/data';
import { ClientError, errorMiddleware } from './lib/index.js';

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();

app.use(express.json());

app.get('/api/entries', async (req, res, next) => {
  try {
    const sql = `
  select * from entries
  order by "entryId" desc
  `;
    const results = await db.query<Entry[]>(sql);
    const entries = results.rows;
    res.status(200).json(entries);
  } catch (err) {
    next(err);
  }
});

app.get('/api/details/:entryId', async (req, res, next) => {
  try {
    const { entryId } = req.params;
    if (!Number.isInteger(+entryId)) {
      throw new ClientError(400, 'entryId must be a valid integer');
    }
    const sql = `
  select "entryId", title, notes, "photoUrl"
  from entries
  where "entryId" = $1
  `;
    const params = [entryId];
    const results = await db.query(sql, params);
    const entry = results.rows[0];
    if (!entry) throw new ClientError(404, 'entry not found');
    res.status(200).json(entry);
  } catch (err) {
    next(err);
  }
});

app.post('/api/details/new', async (req, res, next) => {
  try {
    const { title, notes, photoUrl } = req.body;
    if (!title || !notes || !photoUrl) {
      throw new ClientError(
        400,
        'must contain valid title, notes, and photoUrl'
      );
    }
    const sql = `
    insert into entries ("title", "notes", "photoUrl")
    values ($1, $2, $3)
    returning *
    `;
    const params = [title, notes, photoUrl];
    const results = await db.query<Entry[]>(sql, params);
    const entry = results.rows[0];
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

app.put('/api/details/:entryId', async (req, res, next) => {
  try {
    const { entryId } = req.params;
    if (!Number.isInteger(+entryId)) {
      throw new ClientError(400, 'entryId must be a valid integer');
    }
    const { title, photoUrl, notes } = req.body;
    if (!title || !notes || !photoUrl) {
      throw new ClientError(
        400,
        'must contain valid title, notes, and photoUrl'
      );
    }
    const sql = `
    update entries
    set "title" = $1,
        "photoUrl" = $2,
        "notes" = $3
    where "entryId" = $4
    returning *
    `;
    const params = [title, photoUrl, notes, entryId];
    const results = await db.query<Entry>(sql, params);
    const entry = results.rows[0];
    if (!entry) {
      throw new ClientError(404, 'entryId not found');
    }
    res.status(200).json(entry);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/details/:entryId', async (req, res, next) => {
  try {
    const { entryId } = req.params;
    if (!Number.isInteger(+entryId)) {
      throw new ClientError(400, 'entryId must be a valid integer');
    }
    const sql = `
  delete from entries where "entryId" = $1
  `;
    const result = await db.query(sql, [entryId]);
    if (result.rowCount === 0) {
      throw new ClientError(404, `Entry with id ${entryId} not found`);
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});
