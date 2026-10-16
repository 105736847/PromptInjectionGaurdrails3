/**
 * assignmentProject.js – a small hierarchy: the folders and files of an
 * Assignment 3 project (React front-end + FastAPI back-end + ML model).
 * Only the leaves (files) have a `size` in kB – d3.hierarchy(data).sum()
 * adds them up so every folder knows its total.
 */
export const assignmentProject = {
  name: 'ml-web-app',
  children: [
    {
      name: 'frontend',
      children: [
        { name: 'pages', children: [{ name: 'Home.jsx', size: 4 }, { name: 'Predict.jsx', size: 9 }, { name: 'Results.jsx', size: 7 }] },
        { name: 'components', children: [{ name: 'Chart.jsx', size: 11 }, { name: 'Form.jsx', size: 6 }, { name: 'NavBar.jsx', size: 3 }] },
        { name: 'App.jsx', size: 3 },
      ],
    },
    {
      name: 'backend',
      children: [
        { name: 'main.py', size: 5 },
        { name: 'routes', children: [{ name: 'predict.py', size: 6 }, { name: 'health.py', size: 1 }] },
        { name: 'model', children: [{ name: 'train.py', size: 8 }, { name: 'model.pkl', size: 16 }] },
      ],
    },
    { name: 'data', children: [{ name: 'raw.csv', size: 14 }, { name: 'clean.csv', size: 10 }] },
  ],
};
