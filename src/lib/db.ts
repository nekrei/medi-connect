import 'server-only';

import { neon, Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { env } from '@/lib/env'; 


export const sql = neon(env.DATABASE_URL);

neonConfig.webSocketConstructor = ws;
export const pool = new Pool({ connectionString: env.DATABASE_URL });