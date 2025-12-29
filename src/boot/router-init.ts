// src/boot/router-init.ts
import { boot } from 'quasar/wrappers';
import { useRouterInstance } from 'src/router';

export default boot(() => {
  // 这里不需要额外操作，只需确保 router 已初始化
  const router = useRouterInstance();
  // 可以添加全局路由守卫等
  router.beforeEach((to, from, next) => {
    // 全局路由守卫逻辑
    next();
  })
})
