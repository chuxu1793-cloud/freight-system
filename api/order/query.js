// api/order/query.js
import supabase from '../supabase.js';

export default async function handler(req, res) {
  // 先打印环境变量，确认它们在函数执行时可用
  console.log('ENV CHECK:', {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY
  });

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '仅支持 GET 请求' });
  }

  try {
    const { show_deleted } = req.query;
    let query = supabase.from('orders').select('*');

    if (show_deleted !== 'true') {
      query = query.eq('is_deleted', false);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .count('exact');

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: '查询订单成功',
      data: { list: data || [], total: count || 0 }
    });
  } catch (error) {
    console.error('QUERY ERROR:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: '查询失败：' + error.message,
      stack: error.stack
    });
  }
}