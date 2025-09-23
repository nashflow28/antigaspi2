import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});

    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsLoading(false);

    if (!formData.email.includes('@')) {
      setErrors((prev) => ({ ...prev, email: 'Adresse e-mail invalide' }));
    }
    if (formData.password.length < 6) {
      setErrors((prev) => ({ ...prev, password: 'Le mot de passe doit contenir au moins 6 caractères' }));
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50 px-4 py-12 dark:bg-neutral-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10%] h-64 w-64 -translate-x-1/2 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-accent-blue/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-500 text-white shadow-card">
            <span className="text-h2 font-semibold">A</span>
          </div>
          <h1 className="text-h1 text-primary-800 dark:text-primary-100">Antigaspi</h1>
          <p className="mt-2 text-body text-neutral-500 dark:text-neutral-300">Connectez-vous pour réduire le gaspillage alimentaire.</p>
        </motion.div>

        <Card variant="glass" padding="lg" hover="glow">
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>Renseignez vos identifiants Antigaspi</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Adresse e-mail"
                name="email"
                type="email"
                placeholder="vous@antigaspi.fr"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                helperText="Utilisez votre e-mail professionnel"
                leftIcon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />

              <Input
                label="Mot de passe"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                leftIcon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              <div className="flex items-center justify-between text-small">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-primary-500/30 text-primary-600 focus:ring-primary-500" />
                  <span className="text-neutral-600 dark:text-neutral-300">Se souvenir de moi</span>
                </label>
                <motion.a href="#" className="text-primary-600 hover:text-primary-500" whileHover={{ scale: 1.05 }}>
                  Mot de passe oublié ?
                </motion.a>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" loading={isLoading}>
                Se connecter
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <span className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-caption text-neutral-400 dark:bg-neutral-900">Ou continuer avec</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="w-full">
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
                <Button variant="secondary" className="w-full">
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>
            </div>

            <motion.p className="mt-6 text-center text-small text-neutral-500 dark:text-neutral-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
              Pas encore de compte ?{' '}
              <motion.a href="#" className="font-medium text-primary-600 hover:text-primary-500" whileHover={{ scale: 1.05 }}>
                Rejoindre Antigaspi
              </motion.a>
            </motion.p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
