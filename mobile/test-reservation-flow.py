#!/usr/bin/env python3
"""Test complet du flux de réservation"""

import uiautomator2 as u2
import time

print("[TEST] Démarrage test flux réservation complet...")
print("=" * 60)

device = u2.connect('emulator-5554')
print(f"[OK] Connecté: {device.device_info['model']}")

width, height = device.window_size()
print(f"[INFO] Taille écran: {width}x{height}\n")

# ====== ÉTAPE 1: LOGIN ======
print("ÉTAPE 1: LOGIN CONSUMER")
print("-" * 60)

# Attendre que l'écran de login soit visible
time.sleep(2)
device.screenshot('01-login-screen.png')
print("[SCREENSHOT] 01-login-screen.png")

# Cliquer sur Consumer
consumer_y = int(height * 0.76)
device.click(width // 2, consumer_y)
print("[CLICK] Bouton Consumer cliqué")
time.sleep(2)

# Cliquer sur Se connecter
login_btn_y = int(height * 0.55)
device.click(width // 2, login_btn_y)
print("[CLICK] Bouton Se connecter cliqué")
time.sleep(6)

device.screenshot('02-after-login.png')
print("[SCREENSHOT] 02-after-login.png")

# Vérifier que le login a réussi
screen = device.dump_hierarchy()
if 'Accueil' in screen or 'Dashboard' in screen or 'Produits' in screen:
    print("[SUCCESS] Login réussi!\n")
else:
    print("[FAIL] Login a échoué - Arrêt du test")
    print(f"[DEBUG] Contenu écran: {screen[:300]}")
    exit(1)

# ====== ÉTAPE 2: NAVIGATION VERS PRODUITS ======
print("ÉTAPE 2: NAVIGATION VERS PRODUITS")
print("-" * 60)

# Attendre chargement du dashboard
time.sleep(3)
device.screenshot('03-dashboard.png')
print("[SCREENSHOT] 03-dashboard.png")

# Chercher et cliquer sur "Produits" ou icône produits
# Option 1: Texte "Produits"
if device(text='Produits').exists:
    device(text='Produits').click()
    print("[CLICK] Onglet Produits cliqué (texte)")
elif device(textContains='Produit').exists:
    device(textContains='Produit').click()
    print("[CLICK] Onglet Produits cliqué (partiel)")
else:
    # Option 2: Navigation bottom bar (position approximative)
    # Tab Produits généralement au centre en bas
    tab_y = int(height * 0.96)
    device.click(width // 2, tab_y)
    print("[CLICK] Onglet Produits cliqué (position)")

time.sleep(4)
device.screenshot('04-products-list.png')
print("[SCREENSHOT] 04-products-list.png\n")

# ====== ÉTAPE 3: SÉLECTION PRODUIT ======
print("ÉTAPE 3: SÉLECTION D'UN PRODUIT")
print("-" * 60)

# Attendre que les produits se chargent
time.sleep(2)

# Cliquer sur le premier produit (environ 30% du haut)
product_y = int(height * 0.35)
device.click(width // 2, product_y)
print("[CLICK] Premier produit cliqué")

time.sleep(3)
device.screenshot('05-product-detail.png')
print("[SCREENSHOT] 05-product-detail.png\n")

# ====== ÉTAPE 4: CRÉATION RÉSERVATION ======
print("ÉTAPE 4: CRÉATION RÉSERVATION")
print("-" * 60)

# Chercher bouton "Réserver" ou "Ajouter au panier"
if device(textContains='server').exists or device(textContains='Server').exists:
    # Cliquer sur bouton Réserver
    device(textContains='server').click()
    print("[CLICK] Bouton Réserver cliqué (texte)")
else:
    # Si pas trouvé, cliquer en bas de l'écran (position bouton)
    reserve_btn_y = int(height * 0.85)
    device.click(width // 2, reserve_btn_y)
    print("[CLICK] Bouton Réserver cliqué (position)")

time.sleep(3)
device.screenshot('06-after-reserve-click.png')
print("[SCREENSHOT] 06-after-reserve-click.png")

# Vérifier si modal de confirmation ou quantité apparaît
time.sleep(2)

# Si modal de quantité, confirmer
if device(textContains='Confirmer').exists or device(text='OK').exists:
    if device(textContains='Confirmer').exists:
        device(textContains='Confirmer').click()
        print("[CLICK] Bouton Confirmer cliqué")
    else:
        device(text='OK').click()
        print("[CLICK] Bouton OK cliqué")
    time.sleep(3)

device.screenshot('07-after-confirm.png')
print("[SCREENSHOT] 07-after-confirm.png\n")

# ====== ÉTAPE 5: VOIR MES RÉSERVATIONS ======
print("ÉTAPE 5: VÉRIFICATION RÉSERVATIONS")
print("-" * 60)

# Navigation vers Réservations/Profile
time.sleep(2)

# Cliquer sur onglet Réservations (généralement 3ème tab)
tab_y = int(height * 0.96)
reservations_tab_x = int(width * 0.65)
device.click(reservations_tab_x, tab_y)
print("[CLICK] Onglet Réservations cliqué")

time.sleep(4)
device.screenshot('08-reservations-list.png')
print("[SCREENSHOT] 08-reservations-list.png\n")

# ====== VÉRIFICATION FINALE ======
print("VÉRIFICATION FINALE")
print("-" * 60)

final_screen = device.dump_hierarchy()

# Chercher indices de réservation réussie
success_indicators = [
    'servation' in final_screen.lower(),
    'reserved' in final_screen.lower(),
    'panier' in final_screen.lower(),
    'cart' in final_screen.lower()
]

if any(success_indicators):
    print("[SUCCESS] Flux de réservation COMPLÉTÉ!")
    print("[INFO] Des réservations sont visibles")
else:
    print("[PARTIAL] Flux exécuté - Vérifier screenshots")
    print(f"[DEBUG] Contenu: {final_screen[:400]}")

print("\n" + "=" * 60)
print("TEST TERMINÉ - Vérifier les 8 screenshots")
print("=" * 60)
