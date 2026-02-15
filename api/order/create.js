// api/order/create.js
import supabase from '../supabase.js';
const uuidv4 = require('uuid/v4'); // 改用 CommonJS 导入

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

  try {
    const orderData = req.body;

    // 1. 自动生成 client_id（覆盖前端传的任何值）
    const clientId = uuidv4();

    // 2. 校验必填字段（移除 client_id，因为后端自动生成）
    const requiredFields = ['order_no', 'freight_type', 'pol', 'pod', 'goods_name', 'freight', 'total_amount', 'currency', 'order_status'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段：${missingFields.join(', ')}`
      });
    }

    // 3. 插入订单（使用后端生成的 client_id）
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          ...orderData,
          client_id: clientId, // 强制使用后端生成的ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false,
          deleted_at: null
        }
      ])
      .select();

    if (error) throw new Error(`Supabase 插入失败: ${error.message}`);

    // 4. 返回包含自动生成 client_id 的结果
    return res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: data[0]
    });
  } catch (err) {
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