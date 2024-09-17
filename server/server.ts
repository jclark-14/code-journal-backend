/* eslint-disable @typescript-eslint/no-unused-vars -- Remove me */
import 'dotenv/config';
import pg from 'pg';
import argon2 from 'argon2';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Entry } from '../client/src/lib/data';
import { ClientError, errorMiddleware, authMiddleware } from './lib/index.js';

type User = {
  userId: number;
  username: string;
  hashedPassword: string;
};
type Auth = {
  username: string;
  password: string;
};

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const hashKey = process.env.TOKEN_SECRET;
if (!hashKey) throw new Error('TOKEN_SECRET not found in .env');

const app = express();
app.use(express.json());
app.post('/api/auth/sign-up', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ClientError(400, 'username and password are required fields');
    }
    const hashedPassword = await argon2.hash(password);
    const sql = `
    insert into users ("username", "hashedPassword")
    values ($1, $2)
    returning "userId", "username", "createdAt"
    `;
    const params = [username, hashedPassword];
    const results = await db.query<User>(sql, params);
    const user = results.rows[0];
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/sign-in', async (req, res, next) => {
  try {
    const { username, password } = req.body as Partial<Auth>;
    if (!username || !password) {
      throw new ClientError(401, 'invalid login');
    }
    const sql = `
    select "userId", "hashedPassword"
    from users
    where "username" = $1
    `;
    const results = await db.query<User>(sql, [username]);
    const user = results.rows[0];
    if (!user) {
      throw new ClientError(401, 'invalid login');
    }
    const isPasswordValid = await argon2.verify(user.hashedPassword, password);
    if (!isPasswordValid) {
      throw new ClientError(401, 'invalid login');
    }
    const payload = {
      userId: user.userId,
      username,
    };
    const token = jwt.sign(payload, hashKey);
    res.status(200).json({
      user: payload,
      token,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/entries', authMiddleware, async (req, res, next) => {
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

app.get('/api/details/:entryId', authMiddleware, async (req, res, next) => {
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

app.post('/api/details/new', authMiddleware, async (req, res, next) => {
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

app.put('/api/details/:entryId', authMiddleware, async (req, res, next) => {
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

app.delete('/api/details/:entryId', authMiddleware, async (req, res, next) => {
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

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});
