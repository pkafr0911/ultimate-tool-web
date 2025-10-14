import { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

async function getFakeCaptcha(req: Request, res: Response) {
  await waitTime(2000);
  return res.json('captcha-xxx');
}

const { ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION } = process.env;

/**
 * 当前用户的权限，如果为空代表没登录
 * current user access， if is '', user need login
 * 如果是 pro 的预览，默认是有权限的
 */
let access = ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site' ? 'admin' : '';

const getAccess = () => {
  return access;
};

// 代码中会兼容本地 service mock 以及部署站点的静态数据
export default {
  // 支持值为 Object 和 Array
  'GET /api/currentUser': (req: Request, res: Response) => {
    if (!getAccess()) {
      res.status(401).send({
        data: {
          isLogin: false,
        },
        errorCode: '401',
        errorMessage: '请先登录！',
        success: true,
      });
      return;
    }
    res.send({
      success: true,
      data: {
        ////example
        // name: 'Serati Ma',
        // avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
        // userid: '00000001',
        // email: 'antdesign@alipay.com',
        // signature: '海纳百川，有容乃大',
        // title: '交互专家',
        // group: '蚂蚁金服－某某某事业群－某某平台部－某某技术部－UED',
        // tags: [
        //   {
        //     key: '0',
        //     label: '很有想法的',
        //   },
        //   {
        //     key: '1',
        //     label: '专注设计',
        //   },
        //   {
        //     key: '2',
        //     label: '辣~',
        //   },
        //   {
        //     key: '3',
        //     label: '大长腿',
        //   },
        //   {
        //     key: '4',
        //     label: '川妹子',
        //   },
        //   {
        //     key: '5',
        //     label: '海纳百川',
        //   },
        // ],
        // notifyCount: 12,
        // unreadCount: 11,
        // country: 'China',
        // access: getAccess(),
        // geographic: {
        //   province: {
        //     label: '浙江省',
        //     key: '330000',
        //   },
        //   city: {
        //     label: '杭州市',
        //     key: '330100',
        //   },
        // },
        // address: '西湖区工专路 77 号',
        // phone: '0752-268888888',

        //super admin
        id: 'cdaef415-d03f-4f53-8ac9-e4dddd6cf1cd',
        full_name: 'Nguyễn Đức Thành',
        created_at: 1740037505627,
        created_by: 'cdaef415-d03f-4f53-8ac9-e4dddd6cf1cd',
        last_updated_at: 1740037505627,
        last_updated_by: 'cdaef415-d03f-4f53-8ac9-e4dddd6cf1cd',
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        username: 'thanhnd1',
        email: 'thanhnd1@viettelidc.com.vn',
        phone_number: '0987654321',
        role_id: 1,
        active: true,
        locked_to: null,
        twofa_status: false,
        twofa_had_inactive: true,
        twofa_url: '',

        ////admin
        // id: '20dad90b-8a79-4e1e-8c90-f052fa4c5625',
        // full_name: 'Luu Van Loi Hehe2',
        // created_at: 1740040032720,
        // created_by: '48997922-64eb-49ca-a5d1-771dfc0f36df',
        // last_updated_at: 1740045434118,
        // last_updated_by: '48997922-64eb-49ca-a5d1-771dfc0f36df',
        // is_deleted: false,
        // deleted_at: null,
        // deleted_by: null,
        // username: 'loilv',
        // email: 'loilv@viettelidc.com.vn',
        // phone_number: '0964062210',
        // role_id: 2,
        // active: false,
        // locked_to: null,
        // twofa_status: false,
        // twofa_had_inactive: false,
        // twofa_url: '',
      },
    });
  },
  // GET POST 可省略
  'GET /api/users': [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sidney No. 1 Lake Park',
    },
  ],
  'POST /api/login/account': async (req: Request, res: Response) => {
    const { password, username, type } = req.body;
    await waitTime(2000);
    if (password === 'ant.design' && username === 'admin') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'admin',
      });
      access = 'admin';
      return;
    }
    if (password === 'ant.design' && username === 'user') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'user',
      });
      access = 'user';
      return;
    }
    if (type === 'mobile') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'admin',
      });
      access = 'admin';
      return;
    }

    res.send({
      status: 'error',
      type,
      currentAuthority: 'guest',
    });
    access = 'guest';
  },
  'POST /api/login/outLogin': (req: Request, res: Response) => {
    access = '';
    res.send({ data: {}, success: true });
  },
  'POST /api/register': (req: Request, res: Response) => {
    res.send({ status: 'ok', currentAuthority: 'user', success: true });
  },
  'GET /api/500': (req: Request, res: Response) => {
    res.status(500).send({
      timestamp: 1513932555104,
      status: 500,
      error: 'error',
      message: 'error',
      path: '/base/category/list',
    });
  },
  'GET /api/404': (req: Request, res: Response) => {
    res.status(404).send({
      timestamp: 1513932643431,
      status: 404,
      error: 'Not Found',
      message: 'No message available',
      path: '/base/category/list/2121212',
    });
  },
  'GET /api/403': (req: Request, res: Response) => {
    res.status(403).send({
      timestamp: 1513932555104,
      status: 403,
      error: 'Forbidden',
      message: 'Forbidden',
      path: '/base/category/list',
    });
  },
  'GET /api/401': (req: Request, res: Response) => {
    res.status(401).send({
      timestamp: 1513932555104,
      status: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
      path: '/base/category/list',
    });
  },

  'GET  /api/login/captcha': getFakeCaptcha,
};
