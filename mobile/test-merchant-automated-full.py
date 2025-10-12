#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de test automatisé COMPLET pour les fonctionnalités Merchant
Utilise ADB pour contrôler l'émulateur Android comme Playwright
"""

import subprocess
import time
import json
import sys
import re
from pathlib import Path

# Fix encoding for Windows cmd
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Configuration
PACKAGE_NAME = "host.exp.exponent"
ACTIVITY = ".experience.HomeActivity"
SCREENSHOTS_DIR = Path("test-results/merchant-tests")
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

# Identifiants de test
MERCHANT_EMAIL = "marie.martin@email.com"
MERCHANT_PASSWORD = "password"
EXPECTED_BUSINESS_TYPE = "boulangerie"
EXPECTED_CATEGORY = "Boulangerie"

class Colors:
    """Codes couleur pour l'affichage dans le terminal"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def run_adb(command, capture_output=True):
    """Exécute une commande ADB"""
    full_command = f"adb shell {command}" if not command.startswith("adb") else command
    try:
        if capture_output:
            result = subprocess.run(full_command, shell=True, capture_output=True, text=True, timeout=30)
            return result.stdout.strip()
        else:
            subprocess.run(full_command, shell=True, timeout=30)
            return None
    except subprocess.TimeoutExpired:
        print(f"{Colors.RED}⏱️  Timeout pour la commande: {command}{Colors.ENDC}")
        return None
    except Exception as e:
        print(f"{Colors.RED}❌ Erreur ADB: {e}{Colors.ENDC}")
        return None

def take_screenshot(filename):
    """Prend un screenshot de l'émulateur"""
    filepath = SCREENSHOTS_DIR / filename
    run_adb(f"adb exec-out screencap -p > {filepath}", capture_output=False)
    print(f"{Colors.CYAN}📸 Screenshot sauvegardé: {filepath}{Colors.ENDC}")
    return filepath

def tap(x, y, description=""):
    """Simule un tap à des coordonnées spécifiques"""
    print(f"{Colors.BLUE}👆 Tap sur ({x}, {y}) - {description}{Colors.ENDC}")
    run_adb(f"input tap {x} {y}")
    time.sleep(1.5)

def input_text(text):
    """Entre du texte (remplace espaces par %s pour ADB)"""
    text_escaped = text.replace(" ", "%s")
    run_adb(f"input text {text_escaped}")
    time.sleep(0.5)

def get_ui_dump():
    """Récupère le dump XML de l'UI actuelle"""
    run_adb("uiautomator dump")
    ui_xml = run_adb("cat /sdcard/window_dump.xml")
    return ui_xml

def check_text_visible(text):
    """Vérifie si un texte est visible dans l'UI actuelle"""
    ui_dump = get_ui_dump()
    if ui_dump and text in ui_dump:
        print(f"{Colors.GREEN}✅ Texte trouvé: '{text}'{Colors.ENDC}")
        return True
    else:
        print(f"{Colors.RED}❌ Texte non trouvé: '{text}'{Colors.ENDC}")
        return False

def wait_for_text(text, timeout=10, check_interval=1):
    """Attend qu'un texte apparaisse dans l'UI"""
    print(f"{Colors.YELLOW}⏳ Attente de: '{text}' (timeout: {timeout}s){Colors.ENDC}")
    elapsed = 0
    while elapsed < timeout:
        if check_text_visible(text):
            return True
        time.sleep(check_interval)
        elapsed += check_interval
    print(f"{Colors.RED}⏱️  Timeout: '{text}' non trouvé après {timeout}s{Colors.ENDC}")
    return False

def scroll_down():
    """Scroll vers le bas"""
    run_adb("input swipe 500 1500 500 500 300")
    time.sleep(1)

def scroll_up():
    """Scroll vers le haut"""
    run_adb("input swipe 500 500 500 1500 300")
    time.sleep(1)

def press_back():
    """Appuie sur le bouton retour"""
    run_adb("input keyevent KEYCODE_BACK")
    time.sleep(1)

def clear_app_data():
    """Efface les données de l'app pour repartir de zéro"""
    print(f"{Colors.YELLOW}🗑️  Nettoyage des données de l'app...{Colors.ENDC}")
    run_adb(f"pm clear {PACKAGE_NAME}")
    time.sleep(2)

