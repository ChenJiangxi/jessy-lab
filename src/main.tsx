import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Admin from './routes/Admin';
import V2 from './routes/V2';
import Placeholder from './routes/Placeholder';
import Projects from './routes/Projects';
import Arts from './routes/Arts';
import './styles.css';

/** /research is just a hard redirect to the academic homepage —
 *  no in-app placeholder needed. */
function ResearchRedirect() {
  useEffect(() => {
    window.location.replace('https://chenjiangxi.github.io/home-page/');
  }, []);
  return null;
}

const router = createBrowserRouter([
  { path: '/', element: <V2 /> },
  { path: '/projects', element: <Projects /> },
  { path: '/arts', element: <Arts /> },
  { path: '/research', element: <ResearchRedirect /> },
  {
    path: '/contact',
    element: (
      <Placeholder
        title="Contact"
        subtitle="// 想聊点什么"
        links={[
          {
            label: '学术 · chen731925@sjtu.edu.cn',
            url: 'mailto:chen731925@sjtu.edu.cn',
          },
          {
            label: '创业合作 · jiangxi_chen@163.com',
            url: 'mailto:jiangxi_chen@163.com',
          },
          {
            label: 'GitHub · @ChenJiangxi',
            url: 'https://github.com/ChenJiangxi',
          },
        ]}
      />
    ),
  },
  { path: '/admin', element: <Admin /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
