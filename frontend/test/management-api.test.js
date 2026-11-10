import {afterEach,expect,test,vi} from 'vitest'
import {api} from '../src/services/management'
const mocks=vi.hoisted(()=>({getSession:vi.fn()}))
vi.mock('../src/lib/supabase',()=>({supabase:{auth:{getSession:mocks.getSession}}}))
afterEach(()=>{vi.unstubAllGlobals();mocks.getSession.mockReset()})
function session(){mocks.getSession.mockResolvedValue({data:{session:{access_token:'prueba'}},error:null})}
test.each([401,403,503])('Las respuestas HTTP conservan el estado %s',async status=>{
 session();vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({error:'Respuesta de prueba'},{status})))
 await expect(api('/workspace')).rejects.toMatchObject({status})
})
test('Un fallo de red se distingue de una sesión inexistente',async()=>{
 session();vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('Sin conexión')))
 await expect(api('/workspace')).rejects.toMatchObject({status:503})
 mocks.getSession.mockResolvedValue({data:{session:null},error:null})
 await expect(api('/workspace')).rejects.toMatchObject({status:401})
 expect(fetch).toHaveBeenCalledTimes(1)
})
