export default (req, res, next) => {
  if (req.path !== '/headers') return next();
  res.json(req.headers);
};
