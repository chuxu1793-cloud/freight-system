// api/order/query.js
import supabase from '../supabase.js';

export default async function handler(req, res) {
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
    let baseQuery = supabase.from('orders').select('*', { count: 'exact' }); // 在 select 时就带上 count

    if (show_deleted !== 'true') {
      baseQuery = baseQuery.eq('is_deleted', false);
    }

    // 先执行查询，获取数据和 count
    const { data, error, count } = await baseQuery
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: '查询订单成功',
      data: {
        list: data || [],
        total: count || 0
      }
    });
  } catch (error) {
    console.error('QUERY ERROR:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: '查询失败：' + error.message
    });
  }
}