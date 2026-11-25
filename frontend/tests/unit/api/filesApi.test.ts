import { http, HttpResponse } from 'msw'
import { uploadFile } from '@/api/filesApi'
import { API, server } from '../../mocks/server'

describe('uploadFile', () => {
  it('posts the file as multipart form data and returns the stored url', async () => {
    let contentType: string | null = null
    let rawBody = ''
    server.use(
      http.post(`${API}/files/upload`, async ({ request }) => {
        contentType = request.headers.get('content-type')
        rawBody = await request.text()
        return HttpResponse.json({ url: '/uploads/abc.png' })
      }),
    )

    const url = await uploadFile(new File(['hello'], 'photo.png', { type: 'image/png' }))

    expect(url).toBe('/uploads/abc.png')
    expect(contentType).toContain('multipart/form-data')
    expect(rawBody).toContain('name="file"')
    expect(rawBody).toContain('filename="photo.png"')
    expect(rawBody).toContain('hello')
  })

  it('rejects when the backend refuses the file', async () => {
    server.use(http.post(`${API}/files/upload`, () => HttpResponse.json('Plik jest za duży (max 5MB).', { status: 400 })))

    await expect(uploadFile(new File(['x'], 'big.png'))).rejects.toMatchObject({ response: { status: 400 } })
  })
})