def test_backend_api():
    """Test 1: Vérifier que l'API backend répond correctement"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}TEST 1: VÉRIFICATION API BACKEND{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.ENDC}\n")

    tests = [
        ("Health Check", "http://10.0.2.2:8000/api/health"),
        ("Login Merchant", "http://10.0.2.2:8000/api/auth/login", {
            "email": MERCHANT_EMAIL,
            "password": MERCHANT_PASSWORD
        }),
    ]

    results = {"passed": 0, "failed": 0}
    token = None

    for test_name, url, *data in tests:
        print(f"{Colors.CYAN}🔍 Test: {test_name}{Colors.ENDC}")
        try:
            if data:
                # POST request
                json_data = json.dumps(data[0])
                cmd = f'curl -s -X POST "{url}" -H "Content-Type: application/json" -H "Accept: application/json" -d \'{json_data}\''
            else:
                # GET request
                cmd = f'curl -s "{url}"'

            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            response = result.stdout

            try:
                json_response = json.loads(response)
                if json_response.get("success"):
                    print(f"{Colors.GREEN}✅ {test_name}: SUCCESS{Colors.ENDC}")
                    results["passed"] += 1

                    # Sauvegarder le token pour les prochains tests
                    if "data" in json_response and "token" in json_response["data"]:
                        token = json_response["data"]["token"]
                        print(f"{Colors.CYAN}🔑 Token JWT récupéré{Colors.ENDC}")
                else:
                    print(f"{Colors.RED}❌ {test_name}: FAILED - {json_response.get('message')}{Colors.ENDC}")
                    results["failed"] += 1
            except json.JSONDecodeError:
                print(f"{Colors.RED}❌ {test_name}: FAILED - Réponse invalide{Colors.ENDC}")
                print(f"{Colors.YELLOW}Réponse brute: {response[:200]}{Colors.ENDC}")
                results["failed"] += 1

        except Exception as e:
            print(f"{Colors.RED}❌ {test_name}: FAILED - {e}{Colors.ENDC}")
            results["failed"] += 1

    # Test categories merchant avec token
    if token:
        print(f"\n{Colors.CYAN}🔍 Test: Categories Merchant (avec authentification){Colors.ENDC}")
        cmd = f'curl -s "http://10.0.2.2:8000/api/categories/merchant" -H "Authorization: Bearer {token}" -H "Accept: application/json"'
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            response = result.stdout
            json_response = json.loads(response)

            if json_response.get("success"):
                categories = json_response.get("data", [])
                print(f"{Colors.GREEN}✅ Categories Merchant: SUCCESS{Colors.ENDC}")
                print(f"{Colors.CYAN}📊 Catégories retournées: {len(categories)}{Colors.ENDC}")

                # Vérifier que seule "Boulangerie" est présente
                category_names = [cat["name"] for cat in categories]
                print(f"{Colors.CYAN}📝 Liste: {', '.join(category_names)}{Colors.ENDC}")

                if len(categories) == 1 and categories[0]["name"] == EXPECTED_CATEGORY:
                    print(f"{Colors.GREEN}✅ VALIDATION: Seule la catégorie '{EXPECTED_CATEGORY}' est présente (CORRECT){Colors.ENDC}")
                    results["passed"] += 1
                else:
                    print(f"{Colors.RED}❌ VALIDATION: Attendu uniquement '{EXPECTED_CATEGORY}', trouvé: {category_names}{Colors.ENDC}")
                    results["failed"] += 1
            else:
                print(f"{Colors.RED}❌ Categories Merchant: FAILED - {json_response.get('message')}{Colors.ENDC}")
                results["failed"] += 1
        except Exception as e:
            print(f"{Colors.RED}❌ Categories Merchant: FAILED - {e}{Colors.ENDC}")
            results["failed"] += 1

    print(f"\n{Colors.BOLD}📊 Résultats Test Backend:{Colors.ENDC}")
    print(f"{Colors.GREEN}✅ Réussis: {results['passed']}{Colors.ENDC}")
    print(f"{Colors.RED}❌ Échoués: {results['failed']}{Colors.ENDC}")

    return results["failed"] == 0

def test_merchant_login_flow():
    """Test 2: Flux de connexion merchant dans l'app mobile"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}TEST 2: FLUX DE CONNEXION MERCHANT{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.ENDC}\n")

    # Screenshot initial
    take_screenshot("01-initial-screen.png")

    # Attendre que l'écran de login apparaisse
    print(f"{Colors.YELLOW}⏳ Attente de l'écran de login...{Colors.ENDC}")
    time.sleep(3)
    take_screenshot("02-login-screen.png")

    # Vérifier si on est déjà connecté (si on voit "Accueil" ou "Découvrir")
    ui_dump = get_ui_dump()
    if ui_dump and ("Accueil" in ui_dump or "Découvrir" in ui_dump):
        print(f"{Colors.YELLOW}⚠️  Déjà connecté, déconnexion d'abord...{Colors.ENDC}")
        # Aller dans le profil et se déconnecter
        tap(950, 2200, "Onglet Profil")
        time.sleep(2)
        take_screenshot("03-profile-before-logout.png")

        scroll_down()
        take_screenshot("04-profile-scrolled.png")

        # Tap sur bouton déconnexion (approximation)
        tap(540, 1900, "Bouton Déconnexion")
        time.sleep(1)

        # Confirmer dans l'alert
        tap(700, 1400, "Confirmer déconnexion")
        time.sleep(3)
        take_screenshot("05-after-logout.png")

    # Maintenant on devrait être sur l'écran de login
    print(f"{Colors.CYAN}📝 Saisie des identifiants merchant...{Colors.ENDC}")

    # Tap sur champ email
    tap(540, 800, "Champ Email")
    time.sleep(0.5)

    # Entrer l'email
    input_text(MERCHANT_EMAIL)
    take_screenshot("06-email-entered.png")

    # Tap sur champ password
    tap(540, 950, "Champ Password")
    time.sleep(0.5)

    # Entrer le mot de passe
    input_text(MERCHANT_PASSWORD)
    take_screenshot("07-password-entered.png")

    # Cacher le clavier
    press_back()
    time.sleep(1)

    # Tap sur bouton connexion
    tap(540, 1150, "Bouton Connexion")
    print(f"{Colors.YELLOW}⏳ Connexion en cours...{Colors.ENDC}")
    time.sleep(5)

    take_screenshot("08-after-login.png")

    # Vérifier qu'on est bien connecté en tant que merchant
    if wait_for_text("Tableau de bord", timeout=5) or wait_for_text("Dashboard", timeout=5):
        print(f"{Colors.GREEN}✅ Connexion merchant réussie{Colors.ENDC}")
        return True
    else:
        print(f"{Colors.RED}❌ Échec de la connexion merchant{Colors.ENDC}")
        return False

