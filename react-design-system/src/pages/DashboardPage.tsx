import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../components/ui/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ProductCard } from '../components/ui/ProductCard';
import { Toast } from '../components/ui/Toast';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

const DashboardPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [loadingProducts] = useState(false);

  const sidebarNavigation = [
    {
      label: 'Tableau de bord',
      href: '/dashboard',
      active: true,
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2m-4 6h4m-4 4h4" />
        </svg>
      ),
    },
    {
      label: 'Produits',
      href: '/products',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: 'Réservations',
      href: '/reservations',
      badge: '3',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
        </svg>
      ),
    },
    {
      label: 'Statistiques',
      href: '/analytics',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 012-2h2" />
        </svg>
      ),
    },
  ];

  const stats = [
    {
      title: 'Produits sauvés',
      value: '1 247',
      change: '+12%',
      positive: true,
      icon: '🥬',
    },
    {
      title: 'CO₂ évité',
      value: '2,4 t',
      change: '+8%',
      positive: true,
      icon: '🌍',
    },
    {
      title: 'Économies générées',
      value: '847 €',
      change: '+23%',
      positive: true,
      icon: '💶',
    },
    {
      title: 'Commerçants actifs',
      value: '45',
      change: '+5%',
      positive: true,
      icon: '🏪',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      title: 'Nouvelle réservation',
      description: 'Boulangerie Martin • Panier petit-déjeuner',
      time: 'il y a 4 min',
      emoji: '🥖',
    },
    {
      id: 2,
      title: 'Produit ajouté',
      description: 'Primeur BioLocal • Fruits & légumes de saison',
      time: 'il y a 11 min',
      emoji: '🍎',
    },
    {
      id: 3,
      title: 'Message reçu',
      description: 'Épicerie Delacroix vous a écrit',
      time: 'il y a 48 min',
      emoji: '💬',
    },
  ];

  const products = [
    {
      id: 1,
      name: 'Panier brunch surprise',
      merchant: 'Café des Halles',
      price: '8,90 €',
      originalPrice: '18,00 €',
      discount: '-50%',
      quantity: 'Disponible jusqu’à 14h',
      image: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=600&q=80',
      tags: ['Bio', 'Local'],
    },
    {
      id: 2,
      name: 'Légumes & fruits de saison',
      merchant: 'Primeur BioLocal',
      price: '4,50 €',
      originalPrice: '9,00 €',
      discount: '-50%',
      quantity: '3 paniers restants',
      image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=600&q=80',
      tags: ['Éco-responsable'],
    },
    {
      id: 3,
      name: 'Box pâtisserie du jour',
      merchant: 'Boulangerie Martin',
      price: '5,20 €',
      originalPrice: '12,00 €',
      discount: '-57%',
      quantity: 'Retrait avant 19h',
      image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',
      tags: ['Gourmand'],
    },
    {
      id: 4,
      name: 'Panier apéro anti-gaspi',
      merchant: 'Chez Simone',
      price: '7,00 €',
      originalPrice: '15,00 €',
      discount: '-53%',
      quantity: '1 panier restant',
      image: 'https://images.unsplash.com/photo-1484981184820-2e84ea0af1a0?auto=format&fit=crop&w=600&q=80',
      tags: ['Vegan'],
    },
  ];

  return (
    <>
      <DashboardLayout
        sidebar={{
          brand: {
            name: 'Antigaspi',
            logo: (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500 text-white">
                <span className="text-h3">A</span>
              </div>
            ),
          },
          navigation: sidebarNavigation,
        }}
        header={{
          user: {
            name: 'Marie Dupont',
            email: 'marie@antigaspi.fr',
          },
          notifications: (
            <Button variant="ghost" size="icon" onClick={() => setToastOpen(true)} aria-label="Afficher les notifications">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.003 3a9 9 0 119 9v4a2 2 0 01-2 2h-7a2 2 0 01-2-2v-4a9 9 0 012-5.996" />
              </svg>
            </Button>
          ),
          actions: (
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Ajouter un produit
            </Button>
          ),
        }}
      >
        <div className="space-y-10">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-h1 text-primary-800 dark:text-primary-100">Bonjour Marie 👋</h1>
              <p className="text-body text-neutral-500 dark:text-neutral-300">
                Suivez vos performances et optimisez vos paniers anti-gaspi.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary">Exporter les données</Button>
              <Button variant="outline">Partager</Button>
            </div>
          </header>

          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} variant="glass" hover="lift" padding="lg">
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className="rounded-full bg-primary-500/10 px-3 py-1 text-caption text-primary-700">{stat.change}</span>
                  </div>
                  <p className="text-caption uppercase tracking-[0.2em] text-primary-500">{stat.title}</p>
                  <p className="text-h1 font-semibold text-primary-700 dark:text-primary-200">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-2" variant="glass">
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>Vos dernières interactions sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      className="flex items-center gap-4 rounded-2xl bg-primary-500/5 p-4 transition hover:bg-primary-500/10"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="text-2xl">{activity.emoji}</div>
                      <div className="flex-1">
                        <p className="text-small font-semibold text-neutral-800 dark:text-neutral-100">{activity.title}</p>
                        <p className="text-caption text-neutral-500 dark:text-neutral-300">{activity.description}</p>
                      </div>
                      <span className="text-caption text-neutral-400">{activity.time}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card variant="highlight">
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                  <CardDescription>Gagnez du temps avec ces raccourcis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="secondary" className="w-full justify-start">
                    <span className="mr-3">➕</span> Ajouter une offre
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <span className="mr-3">📦</span> Gérer mes paniers
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <span className="mr-3">📈</span> Voir les analyses
                  </Button>
                </CardContent>
              </Card>

              <Card variant="muted">
                <CardHeader>
                  <CardTitle>Impact environnemental</CardTitle>
                  <CardDescription>Semaine du 2 ➜ 8 avril</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-small text-neutral-500">CO₂ économisé</span>
                    <span className="text-h3 font-semibold text-primary-700">45 kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-small text-neutral-500">Litres d’eau préservés</span>
                    <span className="text-h3 font-semibold text-primary-700">120 L</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-small text-neutral-500">Repas distribués</span>
                    <span className="text-h3 font-semibold text-primary-700">68</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-h2 text-primary-800 dark:text-primary-100">Paniers à promouvoir</h2>
                <p className="text-body text-neutral-500 dark:text-neutral-300">Sélectionnez vos meilleures offres pour booster vos ventes.</p>
              </div>
              <Button variant="ghost">Voir tous les paniers</Button>
            </div>

            {loadingProducts ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-80" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                title="Aucun panier pour le moment"
                description="Créez votre premier panier pour être visible dans le fil des commerçants anti-gaspi."
                actionLabel="Créer un panier"
                onAction={() => setModalOpen(true)}
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    image={product.image}
                    name={product.name}
                    merchant={product.merchant}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    discount={product.discount}
                    quantity={product.quantity}
                    tags={product.tags}
                    onReserve={() => setToastOpen(true)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </DashboardLayout>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Ajouter un nouveau produit"
        description="Renseignez les informations clés de votre panier surprise."
        size="lg"
      >
        <div className="space-y-4 text-body text-neutral-600 dark:text-neutral-200">
          <p>Ce formulaire détaillé vous aidera à maximiser l’impact de vos paniers anti-gaspi.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      <Toast
        isOpen={toastOpen}
        tone="success"
        title="Action réalisée"
        description="Votre panier a été mis en avant auprès de la communauté."
        onClose={() => setToastOpen(false)}
      />
    </>
  );
};

export default DashboardPage;
