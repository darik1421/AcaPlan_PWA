import {afterEach,expect,test,vi} from 'vitest'
import {getProfile} from '../src/services/session'
vi.mock('../src/lib/supabase',()=>({supabase:null}))
afterEach(()=>vi.unstubAllGlobals())
test.each([401,403])('Conserva el estado %s para distinguir una denegación de un fallo temporal',async status=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({error:'Acceso denegado'},{status})))
 await expect(getProfile('prueba')).rejects.toMatchObject({status,message:'Acceso denegado'})
})
test.each([{}, {profile:null}, {profile:[]}])('Una respuesta incompleta no habilita un perfil (%j)',async body=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json(body)))
 await expect(getProfile('prueba')).rejects.toMatchObject({status:503})
})
