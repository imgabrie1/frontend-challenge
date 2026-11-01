import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';

function getUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return db.getUserByToken(token);
}

export const profileHandlers = [
  http.get('/api/profile', async ({ request }) => {
    await delay(150);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    return HttpResponse.json({ data: user });
  }),

  http.put('/api/profile', async ({ request }) => {
    await delay(200);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    const body = await request.json() as { name: string; username: string; bio: string | null; avatarUrl: string | null };

    if (body.username !== user.username && db.usernameExists(body.username)) {
      return HttpResponse.json(
        { code: 'CONFLICT', message: 'Username taken', details: { username: ['Username already in use'] } },
        { status: 409 },
      );
    }

    const updated = db.updateUser(user.id, body);
    return HttpResponse.json({ data: updated });
  }),

  http.post('/api/profile/password', async ({ request }) => {
    await delay(200);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    const body = await request.json() as { currentPassword: string; newPassword: string };
    const ok = db.changePassword(user.id, body.currentPassword, body.newPassword);
    if (!ok) {
      return HttpResponse.json(
        { code: 'INVALID_PASSWORD', message: 'Current password is incorrect', details: { currentPassword: ['Current password incorrect'] } },
        { status: 422 },
      );
    }
    return HttpResponse.json({ data: null });
  }),

  http.post('/api/profile/avatar', async ({ request }) => {
    await delay(300);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    const seed = Date.now();
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    db.updateUser(user.id, { avatarUrl });
    return HttpResponse.json({ data: { avatarUrl } });
  }),
];
