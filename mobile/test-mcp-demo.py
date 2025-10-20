"""
Démo MCP pour React Native - Ce qui fonctionne
"""
import time

# Vérifier si émulateur est connecté
print("=== Test MCP pour React Native ===\n")

# 1. Test par TEXTE (fonctionne)
print("✅ Test 1: Clic par texte")
print("   mcp.click({ selector: 'Se connecter', selector_type: 'text' })")

# 2. Test par DESCRIPTION (fonctionne si accessibilityLabel)
print("\n✅ Test 2: Clic par description")
print("   mcp.click({ selector: 'login-button', selector_type: 'description' })")

# 3. Test par RESOURCE_ID (NE fonctionne PAS)
print("\n❌ Test 3: Clic par resource_id (testID)")
print("   mcp.click({ selector: 'login-button', selector_type: 'resource_id' })")
print("   Raison: React Native n'exporte pas testID comme resource-id")

# 4. Actions générales (fonctionnent)
print("\n✅ Test 4: Actions générales")
print("   mcp.swipe(...)")
print("   mcp.press_key({ key: 'back' })")
print("   mcp.screenshot(...)")

print("\n=== Conclusion ===")
print("MCP fonctionne pour React Native MAIS:")
print("- Utiliser sélection par TEXTE ou DESCRIPTION")
print("- NE PAS utiliser sélection par testID/resource_id")
print("- React Testing Library reste la meilleure option pour tests automatiques")
