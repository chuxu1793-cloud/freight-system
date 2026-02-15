// api/order/create.js
import supabase from '../supabase.js';

export default async function handler(req, res) {
  // 处理 OPTIONS 预检请求（解决跨域）
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // 限制请求方法为 POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '仅支持 POST 请求'
    });
  }

  try {
    const orderData = req.body;

    // 校验必填字段（货代核心字段）
    const requiredFields = ['order_no', 'client_id', 'freight_type', 'pol', 'pod', 'goods_name', 'freight', 'total_amount', 'currency', 'order_status'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段：${missingFields.join(', ')}`
      });
    }

    // 插入订单到 Supabase（补充软删除字段默认值）
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          ...orderData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false, // 默认未删除
          deleted_at: null   // 默认无删除时间
        }
      ])
      .select();

    if (error) {
      throw new Error(`Supabase 插入失败: ${error.message}`);
    }

    // 返回成功结果（201 更符合 RESTful 规范）
    return res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: data[0]
    });
  } catch (err) {
    // 打印详细错误日志到 Vercel，方便排查
    console.error('CREATE ORDER ERROR:', {
      message: err.message,
      stack: err.stack,
      requestBody: req.body
    });

    return res.status(500).json({
      success: false,
      message: `创建订单失败：${err.message}`,
      data: null
    });
  }
}