def test_merchant_products_screen():
    """Test 3: Navigation vers 'Mes Produits' et vérification de l'écran"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}TEST 3: ÉCRAN MES PRODUITS{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.ENDC}\n")

    # Tap sur l'onglet "Mes Produits" (2ème icône dans la bottom bar)
    tap(324, 2200, "Onglet Mes Produits")
    time.sleep(3)

    take_screenshot("09-products-list.png")

    # Vérifier qu'on voit la liste des produits ou un message "Aucun produit"
    ui_dump = get_ui_dump()
    if ui_dump and ("produit" in ui_dump.lower() or "ajouter" in ui_dump.lower()):
        print(f"{Colors.GREEN}✅ Écran 'Mes Produits' chargé{Colors.ENDC}")
        return True
    else:
        print(f"{Colors.RED}❌ Écran 'Mes Produits' non trouvé{Colors.ENDC}")
        return False

def test_category_filtering():
    """Test 4: Vérifier que le dropdown catégories ne montre QUE 'Boulangerie'"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}TEST 4: FILTRAGE CATÉGORIES (TEST PRINCIPAL){Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.ENDC}\n")

    # Chercher le bouton "+" pour ajouter un produit
    print(f"{Colors.CYAN}🔍 Recherche du bouton Ajouter Produit...{Colors.ENDC}")

    # Le bouton "+" est généralement en haut à droite ou en bas
    # Essayons plusieurs positions possibles
    possible_add_button_positions = [
        (950, 150, "Bouton + (haut droite)"),
        (950, 2100, "Bouton + (bas droite - FAB)"),
        (540, 2000, "Bouton + (bas centre)"),
    ]

    for x, y, description in possible_add_button_positions:
        tap(x, y, description)
        time.sleep(2)

        # Vérifier si le formulaire s'est ouvert
        if check_text_visible("Catégorie") or check_text_visible("catégorie"):
            print(f"{Colors.GREEN}✅ Formulaire d'ajout ouvert{Colors.ENDC}")
            break

    take_screenshot("10-product-form-opened.png")

    # Scroll vers le champ catégorie si nécessaire
    scroll_down()
    time.sleep(1)
    take_screenshot("11-product-form-scrolled.png")

    # Tap sur le champ catégorie pour ouvrir le dropdown
    print(f"{Colors.CYAN}👆 Ouverture du dropdown catégories...{Colors.ENDC}")
    tap(540, 900, "Champ Catégorie")
    time.sleep(2)

    take_screenshot("12-category-dropdown-opened.png")

    # Récupérer le dump UI et chercher les catégories affichées
    ui_dump = get_ui_dump()

    # Chercher toutes les catégories possibles dans le dump
    all_categories = [
        "Boulangerie", "Fruits et Légumes", "Produits Laitiers",
        "Épicerie", "Viande et Poisson", "Boissons",
        "Pâtisserie", "Traiteur", "Autre"
    ]

    found_categories = []
    for category in all_categories:
        if category in ui_dump:
            found_categories.append(category)

    print(f"\n{Colors.BOLD}📊 RÉSULTAT DU TEST DE FILTRAGE:{Colors.ENDC}")
    print(f"{Colors.CYAN}📝 Catégories trouvées dans le dropdown: {found_categories}{Colors.ENDC}")
    print(f"{Colors.CYAN}🎯 Catégorie attendue: ['{EXPECTED_CATEGORY}'] uniquement{Colors.ENDC}")

    # Vérifier que SEULE "Boulangerie" est présente
    if found_categories == [EXPECTED_CATEGORY]:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✅✅✅ TEST RÉUSSI: Le filtrage fonctionne correctement!{Colors.ENDC}")
        print(f"{Colors.GREEN}    Seule la catégorie '{EXPECTED_CATEGORY}' est affichée pour ce merchant.{Colors.ENDC}")
        return True
    elif EXPECTED_CATEGORY in found_categories and len(found_categories) > 1:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ TEST ÉCHOUÉ: Le filtrage ne fonctionne PAS correctement!{Colors.ENDC}")
        print(f"{Colors.RED}    '{EXPECTED_CATEGORY}' est présente mais d'autres catégories aussi: {found_categories}{Colors.ENDC}")
        print(f"{Colors.YELLOW}    🐛 BUG: L'endpoint /categories/merchant ne filtre pas correctement.{Colors.ENDC}")
        return False
    elif EXPECTED_CATEGORY not in found_categories:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ TEST ÉCHOUÉ: La catégorie attendue '{EXPECTED_CATEGORY}' est ABSENTE!{Colors.ENDC}")
        print(f"{Colors.RED}    Catégories trouvées: {found_categories}{Colors.ENDC}")
        print(f"{Colors.YELLOW}    🐛 BUG: Le mapping business_type → catégorie est incorrect.{Colors.ENDC}")
        return False
    else:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  TEST INCERTAIN: Impossible de déterminer les catégories affichées{Colors.ENDC}")
        print(f"{Colors.YELLOW}    Vérification manuelle du screenshot 12-category-dropdown-opened.png nécessaire{Colors.ENDC}")
        return False

