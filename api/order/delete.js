// api/order/delete.js
import supabase from '../supabase.js';

/**
 * 软删除订单接口（标记 is_deleted = true，不物理删除）
 * 请求方式：POST
 * 请求参数：order_no（订单号，必填）
 */
export default async function handler(req, res) {
  // 1. 处理浏览器 OPTIONS 预检请求（解决跨域）
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // 2. 限制请求方式为 POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '请求方式错误，仅支持 POST 请求'
    });
  }

  // 3. 校验必填参数
  const { order_no } = req.body;
  if (!order_no) {
    return res.status(400).json({
      success: false,
      message: '参数错误：订单号（order_no）不能为空'
    });
  }

  try {
    // 4. 软删除订单（标记 is_deleted = true，记录删除时间）
    const { data, error } = await supabase
      .from('orders')
      .update({
        is_deleted: true,        // 核心：标记删除
        deleted_at: new Date(),  // 记录删除时间
        updated_at: new Date()   // 更新最后操作时间
      })
      .eq('order_no', order_no)  // 按订单号精准删除
      .eq('is_deleted', false)   // 只删除未被标记的订单
      .select();                 // 返回删除后的订单数据

    if (error) throw error;

    // 5. 处理删除结果
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: `未找到订单号为 ${order_no} 的订单（或该订单已被删除）`
      });
    }

    return res.status(200).json({
      success: true,
      message: `订单 ${order_no} 已成功删除（软删除），可在后台恢复`,
      data: {
        order_no: data[0].order_no,
        deleted_at: data[0].deleted_at
      }
    });
  } catch (error) {
    // 6. 异常处理
    return res.status(500).json({
      success: false,
      message: '服务器错误：' + error.message
    });
  }
}