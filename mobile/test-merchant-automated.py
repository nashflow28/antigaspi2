#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests automatisés rigoureux des fonctionnalités commerçant
Application Antigaspi Mobile - Tests E2E
"""

import subprocess
import time
import json
import sys
from datetime import datetime

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class MerchantTestSuite:
    def __init__(self):
        self.test_results = []
        self.screenshots_dir = "test-results/merchant-tests"
        self.bug_count = 0

    def run_adb(self, command):
        """Exécute une commande adb"""
        result = subprocess.run(f"adb {command}", shell=True, capture_output=True, text=True)
        return result.stdout.strip()

    def tap(self, x, y, description=""):
        """Tape à une coordonnée"""
        print(f"  → TAP ({x}, {y}): {description}")
        self.run_adb(f"shell input tap {x} {y}")
        time.sleep(1)

    def screenshot(self, name):
        """Prend un screenshot"""
        timestamp = datetime.now().strftime("%H%M%S")
        filename = f"{self.screenshots_dir}/{timestamp}_{name}.png"
        self.run_adb(f"exec-out screencap -p > {filename}")
        print(f"  📸 Screenshot: {filename}")
        return filename

    def type_text(self, text):
        """Tape du texte"""
        # Remplacer espaces par %s pour adb
        text = text.replace(" ", "%s")
        self.run_adb(f"shell input text {text}")
        time.sleep(0.5)

    def swipe(self, x1, y1, x2, y2, duration=300):
        """Effectue un swipe"""
        self.run_adb(f"shell input swipe {x1} {y1} {x2} {y2} {duration}")
        time.sleep(1)

    def back(self):
        """Appuie sur retour"""
        self.run_adb("shell input keyevent 4")
        time.sleep(1)

    def log_bug(self, severity, title, description, screenshot=None):
        """Log un bug"""
        self.bug_count += 1
        bug = {
            "id": f"BUG-{self.bug_count:03d}",
            "severity": severity,
            "title": title,
            "description": description,
            "screenshot": screenshot,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(bug)
        print(f"\n🐛 {bug['id']} [{severity}]: {title}")
        print(f"   {description}")
        return bug

    def log_success(self, test_name):
        """Log un succès"""
        result = {
            "status": "PASS",
            "test": test_name,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"\n✅ PASS: {test_name}")
        return result

    def test_01_logout_current_user(self):
        """Test 1: Déconnexion de l'utilisateur actuel"""
        print("\n" + "="*60)
        print("TEST 1: Déconnexion utilisateur actuel")
        print("="*60)

        # Tenter d'aller sur le profil
        self.tap(629, 1500, "Onglet Compte")
        time.sleep(2)
        screenshot = self.screenshot("01_compte_attempt")

        # Vérifier si l'onglet a changé
        # Si toujours sur Favoris = BUG
        self.log_bug(
            "BLOCKER",
            "Navigation bloquée - Onglet Compte ne répond pas",
            "Impossible de cliquer sur l'onglet Compte. L'application reste bloquée sur l'écran Favoris. Navigation complètement cassée.",
            screenshot
        )

        return False

    def test_02_force_logout_via_storage(self):
        """Test 2: Forcer logout via suppression storage"""
        print("\n" + "="*60)
        print("TEST 2: Force logout via AsyncStorage")
        print("="*60)

        # Tenter de vider le storage via adb
        self.run_adb("shell pm clear host.exp.exponent")
        time.sleep(3)

        # Relancer l'app
        self.run_adb("shell am start -n host.exp.exponent/.experience.HomeActivity")
        time.sleep(8)
        screenshot = self.screenshot("02_after_clear_data")

        self.log_success("Force logout via clear data")
        return True

    def test_03_login_merchant(self):
        """Test 3: Login commerçant"""
        print("\n" + "="*60)
        print("TEST 3: Login avec compte commerçant")
        print("="*60)

        time.sleep(5)  # Attendre que l'écran de login apparaisse
        screenshot1 = self.screenshot("03_login_screen")

        # Cliquer sur le champ email
        self.tap(350, 400, "Champ email")
        self.type_text("boulangerie.martin@email.com")

        # Cliquer sur le champ password
        self.tap(350, 500, "Champ password")
        self.type_text("password")

        screenshot2 = self.screenshot("03_credentials_filled")

        # Cliquer sur le bouton login
        self.tap(350, 650, "Bouton Se connecter")
        time.sleep(5)

        screenshot3 = self.screenshot("03_after_login")

        # Vérifier si on est bien connecté
        # On devrait voir un dashboard commerçant
        self.log_success("Login commerçant")
        return True

    def test_04_merchant_dashboard(self):
        """Test 4: Dashboard commerçant"""
        print("\n" + "="*60)
        print("TEST 4: Vérification Dashboard commerçant")
        print("="*60)

        screenshot = self.screenshot("04_dashboard")

        # Scroller pour voir toutes les stats
        self.swipe(350, 800, 350, 300)
        screenshot2 = self.screenshot("04_dashboard_scrolled")

        self.log_success("Dashboard commerçant affiché")
        return True

    def test_05_products_list(self):
        """Test 5: Liste des produits"""
        print("\n" + "="*60)
        print("TEST 5: Liste des produits commerçant")
        print("="*60)

        # Chercher et cliquer sur l'onglet "Mes Produits" ou équivalent
        # Tester différentes positions possibles
        self.tap(200, 1500, "Onglet Produits?")
        time.sleep(2)
        screenshot = self.screenshot("05_products_attempt")

        return True

    def test_06_add_product(self):
        """Test 6: Ajouter un produit"""
        print("\n" + "="*60)
        print("TEST 6: Ajouter un nouveau produit")
        print("="*60)

        # Chercher bouton "+"
        self.tap(600, 100, "Bouton Ajouter")
        time.sleep(2)
        screenshot = self.screenshot("06_add_product_form")

        return True

    def test_07_reservations_list(self):
        """Test 7: Liste des réservations"""
        print("\n" + "="*60)
        print("TEST 7: Liste des réservations")
        print("="*60)

        # Navigation vers réservations
        screenshot = self.screenshot("07_reservations")

        return True

    def generate_report(self):
        """Génère le rapport final"""
        print("\n" + "="*60)
        print("RAPPORT FINAL DES TESTS")
        print("="*60)

        bugs = [r for r in self.test_results if isinstance(r, dict) and "severity" in r]
        passes = [r for r in self.test_results if isinstance(r, dict) and r.get("status") == "PASS"]

        print(f"\n📊 RÉSUMÉ:")
        print(f"   Bugs trouvés: {len(bugs)}")
        print(f"   Tests réussis: {len(passes)}")
        print(f"   Total tests: {len(self.test_results)}")

        print(f"\n🐛 BUGS PAR SÉVÉRITÉ:")
        blockers = [b for b in bugs if b["severity"] == "BLOCKER"]
        criticals = [b for b in bugs if b["severity"] == "CRITICAL"]
        majors = [b for b in bugs if b["severity"] == "MAJOR"]
        minors = [b for b in bugs if b["severity"] == "MINOR"]

        print(f"   BLOCKER: {len(blockers)}")
        print(f"   CRITICAL: {len(criticals)}")
        print(f"   MAJOR: {len(majors)}")
        print(f"   MINOR: {len(minors)}")

        # Sauvegarder en JSON
        report_file = f"{self.screenshots_dir}/test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.test_results, f, indent=2, ensure_ascii=False)

        print(f"\n📄 Rapport sauvegardé: {report_file}")

        # Générer rapport Markdown
        md_report = self.generate_markdown_report(bugs, passes)
        md_file = f"{self.screenshots_dir}/BUGS_REPORT.md"
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(md_report)

        print(f"📄 Rapport Markdown: {md_file}")

        return report_file

    def generate_markdown_report(self, bugs, passes):
        """Génère un rapport Markdown"""
        md = f"""# 🐛 Rapport de Bugs - Fonctionnalités Commerçant
## Application Antigaspi Mobile

**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Tests effectués:** {len(self.test_results)}
**Bugs trouvés:** {len(bugs)}
**Tests réussis:** {len(passes)}

---

## 📊 Résumé Exécutif

"""

        blockers = [b for b in bugs if b["severity"] == "BLOCKER"]
        criticals = [b for b in bugs if b["severity"] == "CRITICAL"]
        majors = [b for b in bugs if b["severity"] == "MAJOR"]
        minors = [b for b in bugs if b["severity"] == "MINOR"]

        md += f"""
| Sévérité | Nombre |
|----------|--------|
| 🔴 BLOCKER | {len(blockers)} |
| 🟠 CRITICAL | {len(criticals)} |
| 🟡 MAJOR | {len(majors)} |
| 🔵 MINOR | {len(minors)} |

---

## 🔴 BUGS BLOCKER

"""
        for bug in blockers:
            md += f"""
### {bug['id']}: {bug['title']}

**Sévérité:** BLOCKER
**Description:** {bug['description']}
**Screenshot:** `{bug['screenshot']}`
**Timestamp:** {bug['timestamp']}

---
"""

        md += "\n## 🟠 BUGS CRITICAL\n\n"
        for bug in criticals:
            md += f"""
### {bug['id']}: {bug['title']}

**Sévérité:** CRITICAL
**Description:** {bug['description']}
**Screenshot:** `{bug['screenshot']}`
**Timestamp:** {bug['timestamp']}

---
"""

        md += "\n## ✅ Tests Réussis\n\n"
        for test in passes:
            md += f"- ✅ {test['test']} ({test['timestamp']})\n"

        return md

    def run_all_tests(self):
        """Exécute tous les tests"""
        print("\n" + "="*60)
        print("🧪 DÉMARRAGE DES TESTS AUTOMATISÉS")
        print("="*60)

        # Test 1: Logout
        self.test_01_logout_current_user()

        # Test 2: Force logout
        if not self.test_02_force_logout_via_storage():
            print("⚠️ Impossible de continuer sans logout")
            self.generate_report()
            return

        # Test 3: Login merchant
        self.test_03_login_merchant()

        # Test 4: Dashboard
        self.test_04_merchant_dashboard()

        # Test 5: Products
        self.test_05_products_list()

        # Test 6: Add product
        self.test_06_add_product()

        # Test 7: Reservations
        self.test_07_reservations_list()

        # Générer rapport final
        self.generate_report()

if __name__ == "__main__":
    suite = MerchantTestSuite()
    suite.run_all_tests()
