// api/supabase.js
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端（从 Vercel 环境变量读取密钥）
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export default supabase;