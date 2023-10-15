const app = require('./index');

require('dotenv').config()

const port = 3000 || process.env.SERVERPORT;
app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});