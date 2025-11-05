import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import type { LoginRequest, RegisterRequest } from '../../shared/types';
import { mapApiError } from '../../shared/utils/errorHandler';
import { loginRequestSchema, registerRequestSchema } from '../../shared/utils/validation';
import { useAuthStore } from '../store/auth';

type LoginFormValues = LoginRequest;
type RegisterFormValues = RegisterRequest;

export const useAuthForm = () => {
  const { login, register: registerAction } = useAuthStore.getState();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: { email: '', password: '', name: '', inviteCode: '' },
    mode: 'onSubmit',
  });

  const handleLogin = useCallback(
    async (values: LoginFormValues) => {
      try {
        await login(values);
      } catch (err) {
        const message = mapApiError(err);
        loginForm.setError('root', { message });
      }
    },
    [login, loginForm]
  );

  const handleRegister = useCallback(
    async (values: RegisterFormValues) => {
      try {
        await registerAction(values);
      } catch (err) {
        const message = mapApiError(err);
        registerForm.setError('root', { message });
      }
    },
    [registerAction, registerForm]
  );

  const isSubmitting = useMemo(
    () => loginForm.formState.isSubmitting || registerForm.formState.isSubmitting,
    [loginForm.formState.isSubmitting, registerForm.formState.isSubmitting]
  );

  return {
    loginForm,
    registerForm,
    handleLogin,
    handleRegister,
    errors: {
      login: loginForm.formState.errors,
      register: registerForm.formState.errors,
    },
    isSubmitting,
  };
};
