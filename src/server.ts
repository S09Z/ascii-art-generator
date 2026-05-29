import express from 'express';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/charsets', (_req, res) => {
  res.json([
    { label: 'Very Low', chars: '@#%*+=-:. ' },
    { label: 'Low', chars: '@%#*+=-:. ' },
    { label: 'Medium', chars: '@%#*+=-:. ' },
    { label: 'High', chars: '@%#*+=-:. ' },
    { label: 'Very High', chars: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^\`. ' },
  ]);
});

export { app };

if (import.meta.main) {
  const port = process.env.PORT ?? 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
