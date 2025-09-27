// Debug script - Run this in browser console to check token
console.log('=== TOKEN DEBUGGING ===')

// Check localStorage
const token = localStorage.getItem('auth_token')
console.log('Token from localStorage:', token)

if (token) {
  console.log('Token length:', token.length)

  // Try to decode JWT payload (middle part)
  try {
    const parts = token.split('.')
    console.log('JWT parts count:', parts.length)

    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]))
      console.log('JWT payload:', payload)

      // Check expiration
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000)
        const now = new Date()
        console.log('Token expires at:', expDate)
        console.log('Current time:', now)
        console.log('Token is expired:', now > expDate)
      }
    } else {
      console.error('Invalid JWT format - should have 3 parts separated by dots')
    }
  } catch (e) {
    console.error('Failed to decode JWT:', e.message)
  }
} else {
  console.log('No token found in localStorage')
}

// Check if user data exists
const userData = localStorage.getItem('user_data')
console.log('User data:', userData)

console.log('=== END DEBUG ===')
