import { login, register } from '@/api/authApi'
import { mockApi } from '../../utils/mockApi'

const auth = { token: 'jwt', email: 'coach@test.local', roles: ['Coach'], teamId: 3 }

describe('authApi', () => {
  it('posts the credentials to /auth/login and returns the auth response', async () => {
    const captured = mockApi('post', '/auth/login', auth)

    const result = await login({ email: 'coach@test.local', password: 'Passw0rd!' })

    expect(captured.body).toEqual({ email: 'coach@test.local', password: 'Passw0rd!' })
    expect(result).toEqual(auth)
  })

  it('rejects when the credentials are wrong', async () => {
    mockApi('post', '/auth/login', undefined, 401)

    await expect(login({ email: 'x@test.local', password: 'bad' })).rejects.toMatchObject({
      response: { status: 401 },
    })
  })

  it('posts a registration to /auth/register and returns the auth response', async () => {
    const captured = mockApi('post', '/auth/register', auth)
    const request = {
      email: 'new@test.local',
      password: 'Passw0rd!',
      role: 'Analyst',
      teamId: 3,
      fullName: 'New Person',
      photoUrl: null,
    }

    const result = await register(request)

    expect(captured.body).toEqual(request)
    expect(result).toEqual(auth)
  })
})
