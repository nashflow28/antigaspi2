#!/usr/bin/env python3
"""Test complet des fonctionnalités Merchant avec détection de bugs"""

import uiautomator2 as u2
import time

print("=" * 70)
print("TEST COMPLET MERCHANT - ANTIGASPI MOBILE")
print("=" * 70)
print()

device = u2.connect('emulator-5554')
width, height = device.window_size()

bugs_found = []
screenshots = []

def take_screenshot(name, description):
    """Capture screenshot et l'ajoute à la liste"""
    filename = f"merchant-{name}.png"
    device.screenshot(filename)
    screenshots.append((filename, description))
    print(f"[SCREENSHOT] {filename} - {description}")

def log_bug(step, description, severity="MEDIUM"):
    """Enregistre un bug détecté"""
    bugs_found.append({
        'step': step,
        'description': description,
        'severity': severity
    })
    print(f"[BUG-{severity}] {step}: {description}")

def wait_and_check(seconds=3):
    """Attend et vérifie l'état de l'écran"""
    time.sleep(seconds)

# ============================================================================
# ÉTAPE 1: LOGIN MERCHANT
# ============================================================================
print("\n" + "=" * 70)
print("ÉTAPE 1: LOGIN MERCHANT")
print("=" * 70)

wait_and_check(2)
take_screenshot("01-login-screen", "Écran de login initial")

