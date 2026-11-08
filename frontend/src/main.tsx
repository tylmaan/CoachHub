import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import 'flag-icons/css/flag-icons.min.css'
import '@fontsource-variable/inter'

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
  typography: {
    fontFamily: '"Inter Variable", system-ui, -apple-system, "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px' },
    h5: { fontWeight: 600, letterSpacing: '-0.3px' },
    h6: { fontWeight: 600, letterSpacing: '-0.2px' },
    button: { textTransform: 'none', fontWeight: 600 }, 
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { fontVariableNumeric: 'tabular-nums' },
      },
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
