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
    // 1. 生成客户ID和适配 clients 表的默认客户信息
    const clientId = uuidv4();
    const clientData = {
      id: clientId,
      client_no: `C${Date.now().toString().slice(-8)}`, // 生成唯一客户编号（C+时间戳后8位）
      client_type: '普通客户', // 默认客户类型
      name: `默认客户_${clientId.slice(0, 8)}`, // 客户名称（UUID前8位）
      contact_person: '未知联系人', // 对应表的 contact_person 字段
      contact_phone: '未知电话', // 对应表的 contact_phone 字段
      contact_email: null,
      address: null,
      tax_no: null,
      bank_info: null,
      remark: '订单创建时自动生成的默认客户',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system' // 系统自动创建
    };

    // 2. 先插入客户记录（适配你的 clients 表结构）
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

    // 4. 插入订单（使用刚创建的客户ID，满足外键约束）
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          ...orderData,
          client_id: clientId, // 关联自动生成的客户ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false,
          deleted_at: null
        }
      ])
      .select();

    if (error) throw new Error(`插入订单失败: ${error.message}`);

    // 5. 返回成功结果（包含订单和客户信息）
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