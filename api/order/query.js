// api/order/query.js
import supabase from '../supabase.js';

export default async function handler(req, res) {
  // 1. 支持 GET/POST 请求（GET 从 query 取参数，POST 从 body 取）
  const queryParams = req.method === 'GET' ? req.query : req.body;

  try {
    // 2. 构建查询条件
    let query = supabase.from('orders').select('*', { count: 'exact' });

    // 按订单号精确查询
    if (queryParams.order_no) {
      query = query.eq('order_no', queryParams.order_no);
    }
    // 按客户ID查询
    if (queryParams.client_id) {
      query = query.eq('client_id', queryParams.client_id);
    }
    // 按订单状态查询
    if (queryParams.order_status) {
      query = query.eq('order_status', queryParams.order_status);
    }
    // 按港口模糊查询
    if (queryParams.pol) {
      query = query.ilike('pol', `%${queryParams.pol}%`);
    }
    if (queryParams.pod) {
      query = query.ilike('pod', `%${queryParams.pod}%`);
    }
    // 分页
    if (queryParams.page && queryParams.pageSize) {
      const offset = (queryParams.page - 1) * queryParams.pageSize;
      query = query.range(offset, offset + Number(queryParams.pageSize) - 1);
    }

    // 3. 执行查询
    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // 4. 返回结果
    return res.status(200).json({
      success: true,
      message: '查询订单成功',
      data: {
        list: data,
        total: count,
        page: Number(queryParams.page) || 1,
        pageSize: Number(queryParams.pageSize) || 10
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `查询订单失败：${err.message}`,
      data: null
    });
  }
}