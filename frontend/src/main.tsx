import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0a0f',
      paper: '#15131d',
    },
    primary: {
      main: '#7c3aed',
      light: '#a78bfa',
    },
    secondary: {
      main: '#c084fc',
    },
    text: {
      primary: '#f0eefc',
      secondary: 'rgba(240, 238, 252, 0.6)',
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
