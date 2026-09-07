import {Game,type Item} from './game';
type Tool={name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
type Context={registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
export function registerGameTools(game:Game){
  const context=(document as Document&{modelContext?:Context}).modelContext;if(!context?.registerTool)return()=>{};
  const lifecycle=new AbortController();
  const tools:Tool[]=[{
    name:'read_expedition',description:'Read the current world, inventory, survival stats, research era and visitor status.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>({world:game.state.name,seed:game.state.seed,player:{...game.state.player},inventory:{...game.state.inventory},era:game.state.tech,visitor:game.readOnly}),
  },{
    name:'craft_field_item',description:'Handcraft one coal, concentrate, gear, circuit or research item using the same recipes as the crafting menu. Consumes materials on success.',inputSchema:{type:'object',properties:{item:{type:'string',enum:['coal','concentrate','gear','circuit','science']}},required:['item'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{
      if(!input||typeof input!=='object'||Object.keys(input).length!==1||!('item'in input)||!['coal','concentrate','gear','circuit','science'].includes(String(input.item)))throw new Error('Choose a valid craftable item.');
      if(game.readOnly)throw new Error('Visitors cannot craft in another explorer’s world.');const item=input.item as Item,before=game.state.inventory[item];game.craft(item);if(game.state.inventory[item]===before)throw new Error('Insufficient materials or required research is locked.');return{crafted:item,count:1,inventory:{...game.state.inventory}};
    },
  }];
  for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Unsupported experimental implementations must not interrupt play. */}}
  return()=>lifecycle.abort();
}
