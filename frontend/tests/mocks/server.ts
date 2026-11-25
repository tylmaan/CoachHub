import { setupServer } from 'msw/node'

export const API = 'http://localhost:5006/api'

export const server = setupServer()
