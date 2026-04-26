import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Minimal from './routes/Minimal';
import Admin from './routes/Admin';
import V2 from './routes/V2';
import Placeholder from './routes/Placeholder';
import Projects from './routes/Projects';
import './styles.css';

const router = createBrowserRouter([
  { path: '/', element: <V2 /> },
  { path: '/projects', element: <Projects /> },
  {
    path: '/research',
    element: (
      <Placeholder
        title="Research"
        subtitle="// Deep RL · GNN · 智能运维 · Quantitative Finance"
        links={[
          {
            label: '学术主页',
            url: 'https://chenjiangxi.github.io/home-page/',
            description: '论文 / 简历 / 合作邮箱',
          },
        ]}
      />
    ),
  },
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
  { path: '/minimal', element: <Minimal /> },
  { path: '/admin', element: <Admin /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
