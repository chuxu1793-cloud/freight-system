// api/order/update.js
import { createClient } from '../supabase.js';

/**
 * 更新订单状态接口
 * 请求方式：POST
 * 请求参数：order_no（订单号，必填）、order_status（新状态，必填）
 * 支持的状态：已订舱、已装船、已到港、已签收、已取消
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
  const { order_no, order_status } = req.body;
  if (!order_no || !order_status) {
    return res.status(400).json({
      success: false,
      message: '参数错误：订单号（order_no）和状态（order_status）不能为空'
    });
  }

  // 4. 校验状态合法性（可选，规范业务状态）
  const validStatus = ['已订舱', '已装船', '已到港', '已签收', '已取消'];
  if (!validStatus.includes(order_status)) {
    return res.status(400).json({
      success: false,
      message: `状态不合法，仅支持：${validStatus.join('、')}`
    });
  }

  try {
    // 5. 连接 Supabase 并更新订单
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders') // 操作 orders 表
      .update({
        order_status,
        updated_at: new Date() // 记录更新时间
      })
      .eq('order_no', order_no) // 按订单号精准更新
      .select(); // 返回更新后的订单数据

    if (error) throw error;

    // 6. 处理更新结果
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: `未找到订单号为 ${order_no} 的订单`
      });
    }

    return res.status(200).json({
      success: true,
      message: `订单 ${order_no} 状态已更新为：${order_status}`,
      data: data[0] // 返回更新后的订单详情
    });
  } catch (error) {
    // 7. 异常处理
    return res.status(500).json({
      success: false,
      message: '服务器错误：' + error.message
    });
  }
}