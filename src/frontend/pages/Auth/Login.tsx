import type { FormEvent } from 'react';
import { useState } from 'react';
import { colors, typography } from '../../../shared/design/tokens';
import { Input, Button, Card } from '../../components/common';
import { selectAuthError, selectAuthLoading, useAuthStore } from '../../store/auth';

export const Login = () => {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore(selectAuthLoading);
  const lastError = useAuthStore(selectAuthError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch {
      // error already stored in store; avoid throwing to UI
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md" variant="outlined">
      <form onSubmit={onSubmit} className="space-y-4" aria-label="Formulário de login">
        <div className="space-y-1 text-center">
          <h2
            className="text-xl uppercase tracking-[0.16em]"
            style={{ fontFamily: typography.fontHeading, color: colors.primary }}
          >
            Entrar
          </h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Acesse com seu e-mail e senha.
          </p>
        </div>
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Senha"
          type="password"
          name="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {lastError ? (
          <div className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: colors.accentError, color: colors.accentError }}>
            {lastError}
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" loading={isLoading} data-testid="auth-submit">
            Entrar
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default Login;

