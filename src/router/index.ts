import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory, type Router
} from 'vue-router';
import routes from './routes';
import { useUserStore } from 'stores/user-store';

let routerInstance: Router | null = null;

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to) => {
    const store = useUserStore();
    //store.loadData();
    if (!store.token && to.name!='home' && to.name!='404') {
      // 将用户重定向到登录页面
      return { name: 'home' }
    }
  });

  routerInstance = Router;

  return Router;
});

export function useRouterInstance() {
  if (!routerInstance) {
    throw new Error('Router instance is not initialized yet')
  }
  return routerInstance;
}
