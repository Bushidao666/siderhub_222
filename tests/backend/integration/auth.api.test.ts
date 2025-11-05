describe.skip('POST /api/auth/login', () => {
  it.todo('responds with tokens when credentials are valid');
  it.todo('returns 401 with ApiError when credentials are invalid');
});

describe.skip('POST /api/auth/refresh', () => {
  it.todo('rotates refresh token and returns new access token');
});

describe.skip('POST /api/auth/logout', () => {
  it.todo('invalidates the provided session and returns success');
});
