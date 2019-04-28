module.exports = (req, res, next) => {
  if (req.path === '/restheaders') {
    Object.keys(req.headers).forEach((key) => {
      res.header(key, req.headers[key]);
    });
    next();
  }
  if (req.path !== '/headers') return next();
  res.json(req.headers);
  next();
};
