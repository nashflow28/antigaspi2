#!/usr/bin/env python3
"""
Test MCP - Navigation avec content-desc (accessibilityLabel)
React Native n'exporte pas testID comme resource-id, on utilise content-desc
"""

import sys
import time

def log(message):
    """Log avec timestamp"""
    print(f"[{time.strftime('%H:%M:%S')}] {message}")

def main():
    log("Demarrage du test de navigation")

    # Elements trouves dans le dump hierarchy
    elements_found = [
        {"type": "Tab Bar", "content-desc": ", Tableau de bord", "bounds": "[0,2268][180,2411]"},
        {"type": "Tab Bar", "content-desc": ", Mes Produits", "bounds": "[180,2268][360,2411]"},
        {"type": "Tab Bar", "content-desc": ", Reservations", "bounds": "[360,2268][540,2411]", "selected": True},
        {"type": "Tab Bar", "content-desc": ", Avis", "bounds": "[540,2268][720,2411]"},
        {"type": "Tab Bar", "content-desc": ", Fidelite", "bounds": "[720,2268][900,2411]"},
        {"type": "Tab Bar", "content-desc": ", Compte", "bounds": "[900,2268][1080,2411]"},

        {"type": "Filter", "content-desc": "Toutes", "bounds": "[53,294][251,387]"},
        {"type": "Filter", "content-desc": "En attente", "bounds": "[272,294][524,387]"},
        {"type": "Filter", "content-desc": "Confirmees", "bounds": "[545,294][821,387]"},
        {"type": "Filter", "content-desc": "Terminees", "bounds": "[842,294][1028,387]"},
    ]

    log("\nElements trouves dans la hierarchie UI:\n")
    for elem in elements_found:
        selected = " [SELECTED]" if elem.get("selected") else ""
        log(f"  - {elem['type']:12} : {elem['content-desc']:25} @ {elem['bounds']}{selected}")

    log("\nCONCLUSION:")
    log("  React Native N'EXPORTE PAS les testID comme resource-id")
    log("  Tous les resource-id sont vides ('')")
    log("  SOLUTION: Utiliser content-desc (accessibilityLabel) pour les tests")

    log("\nRECOMMANDATION:")
    log("  1. Ajouter accessibilityLabel a TOUS les elements interactifs")
    log("  2. Utiliser content-desc au lieu de resource-id dans les tests MCP")
    log("  3. Les testID restent utiles pour React Testing Library")

    return 0

if __name__ == "__main__":
    sys.exit(main())
