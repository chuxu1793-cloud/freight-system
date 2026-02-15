// api/order/query.js
import supabase from '../supabase.js';

/**
 * 查询订单接口（优化版）
 * 请求方式：GET
 * 可选参数：?show_deleted=true（显示所有订单，包括已删除）
 */
export default async function handler(req, res) {
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '仅支持 GET 请求'
    });
  }

  try {
    // 获取查询参数：show_deleted=true 显示所有订单
    const { show_deleted } = req.query;
    let query = supabase.from('orders').select('*');

    // 默认过滤已删除订单，show_deleted=true 时显示所有
    if (show_deleted !== 'true') {
      query = query.eq('is_deleted', false);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false }) // 按创建时间倒序
      .count('exact'); // 返回总条数

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: '查询订单成功',
      data: {
        list: data || [],
        total: count || 0
      }
    });
  }catch (error) {
    // 打印完整错误信息到 Vercel 日志，方便排查
    console.error('Query API Error:', {
        message: error.message,
        stack: error.stack,
        supabaseUrl: !!process.env.SUPABASE_URL, // 检查 URL 是否存在
        supabaseKey: !!process.env.SUPABASE_SERVICE_KEY || !!process.env.SUPABASE_ANON_KEY // 检查密钥是否存在
    });
    
    return res.status(500).json({
        success: false,
        message: '查询失败：' + error.message,
        // 开发环境返回完整错误，方便调试
        debug: {
        hasUrl: !!process.env.SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_KEY || !!process.env.SUPABASE_ANON_KEY
        }
    });
    }
}