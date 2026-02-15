// api/order/restore.js
import supabase from '../supabase.js';

/**
 * 恢复已删除订单接口
 * 请求方式：POST
 * 请求参数：order_no（订单号，必填）
 */
export default async function handler(req, res) {
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '仅支持 POST 请求'
    });
  }

  // 校验必填参数
  const { order_no } = req.body;
  if (!order_no) {
    return res.status(400).json({
      success: false,
      message: '订单号（order_no）不能为空'
    });
  }

  try {
    // 恢复订单：取消删除标记，清空删除时间
    const { data, error } = await supabase
      .from('orders')
      .update({
        is_deleted: false,
        deleted_at: null,
        updated_at: new Date()
      })
      .eq('order_no', order_no)
      .eq('is_deleted', true) // 只恢复已删除的订单
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: `未找到已删除的订单 ${order_no}（或该订单未被删除）`
      });
    }

    return res.status(200).json({
      success: true,
      message: `订单 ${order_no} 已成功恢复`,
      data: {
        order_no: data[0].order_no,
        updated_at: data[0].updated_at
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '恢复失败：' + error.message
    });
  }
}