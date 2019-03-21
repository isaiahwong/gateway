import express from 'express';

const topLevelRouter = new express.Router();

topLevelRouter.all('/', (req, res) => {
  res.ok();
});

export default topLevelRouter;