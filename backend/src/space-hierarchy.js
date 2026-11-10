// El espacio completo ocupa sus divisiones; dos divisiones distintas no se
// consideran el mismo espacio por compartir padre. No se hereda equipamiento.
export function spaceHierarchy(aulas){
 const rooms=new Map(aulas.map(a=>[a.id_aula,a])),ancestors=new Map(),invalid=new Set()
 for(const room of aulas){
  const path=new Set([room.id_aula]);let current=room
  while(current.id_espacio_padre!==null&&current.id_espacio_padre!==undefined){
   const parent=rooms.get(current.id_espacio_padre)
   if(!parent||path.has(parent.id_aula)){invalid.add(room.id_aula);break}
   path.add(parent.id_aula);current=parent
  }
  ancestors.set(room.id_aula,path)
 }
 return {invalid:[...invalid],sharedSpace:(a,b)=>a===b?a:ancestors.get(a)?.has(b)?b:ancestors.get(b)?.has(a)?a:null}
}
