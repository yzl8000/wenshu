import app from './app';
import { env } from './common/env';

const port = parseInt(env.PORT, 10);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
