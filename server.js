import express from 'express';
import profileRouter from './routes/profile.js';
import loginRouter from './routes/user-login.js';
import appLoginRouter from './routes/app-login.js';
import { authMiddleware } from './routes/user-login.js';
import cors from 'cors';

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(['/'], authMiddleware);

let userName = "Aayush";

app.get('/', (req, res) => {
  const loggedIn = res.locals.isAuthenticated;
  res.render('index', {loggedIn, userName });
});

app.use('/profile', profileRouter);
app.use('/', loginRouter);
app.use('/', appLoginRouter);

app.listen(process.env.PORT || port);