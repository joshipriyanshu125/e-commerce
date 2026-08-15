import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { store } from './app/store'
import App from './App'
import ErrorBoundary from './components/common/ErrorBoundary'
import './styles/globals.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ErrorBoundary><Provider store={store}><App /></Provider></ErrorBoundary>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
