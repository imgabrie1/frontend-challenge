import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';

export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    await delay(800);
    const body = await request.json() as { email: string; name: string; username: string; password: string };
    if (!body.email || !body.name || !body.username || !body.password) {
      return HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'All fields required', details: {} }, { status: 422 });
    }
    if (db.emailExists(body.email)) {
      return HttpResponse.json({ code: 'CONFLICT', message: 'Email already registered', details: { email: ['Email already in use'] } }, { status: 409 });
    }
    if (db.usernameExists(body.username)) {
      return HttpResponse.json({ code: 'CONFLICT', message: 'Username taken', details: { username: ['Username already in use'] } }, { status: 409 });
    }
    const user = db.createUser({ email: body.email, name: body.name, username: body.username, password: body.password, avatarUrl: null, bio: null });
    const session = db.createSession(user.id);
    return HttpResponse.json({ data: { user, tokens: { accessToken: session.token, expiresAt: session.expiresAt } } }, { status: 201 });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await delay(600);
    const body = await request.json() as { email: string; password: string };
    const user = db.getUserByEmail(body.email);
    if (!user || !db.checkPassword(user.id, body.password)) {
      return HttpResponse.json({ code: 'UNAUTHORIZED', message: 'Invalid credentials' }, { status: 401 });
    }
    const session = db.createSession(user.id);
    return HttpResponse.json({ data: { user, tokens: { accessToken: session.token, expiresAt: session.expiresAt } } });
  }),

  http.get('/api/auth/session', ({ request }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return HttpResponse.json({ code: 'UNAUTHORIZED', message: 'No token' }, { status: 401 });
    const user = db.getUserByToken(token);
    if (!user) return HttpResponse.json({ code: 'UNAUTHORIZED', message: 'Session expired' }, { status: 401 });
    return HttpResponse.json({ data: user });
  }),

  http.post('/api/auth/logout', ({ request }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token) db.deleteSession(token);
    return HttpResponse.json({ data: null });
  }),
];