# Cliquer sur Merchant
merchant_y = int(height * 0.82)
device.click(width // 2, merchant_y)
print("[ACTION] Clic sur bouton Merchant")
wait_and_check(2)

take_screenshot("02-credentials-filled", "Credentials Merchant remplis")

# Cliquer sur Se connecter
login_btn_y = int(height * 0.55)
device.click(width // 2, login_btn_y)
print("[ACTION] Clic sur Se connecter")
wait_and_check(6)

take_screenshot("03-after-login", "Écran après login Merchant")

# Vérifier login réussi
screen = device.dump_hierarchy()
if 'Dashboard' in screen or 'Tableau' in screen or 'Produits' in screen:
    print("[SUCCESS] Login Merchant réussi")
else:
    log_bug("LOGIN", "Impossible de confirmer login réussi", "HIGH")

# ============================================================================
# ÉTAPE 2: DASHBOARD MERCHANT
# ============================================================================
print("\n" + "=" * 70)
print("ÉTAPE 2: DASHBOARD MERCHANT")
print("=" * 70)

wait_and_check(3)
take_screenshot("04-dashboard-overview", "Vue d'ensemble Dashboard Merchant")

# Vérifier éléments dashboard
screen = device.dump_hierarchy()
dashboard_elements = {
    'statistiques': 'Statistiques' in screen or 'Stats' in screen,
    'produits': 'Produits' in screen or 'Products' in screen,
    'reservations': 'Réservations' in screen or 'Reservations' in screen,
}

for element, found in dashboard_elements.items():
    if not found:
        log_bug("DASHBOARD", f"Élément '{element}' non trouvé", "LOW")

# Scroll pour voir plus d'infos
device.swipe(width//2, height-300, width//2, height//2, 0.1)
wait_and_check(1)
take_screenshot("05-dashboard-scrolled", "Dashboard après scroll")

# ============================================================================
# ÉTAPE 3: GESTION DES PRODUITS
# ============================================================================
print("\n" + "=" * 70)
print("ÉTAPE 3: GESTION DES PRODUITS")
print("=" * 70)

# Naviguer vers Produits (tab ou bouton)
# Tab Produits généralement deuxième position
products_tab_x = int(width * 0.35)
tab_y = int(height * 0.96)

device.click(products_tab_x, tab_y)
print("[ACTION] Navigation vers Produits")
wait_and_check(4)

take_screenshot("06-products-list", "Liste des produits du merchant")

# Vérifier si des produits sont affichés
screen = device.dump_hierarchy()
if 'Aucun produit' in screen or 'No products' in screen:
    print("[INFO] Aucun produit trouvé - normal pour nouveau merchant")
elif 'F CFA' in screen or 'XOF' in screen:
    print("[SUCCESS] Produits affichés avec prix")

# Chercher bouton "Ajouter produit" ou "+"
if device(textContains='Ajouter').exists or device(text='+').exists:
    print("[FOUND] Bouton d'ajout de produit trouvé")
else:
    log_bug("PRODUCTS", "Bouton 'Ajouter produit' non trouvé", "MEDIUM")

# ============================================================================
# ÉTAPE 4: AJOUTER UN PRODUIT
# ============================================================================
print("\n" + "=" * 70)
print("ÉTAPE 4: AJOUTER UN PRODUIT")
print("=" * 70)

# Chercher et cliquer sur bouton d'ajout
add_clicked = False

if device(textContains='Ajouter').exists:
    device(textContains='Ajouter').click()
    add_clicked = True
    print("[ACTION] Clic sur bouton 'Ajouter'")
elif device(text='+').exists:
    device(text='+').click()
    add_clicked = True
    print("[ACTION] Clic sur bouton '+'")
else:
    # Essayer position habituelle (coin supérieur droit ou en bas)
    device.click(int(width * 0.85), int(height * 0.15))
    add_clicked = True
    print("[ACTION] Clic sur position bouton ajout (approximatif)")

if add_clicked:
    wait_and_check(3)
    take_screenshot("07-add-product-form", "Formulaire d'ajout de produit")

    # Vérifier présence des champs
    screen = device.dump_hierarchy()
    form_fields = {
        'nom': 'Nom' in screen or 'Name' in screen,
        'prix': 'Prix' in screen or 'Price' in screen,
        'quantite': 'Quantit' in screen or 'Quantity' in screen,
        'description': 'Description' in screen,
        'categorie': 'Cat' in screen,
    }

    for field, found in form_fields.items():
        if not found:
            log_bug("ADD_PRODUCT", f"Champ '{field}' non trouvé dans le formulaire", "MEDIUM")

    # Retour arrière
    device.click(int(width * 0.1), int(height * 0.08))
    wait_and_check(2)
else:
    log_bug("ADD_PRODUCT", "Impossible de trouver le bouton d'ajout", "HIGH")

# ============================================================================
# ÉTAPE 5: MODIFIER UN PRODUIT EXISTANT
# ============================================================================
print("\n" + "=" * 70)
print("ÉTAPE 5: MODIFIER UN PRODUIT EXISTANT")
print("=" * 70)

# Retour sur liste produits
take_screenshot("08-back-to-products", "Retour liste produits")

# Cliquer sur le premier produit (si existe)
product_y = int(height * 0.30)
device.click(width // 2, product_y)
print("[ACTION] Clic sur premier produit")
wait_and_check(3)

take_screenshot("09-product-detail-merchant", "Détail produit vu par merchant")

# Chercher bouton Modifier/Edit
screen = device.dump_hierarchy()
if 'Modifier' in screen or 'Edit' in screen:
    print("[SUCCESS] Bouton Modifier trouvé")
    if device(textContains='Modifier').exists:
        device(textContains='Modifier').click()
        wait_and_check(2)
        take_screenshot("10-edit-product-form", "Formulaire de modification")

        # Retour
        device.press('back')
        wait_and_check(1)
else:
    log_bug("EDIT_PRODUCT", "Bouton 'Modifier' non trouvé dans détail produit", "MEDIUM")

# ============================================================================
# ÉTAPE 6: RÉSERVATIONS MERCHANT
# ============================================================================
print("\n" + "=" * 70)
print("ÉTAPE 6: RÉSERVATIONS MERCHANT")
print("=" * 70)

# Naviguer vers Réservations (tab)
reservations_tab_x = int(width * 0.65)
device.click(reservations_tab_x, tab_y)
print("[ACTION] Navigation vers Réservations")
wait_and_check(4)

take_screenshot("11-reservations-list", "Liste des réservations")

# Vérifier contenu
screen = device.dump_hierarchy()
if 'Aucune réservation' in screen or 'No reservations' in screen:
    print("[INFO] Aucune réservation - normal si pas de commandes")
elif 'En attente' in screen or 'Pending' in screen:
    print("[SUCCESS] Réservations affichées avec statuts")

# Chercher filtres/tabs de statut
if 'En attente' in screen and 'Confirm' in screen:
    print("[SUCCESS] Filtres de statut disponibles")
else:
    log_bug("RESERVATIONS", "Filtres de statut de réservation non trouvés", "LOW")

# ============================================================================
# ÉTAPE 7: GÉRER UNE RÉSERVATION
# ============================================================================
print("\n" + "=" * 70)
print("ÉTAPE 7: GÉRER UNE RÉSERVATION")
print("=" * 70)

# Cliquer sur première réservation (si existe)
reservation_y = int(height * 0.35)
device.click(width // 2, reservation_y)
print("[ACTION] Clic sur première réservation")
wait_and_check(3)

take_screenshot("12-reservation-detail", "Détail d'une réservation")

# Vérifier actions disponibles
screen = device.dump_hierarchy()
actions = {
    'confirmer': 'Confirmer' in screen or 'Confirm' in screen,
    'refuser': 'Refuser' in screen or 'Reject' in screen,
    'contacter': 'Contacter' in screen or 'Contact' in screen,
}

for action, found in actions.items():
    if not found and 'Aucune' not in screen:
        log_bug("RESERVATION_ACTIONS", f"Action '{action}' non trouvée", "MEDIUM")

device.press('back')
wait_and_check(1)

# ============================================================================
# ÉTAPE 8: PROFIL MERCHANT
# ============================================================================
print("\n" + "=" * 70)
print("ÉTAPE 8: PROFIL MERCHANT")
print("=" * 70)

# Naviguer vers Profil/Compte (dernier tab)
profile_tab_x = int(width * 0.90)
device.click(profile_tab_x, tab_y)
print("[ACTION] Navigation vers Profil")
wait_and_check(3)

take_screenshot("13-merchant-profile", "Profil du merchant")

# Vérifier informations affichées
screen = device.dump_hierarchy()
profile_info = {
    'nom_commerce': 'commerce' in screen.lower() or 'business' in screen.lower(),
    'email': '@' in screen,
    'phone': '+' in screen or '0' in screen,
}

for info, found in profile_info.items():
    if not found:
        log_bug("PROFILE", f"Information '{info}' non affichée", "LOW")

# Chercher bouton Modifier profil
if device(textContains='Modifier').exists or device(textContains='Edit').exists:
    print("[SUCCESS] Bouton modification profil trouvé")
else:
    log_bug("PROFILE", "Bouton 'Modifier profil' non trouvé", "MEDIUM")

# Scroll pour voir plus d'options
device.swipe(width//2, height-300, width//2, height//2, 0.1)
wait_and_check(1)
take_screenshot("14-profile-scrolled", "Profil après scroll")

# Chercher option Déconnexion
if device(textContains='D\u00e9connexion').exists or device(textContains='Logout').exists:
    print("[SUCCESS] Option Déconnexion trouvée")
else:
    log_bug("PROFILE", "Option 'Déconnexion' non trouvée", "MEDIUM")

# ============================================================================
# ÉTAPE 9: STATISTIQUES/ANALYTICS
# ============================================================================
print("\n" + "=" * 70)
print("ÉTAPE 9: STATISTIQUES")
print("=" * 70)

# Retour au dashboard
dashboard_tab_x = int(width * 0.15)
device.click(dashboard_tab_x, tab_y)
print("[ACTION] Retour Dashboard")
wait_and_check(3)

take_screenshot("15-dashboard-stats", "Statistiques du merchant")

# Vérifier métriques affichées
screen = device.dump_hierarchy()
metrics = {
    'ventes': 'vente' in screen.lower() or 'sale' in screen.lower(),
    'revenus': 'revenu' in screen.lower() or 'revenue' in screen.lower(),
    'produits': 'produit' in screen.lower() or 'product' in screen.lower(),
    'reservations': 'reservation' in screen.lower(),
}

for metric, found in metrics.items():
    if not found:
        log_bug("STATS", f"Métrique '{metric}' non affichée", "LOW")

# ============================================================================
# RAPPORT FINAL
# ============================================================================
print("\n" + "=" * 70)
print("RAPPORT FINAL")
print("=" * 70)

print(f"\n[SCREENSHOTS] {len(screenshots)} captures effectuées:")
for i, (filename, desc) in enumerate(screenshots, 1):
    print(f"  {i}. {filename}: {desc}")

print(f"\n[BUGS] {len(bugs_found)} problèmes détectés:")
if bugs_found:
    for i, bug in enumerate(bugs_found, 1):
        print(f"  {i}. [{bug['severity']}] {bug['step']}: {bug['description']}")
else:
    print("  Aucun bug critique détecté!")

print("\n" + "=" * 70)
print("TEST MERCHANT TERMINÉ")
print("=" * 70)
print("\nVérifier tous les screenshots dans le dossier mobile/")
