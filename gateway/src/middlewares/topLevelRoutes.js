import express from 'express';

const topLevelRouter = new express.Router();

topLevelRouter.all('/hz', (req, res) => {
  res.ok();
});

topLevelRouter.all('/', (req, res) => {
  res.ok();
});

export default topLevelRouter;