// api/order/create.js
import supabase from '../supabase.js';
const uuidv4 = require('uuid/v4');

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
    // 1. 生成客户ID和默认客户信息
    const clientId = uuidv4();
    const clientData = {
      id: clientId,
      name: `默认客户_${clientId.slice(0, 8)}`, // 截取UUID前8位做客户名，易识别
      contact: '未知联系人',
      phone: '未知电话',
      created_at: new Date().toISOString()
    };

    // 2. 先插入客户记录（解决外键约束）
    const { error: clientError } = await supabase
      .from('clients')
      .insert([clientData]);
    
    if (clientError) throw new Error(`创建客户失败: ${clientError.message}`);

    // 3. 校验订单必填字段
    const requiredFields = ['order_no', 'freight_type', 'pol', 'pod', 'goods_name', 'freight', 'total_amount', 'currency', 'order_status'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段：${missingFields.join(', ')}`
      });
    }

    // 4. 插入订单（使用刚创建的客户ID）
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          ...orderData,
          client_id: clientId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false,
          deleted_at: null
        }
      ])
      .select();

    if (error) throw new Error(`插入订单失败: ${error.message}`);

    // 5. 返回成功结果（包含客户信息）
    return res.status(201).json({
      success: true,
      message: '订单创建成功（已自动创建关联客户）',
      data: {
        order: data[0],
        client: clientData
      }
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