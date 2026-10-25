import { create, reply, checkOrigin } from "@/lib/rooms";
export async function POST(request:Request){try{checkOrigin(request);const b=await request.json() as Record<string,unknown>;if(!b||typeof b!=="object")throw new Error("Please provide a callsign.");return reply(await create(b.name));}catch(e){return reply({error:e instanceof Error?e.message:"Could not create the room."},400);}}
