import { Router } from 'express';
import { compare } from 'bcrypt';
import User from '../models/UsersSchema';
import auth from '../middleware/auth';

const env = process.env.NODE_ENV || 'development';

const router = Router();

if (env === 'development') {
  router.get('/users', auth, async (_req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      res.status(500).send();
      res.json({ message: err });
    }
  });
}

// eslint-disable-next-line consistent-return
router.post('/users/signin', async (req, res) => {
  // Login a registered user
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    if (!user) {
      return res.status(401).send({ error: 'Login failed! Check authentication credentials' });
    }
    const token = await user.generateAuthToken();
    res.send({ email: user.email, name: user.name, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/users/signup', async (req, res) => {
  // Create a new user
  try {
    const user = new User(req.body);
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ email: user.email, name: user.name, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/users/me', auth, async (req, res) => {
  // View logged in user profile
  res.send({ email: req.user.email, name: req.user.name, createdAt: req.user.createdAt });
});

router.post('/users/logout', auth, async (req, res) => {
  // Log user out of the application
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/users/logoutall', auth, async (req, res) => {
  // Log user out of all devices
  try {
    req.user.tokens.splice(0, req.user.tokens.length);
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/users/delete', auth, async (req, res) => {
  if (compare(req.body.password, req.user.password)) {
    await User.findOneAndDelete({ name: req.body.name, email: req.body.email });
  }
  res.sendStatus(200);
});

router.post('/users/likeSong', auth, async (req, res) => {
  try {
    if (!req.user.likedSongs.includes(req.body.id)) {
      req.user.likedSongs.push(req.body.id);
      await req.user.save();
    } else {
      // eslint-disable-next-line no-throw-literal
      throw { error: 'already liked' };
    }
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/users/unlikeSong', auth, async (req, res) => {
  try {
    if (req.user.likedSongs.includes(req.body.id)) {
      const filteredArr = req.user.likedSongs.filter((item) => item !== req.body.id);
      req.user.likedSongs = filteredArr;
      await req.user.save();
      res.send();
    } else {
      // eslint-disable-next-line no-throw-literal
      throw { error: 'does not exists' };
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/users/isSongLiked', auth, (req, res) => {
  try {
    if (req.user.likedSongs.includes(req.body.id)) {
      res.send(true);
    } else {
      res.send(false);
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