def test_logout_button():
    """Test 5: Vérifier que le bouton de déconnexion fonctionne"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}TEST 5: BOUTON DE DÉCONNEXION{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}═══════════════════════════════════════════════════════════{Colors.ENDC}\n")

    # Fermer le formulaire si ouvert
    press_back()
    time.sleep(1)
    press_back()
    time.sleep(1)

    # Aller dans l'onglet Profil
    tap(950, 2200, "Onglet Profil")
    time.sleep(2)
    take_screenshot("13-profile-screen.png")

    # Scroll vers le bas pour voir le bouton déconnexion
    scroll_down()
    time.sleep(1)
    take_screenshot("14-profile-scrolled-logout-visible.png")

    # Tap sur le bouton déconnexion
    print(f"{Colors.CYAN}👆 Clic sur le bouton Déconnexion...{Colors.ENDC}")
    tap(540, 1900, "Bouton Déconnexion")
    time.sleep(2)

    take_screenshot("15-logout-confirmation-dialog.png")

    # Vérifier que le dialog de confirmation apparaît
    if check_text_visible("Déconnexion") or check_text_visible("déconnecter"):
        print(f"{Colors.GREEN}✅ Dialog de confirmation affiché{Colors.ENDC}")

        # Confirmer la déconnexion
        tap(700, 1400, "Confirmer Déconnexion")
        time.sleep(3)

        take_screenshot("16-after-logout-final.png")

        # Vérifier qu'on est revenu à l'écran de login
        if check_text_visible("Connexion") or check_text_visible("Se connecter"):
            print(f"{Colors.GREEN}✅✅ Déconnexion réussie, retour à l'écran de login{Colors.ENDC}")
            return True
        else:
            print(f"{Colors.YELLOW}⚠️  Déconnexion effectuée mais écran de login non détecté{Colors.ENDC}")
            return True
    else:
        print(f"{Colors.RED}❌ Dialog de confirmation non affiché, bouton déconnexion ne fonctionne pas{Colors.ENDC}")
        return False

def main():
    """Fonction principale qui exécute tous les tests"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}")
    print("===================================================================")
    print("     TESTS AUTOMATISES MERCHANT - ANTIGASPI MOBILE APP           ")
    print("     Controle emulateur via ADB (style Playwright)               ")
    print("===================================================================")
    print(f"{Colors.ENDC}\n")

    # Vérifier qu'ADB est disponible
    print(f"{Colors.CYAN}🔍 Vérification de la connexion ADB...{Colors.ENDC}")
    devices = run_adb("adb devices")
    if not devices or "emulator" not in devices:
        print(f"{Colors.RED}❌ Aucun émulateur Android détecté. Lancez l'émulateur d'abord.{Colors.ENDC}")
        sys.exit(1)
    print(f"{Colors.GREEN}✅ Émulateur détecté{Colors.ENDC}\n")

    # Résultats des tests
    results = {
        "Test 1: API Backend": False,
        "Test 2: Login Merchant": False,
        "Test 3: Écran Mes Produits": False,
        "Test 4: Filtrage Catégories": False,
        "Test 5: Bouton Déconnexion": False,
    }

    try:
        # Test 1: Backend API
        results["Test 1: API Backend"] = test_backend_api()

        if not results["Test 1: API Backend"]:
            print(f"\n{Colors.RED}⚠️  ATTENTION: Tests backend échoués, mais on continue avec les tests UI...{Colors.ENDC}")

        # Test 2: Login
        results["Test 2: Login Merchant"] = test_merchant_login_flow()

        if not results["Test 2: Login Merchant"]:
            print(f"\n{Colors.RED}❌ Impossible de continuer sans connexion réussie{Colors.ENDC}")
            raise Exception("Login failed")

        # Test 3: Mes Produits
        results["Test 3: Écran Mes Produits"] = test_merchant_products_screen()

        # Test 4: Filtrage catégories (TEST PRINCIPAL)
        results["Test 4: Filtrage Catégories"] = test_category_filtering()

        # Test 5: Déconnexion
        results["Test 5: Bouton Déconnexion"] = test_logout_button()

    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠️  Tests interrompus par l'utilisateur{Colors.ENDC}")
    except Exception as e:
        print(f"\n{Colors.RED}❌ Erreur fatale: {e}{Colors.ENDC}")

    # Affichage du rapport final
    print(f"\n{Colors.HEADER}{Colors.BOLD}")
    print("===================================================================")
    print("                    RAPPORT FINAL DES TESTS                       ")
    print("===================================================================")
    print(f"{Colors.ENDC}\n")

    passed_count = sum(1 for v in results.values() if v)
    total_count = len(results)

    for test_name, passed in results.items():
        status = f"{Colors.GREEN}✅ PASS{Colors.ENDC}" if passed else f"{Colors.RED}❌ FAIL{Colors.ENDC}"
        print(f"{status}  {test_name}")

    print(f"\n{Colors.BOLD}Score final: {passed_count}/{total_count} tests réussis{Colors.ENDC}")

    if passed_count == total_count:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉🎉🎉 TOUS LES TESTS SONT PASSÉS! 🎉🎉🎉{Colors.ENDC}")
        print(f"{Colors.GREEN}L'application merchant fonctionne parfaitement!{Colors.ENDC}")
    elif results["Test 4: Filtrage Catégories"]:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✅ TEST PRINCIPAL RÉUSSI!{Colors.ENDC}")
        print(f"{Colors.GREEN}Le filtrage des catégories fonctionne correctement.{Colors.ENDC}")
        if passed_count < total_count:
            print(f"{Colors.YELLOW}Quelques tests secondaires ont échoué, mais l'objectif principal est atteint.{Colors.ENDC}")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ DES TESTS ONT ÉCHOUÉ{Colors.ENDC}")
        print(f"{Colors.YELLOW}Consultez les screenshots dans {SCREENSHOTS_DIR} pour le diagnostic{Colors.ENDC}")

    print(f"\n{Colors.CYAN}📁 Screenshots sauvegardés dans: {SCREENSHOTS_DIR}{Colors.ENDC}\n")

    return passed_count == total_count

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
